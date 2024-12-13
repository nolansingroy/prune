import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import moment from "moment";

const db = admin.firestore();

export const fetchAllEvents = functions.https.onRequest(async (req, res) => {
  const allEvents: any[] = [];
  const utcDateTimeNow = moment().utc();
  try {
    console.log("UTC TIME NOW ...", utcDateTimeNow.format("YYYY-MM-DD HH:mm:ss"));
    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const eventsSnapshot = await userDoc.ref.collection("events")
        .where("isBackgroundEvent", "==", false)
        .where("reminderDateTime", "!=", null)
        .get();
      
      eventsSnapshot.forEach(eventDoc => {
        const eventData = eventDoc.data();
        if (eventData.reminderDateTime) {
          const clientName = eventData.clientName;
          const reminderDateTimeUTC = moment(eventData.reminderDateTime.toDate()).utc();
          allEvents.push({
            clientName,
            reminderDateTime: reminderDateTimeUTC
          });
        }
      });
    }

    // Compare current time in UTC with reminderDateTimeUTC
    allEvents.forEach(event => {
      const reminderDateTime = event.reminderDateTime;
      if (utcDateTimeNow.isSame(reminderDateTime, 'minute')) {
        console.log(`Event for ${event.clientName} matches the current date and time:`, {
          clientName: event.clientName,
          reminderDateTime: reminderDateTime.format("YYYY-MM-DD HH:mm:ss")
        });
      } else {
        console.log(`Event for ${event.clientName} does not match the current date and time:`, {
          clientName: event.clientName,
          reminderDateTime: reminderDateTime.format("YYYY-MM-DD HH:mm:ss")
        });
      }
    });

    res.status(200).send(allEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Error fetching events");
  } finally {
    console.log("Fetched:", allEvents.length, "events");
  }
});