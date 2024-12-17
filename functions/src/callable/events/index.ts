import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import moment from "moment";

const db = admin.firestore();


type allEvents = {
  clientName: string;
  reminderDateTime: moment.Moment;
  clientPhone: string;
  eventDocRef: FirebaseFirestore.DocumentReference;
}

export const fetchAllEvents = functions.https.onRequest(async (req, res) => {
  const allEvents: allEvents[] = [];
  const utcDateTimeNow = moment().utc();
  const fiveMinutesAgo = utcDateTimeNow.clone().subtract(5, "minutes");
  const fiveMinutesLater = utcDateTimeNow.clone().add(5, "minutes");

  // Calculate the time remaining until 7:00 AM Pacific Time
  const pacificTimeNow = moment.tz("America/Los_Angeles");
  const targetTime = pacificTimeNow.clone().set({hour: 7, minute: 0, second: 0, millisecond: 0});
  const timeUntilTarget = targetTime.diff(pacificTimeNow);
  try {
    console.log("UTC TIME NOW ...", utcDateTimeNow.format("YYYY-MM-DD HH:mm:ss"));
    console.log("Pacific Time Now ...", pacificTimeNow.format("YYYY-MM-DD HH:mm:ss"));
    console.log("Time until 7:00 AM Pacific Time ...", moment.duration(timeUntilTarget).humanize());
    console.log("UTC TIME NOW ...", utcDateTimeNow.format("YYYY-MM-DD HH:mm:ss"));

    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const eventsSnapshot = await userDoc.ref.collection("events")
        .where("isBackgroundEvent", "==", false)
        .where("reminderDateTime", "!=", null)
        .where("reminderSent", "==", false)
        .where("client.clientOptOff", "==", false)
        .where("client.sms", "==", true)
        .get();

      eventsSnapshot.forEach((eventDoc) => {
        const eventData = eventDoc.data();
        if (eventData.reminderDateTime && eventData.client && eventData.client.intPhoneNumber) {
          const clientName = eventData.client.fullName;
          const clientPhone = eventData.client.intPhoneNumber;
          const reminderDateTimeUTC = moment(eventData.reminderDateTime.toDate()).utc();
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
      });
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
        console.log(`Event for ${event.clientName} does not match the current date and time window:`, {
          clientName: event.clientName,
          reminderDateTime: reminderDateTime.format("YYYY-MM-DD HH:mm:ss"),
          timeUntilEligible: moment.duration(timeUntilEligible).humanize(),
        });
      }
    }

    res.status(200).send(allEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Error fetching events");
  } finally {
    console.log("Fetched:", allEvents.length, "events");
  }
});
