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
  try {
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
        console.log(`Event for ${event.clientName} does not match the current date and time window:`, {
          clientName: event.clientName,
          reminderDateTime: reminderDateTime.format("YYYY-MM-DD HH:mm:ss"),
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
