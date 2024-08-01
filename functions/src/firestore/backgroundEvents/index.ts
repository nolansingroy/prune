import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Check if Firebase app is already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Firestore onCreate function
export const onBackgroundEvents = functions.firestore
  .document("users/{userId}/events/{eventId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    const userId = context.params.userId;
    const eventId = context.params.eventId;

    // Check if 'isBackgroundEvent' is true and 'isDuplicate' is not true
    if (data && data.isBackgroundEvent === true && data.isDuplicate !== true) {
      // Log the document ID
      console.log("New background event document created:", eventId);

      try {
        // Reference to the same subcollection 'events' under the specific user
        const newDocRef = snapshot.ref.parent.doc();

        // Set the fields and values for the new document
        const newData = {
          ...data, // copy all fields from the original document
          userId, // add the userId
          originalEventId: eventId, // add the original event ID
          id: newDocRef.id,
          className: "bg-event-mirror",
          isDuplicate: true,
        };

        console.log("New data for the document:", newData);

        // Set the data for the new document
        // await newDocRef.set(newData);

        console.log("New document created:", newDocRef.id);
      } catch (error) {
        console.error("Error creating BG event mirror document:", error);
      }
    } else {
      console.log("New event is not a background event or is a duplicate");
    }

    return null;
  });
