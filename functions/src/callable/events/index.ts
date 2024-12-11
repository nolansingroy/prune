import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import moment from "moment";

const db = admin.firestore();

export const fetchAllEvents = functions.https.onRequest(async (req, res) => {
  const allEvents: any[] = [];
  const utcDateTimeNow = moment().utc().format();
  try {
    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      // const userData = userDoc.data();
      

      const eventsSnapshot = await userDoc.ref.collection("events")
        .where("isBackgroundEvent", "==", false)
        .where("reminderDateTime", "!=", null)
        .get();
      
      eventsSnapshot.forEach(eventDoc => {
        const eventData = eventDoc.data();
        if (eventData.reminderDateTime) {
          const clientName = eventData.clientName;
          const reminderDateTimeUTC = moment(eventData.reminderDateTime.toDate()).utc().format();
          allEvents.push({
            clientName,
            reminderDateTime: reminderDateTimeUTC
          });
        }
      });
    }

    console.log("Fetched all events:", allEvents);

    res.status(200).send(allEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Error fetching events");
  } finally {
    console.log("Fetched:", allEvents.length, "events");
  }
});