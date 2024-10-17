import { db, doc, updateDoc } from "../../../firebase";
import axios from "axios";

export const handleUpdatEventFormDialog = async (
  eventData: {
    id?: string;
    type: string;
    typeId: string;
    fee: number;
    clientId: string;
    clientName: string;
    description: string;
    location: string;
    isBackgroundEvent: boolean;
    date?: string;
    startTime: string;
    endTime: string;
    paid: boolean;
    recurrence?: {
      daysOfWeek: number[];
      startRecur: string; // YYYY-MM-DD
      endRecur: string; // YYYY-MM-DD
    };
  },
  userId: string,
) => {
  try {
    const startDate = eventData.date || new Date().toISOString().split("T")[0];

    // Helper function to adjust for time zone offset and return UTC date
    const adjustToUTC = (dateTime: Date) => {
      const timezoneOffset = dateTime.getTimezoneOffset(); // Timezone offset in minutes
      return new Date(dateTime.getTime() - timezoneOffset * 60 * 1000); // Adjust to UTC
    };

    // Check if the event is recurring or a single event
    if (!eventData.recurrence || eventData.recurrence.daysOfWeek.length === 0) {
      // update the event in firebase instead of creating a new one
      console.log("updating event in firebase");
      if (!eventData.id) {
        throw new Error("Event ID is missing");
      }
      const eventRef = doc(db, "users", userId, "events", eventData.id);

      // Parse the start and end times
      let startDateTime = new Date(`${startDate}T${eventData.startTime}`);
      let endDateTime = new Date(`${startDate}T${eventData.endTime}`);

      // Ensure the end time is after the start time
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      // Adjust the start and end times to UTC
      startDateTime = adjustToUTC(startDateTime);
      endDateTime = adjustToUTC(endDateTime);

      // Create a new event object
      const eventInput = {
        type: eventData.type,
        typeId: eventData.typeId,
        fee: eventData.fee,
        clientId: eventData.clientId,
        clientName: eventData.clientName,
        description: eventData.description,
        location: eventData.location || "",
        isBackgroundEvent: eventData.isBackgroundEvent,
        start: startDateTime, // Save in UTC
        end: endDateTime, // Save in UTC
        paid: eventData.paid,
        updated_at: new Date(), // Timestamp of last update
      };

      console.log("evenRef", eventRef);

      // Save the event directly to Firestore
      await updateDoc(eventRef, eventInput);

      console.log("Single event updated in Firestore");
    } else {
      // update the event in firebase instead of creating a new one
      console.log("updating event in firebase recurring event");
      if (!eventData.id) {
        throw new Error("Event ID is missing");
      }
      const eventRef = doc(db, "users", userId, "events", eventData.id);

      // Add 2 days to the endRecur date to ensure the last day is included
      const endRecur = new Date(eventData.recurrence?.endRecur || startDate);
      endRecur.setDate(endRecur.getDate() + 2);

      const eventInput = {
        type: eventData.type,
        typeId: eventData.typeId,
        fee: eventData.fee,
        clientId: eventData.clientId,
        clientName: eventData.clientName,
        description: eventData.description,
        location: eventData.location || "",
        startDate,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        paid: eventData.paid,
        recurrence: {
          daysOfWeek: eventData.recurrence?.daysOfWeek || [],
          startRecur: eventData.recurrence?.startRecur || startDate,
          endRecur: adjustToUTC(endRecur).toISOString().split("T")[0],
        },
        userId: userId,
      };

      console.log("evenRef", eventRef);

      // Save the event directly to Firestore
      await updateDoc(eventRef, eventInput);

      console.log("Recurring event updated in Firestore");
    }
  } catch (error) {
    console.error("Error saving event:", error);
  }
};