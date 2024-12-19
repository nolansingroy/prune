/* eslint-disable max-len */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import moment from "moment-timezone";

const db = admin.firestore();

type allEvents = {
  clientName: string;
  reminderDateTime: moment.Moment;
  clientPhone: string;
  eventDocRef: FirebaseFirestore.DocumentReference;
}

export const fetchAllEvents = functions.https.onRequest(async (req, res) => {
  const startTime = moment();
  const allEvents: allEvents[] = [];
  const utcDateTimeNow = moment().utc();
  const fiveMinutesAgo = utcDateTimeNow.clone().subtract(5, "minutes");
  const fiveMinutesLater = utcDateTimeNow.clone().add(5, "minutes");

  // Calculate the start and end of the current day in PST
  const pacificTimeNow = moment.tz("America/Los_Angeles");
  const startOfDayPST = pacificTimeNow.clone().startOf("day");
  const endOfDayPST = pacificTimeNow.clone().endOf("day");
  const targetTime = pacificTimeNow.clone().set({hour: 8, minute: 0, second: 0, millisecond: 0});
  const timeUntilTarget = targetTime.diff(pacificTimeNow);
  try {
    console.log("UTC TIME NOW ...", utcDateTimeNow.format("YYYY-MM-DD HH:mm:ss"));
    console.log("Pacific Time Now ...", pacificTimeNow.format("YYYY-MM-DD HH:mm:ss"));
    console.log("Start of Day PST ...", startOfDayPST.format("YYYY-MM-DD HH:mm:ss"));
    console.log("End of Day PST ...", endOfDayPST.format("YYYY-MM-DD HH:mm:ss"));
    console.log("Time until 7:00 AM Pacific Time ...", moment.duration(timeUntilTarget).humanize());
    console.log("UTC TIME NOW ...", utcDateTimeNow.format("YYYY-MM-DD HH:mm:ss"));

    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const eventsSnapshot = await userDoc.ref.collection("events")
        .where("isBackgroundEvent", "==", false)
        .where("reminderDateTime", "!=", null)
        .where("reminderSent", "==", false)
        .where("reminderDateTime", ">=", startOfDayPST.toDate())
        .where("reminderDateTime", "<=", endOfDayPST.toDate())
        // .where("client.clientOptOff", "==", false)
        // .where("client.sms", "==", true)
        .get();

      if (!eventsSnapshot.empty) {
        for (const eventDoc of eventsSnapshot.docs) {
          const eventData = eventDoc.data();
          const coachId = eventData.coachId;
          const clientId = eventData.clientId;
          const reminderDateTimeUTC = moment(eventData.reminderDateTime.toDate()).utc();

          // Fetch client details
          const clientDoc = await db.collection(`users/${coachId}/clients`).doc(clientId).get();
          if (clientDoc.exists) {
            const clientData = clientDoc.data();
            if (clientData) {
              const clientName = clientData.firstName;
              const clientPhone = clientData.phoneNumber;

              allEvents.push({
                clientName,
                clientPhone,
                reminderDateTime: reminderDateTimeUTC,
                eventDocRef: eventDoc.ref,
              });

              // Log the time remaining for each event to be eligible for sending text messages
              const timeUntilReminder = reminderDateTimeUTC.diff(utcDateTimeNow);
              const duration = moment.duration(timeUntilReminder);
              const hours = Math.floor(duration.asHours());
              const minutes = duration.minutes();
              const seconds = duration.seconds();
              console.log(`Time until reminder for ${clientName}: ${hours} hours, ${minutes} minutes, ${seconds} seconds`);
            }
          }
        }
      }
    }

    // Compare current time in UTC with reminderDateTimeUTC within a 5-minute window
    for (const event of allEvents) {
      console.log("Checking event:", event);
      const reminderDateTime = event.reminderDateTime;
      if (reminderDateTime.isBetween(fiveMinutesAgo, fiveMinutesLater, "minute", "[]")) {
        console.log(`Event for ${event.clientName} matches the current date and time window:`, {
          clientName: event.clientName,
          reminderDateTime: reminderDateTime.format("YYYY-MM-DD HH:mm:ss"),
        });

        // Send SMS reminder
        // sms reminder here

        // Update the event document to mark it as processed
        // await event.eventDocRef.update({reminderSent: true});
      } else {
        const timeUntilEligible = reminderDateTime.diff(utcDateTimeNow);
        const duration = moment.duration(timeUntilEligible);
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        const seconds = duration.seconds();
        console.log(`Event for ${event.clientName} does not match the current date and time window:`, {
          clientName: event.clientName,
          reminderDateTime: reminderDateTime.format("YYYY-MM-DD HH:mm:ss"),
          timeUntilEligible: `${hours} hours, ${minutes} minutes, ${seconds} seconds`,
        });
      }
    }

    res.status(200).send(allEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Error fetching events");
  } finally {
    const endTime = moment(); // Capture the end time
    const duration = moment.duration(endTime.diff(startTime));
    const seconds = duration.asSeconds();
    console.log(`Function execution time: ${seconds} seconds`);
    console.log("Fetched:", allEvents.length, "events");
  }
});
