import axios from "axios";
import { toast } from "sonner";
import { removeUndefinedFields } from "./global";
import { EventInput } from "@/interfaces/event";
import {
  createFireStoreEvent,
  updateFireStoreEvent,
} from "../converters/events";
import { cloudFunctions } from "@/constants/data";
import { DateSelectArg } from "@fullcalendar/core";

export const handleRecurringEvent = async ({
  title,
  type,
  typeId,
  fee,
  clientId,
  clientName,
  coachId,
  description,
  isBackgroundEvent,
  startDate,
  startTime,
  endTime,
  paid,
  recurrence,
  userTimeZone,
  user,
}: {
  title: string;
  type: string;
  typeId: string;
  fee: number;
  clientId: string;
  clientName: string;
  coachId: string;
  description: string;
  isBackgroundEvent: boolean;
  startDate: string;
  startTime: string;
  endTime: string;
  paid: boolean;
  recurrence: {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    startRecur: string;
    endRecur: string;
  };
  userTimeZone: string;
  user: { uid: string };
}): Promise<any> => {
  const startRecur = new Date(recurrence.startRecur);
  const endRecur = new Date(recurrence.endRecur || startDate);
  endRecur.setDate(endRecur.getDate() + 1);

  const eventInput = {
    title: title || "",
    description: description || "",
    coachId: coachId,
    startDate,
    startTime,
    endTime,
    recurrence: {
      daysOfWeek: recurrence.daysOfWeek,
      startRecur: startRecur.toISOString().split("T")[0] || startDate,
      endRecur: endRecur.toISOString().split("T")[0],
    },
    userId: user.uid,
    userTimeZone,
    ...(isBackgroundEvent
      ? {}
      : {
          fee: fee || 0,
          type: type || "No type",
          typeId: typeId || "",
          clientId: clientId || "",
          clientName: clientName || "",
          paid: paid,
        }),
  };

  // console.log("Recurring event data ready for Firestore:", eventInput);

  const url = isBackgroundEvent
    ? cloudFunctions.recurringAvailabilitiesProd
    : cloudFunctions.recurringBookingsProd;

  try {
    const result = await axios.post(url, eventInput);
    // console.log("Recurring instances created:", result.data);
    return result.data;
  } catch (error) {
    // console.error("Error saving recurring event:", error);
    throw error;
  }
};

export const handleSingleEvent = async ({
  title,
  type,
  typeId,
  fee,
  clientId,
  clientName,
  coachId,
  description,
  isBackgroundEvent,
  date,
  startTime,
  endTime,
  selectInfo,
  paid,
  user,
}: {
  title: string;
  type: string;
  typeId: string;
  fee: number;
  clientId: string;
  clientName: string;
  coachId: string;
  description: string;
  date?: string;
  isBackgroundEvent: boolean;
  startTime: string;
  endTime: string;
  selectInfo: DateSelectArg;
  paid: boolean;
  user: { uid: string };
}): Promise<EventInput> => {
  let startDateTime = new Date(
    date ? `${date}T${startTime}:00` : selectInfo.startStr
  );
  let endDateTime = new Date(
    date ? `${date}T${endTime}:00` : selectInfo.startStr
  );

  if (startTime && endTime) {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    startDateTime.setHours(startHour, startMinute, 0, 0);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    if (endDateTime <= startDateTime) {
      // console.log("End time is before start time");
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
  }

  const startDay = startDateTime.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const endDay = endDateTime.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const event = {
    id: "",
    title,
    coachId,
    start: startDateTime,
    end: endDateTime,
    description,
    display: isBackgroundEvent ? "inverse-background" : "auto",
    className: isBackgroundEvent ? "custom-bg-event" : "",
    isBackgroundEvent,
    startDate: startDateTime,
    startDay,
    endDate: endDateTime,
    endDay,
    ...(isBackgroundEvent
      ? {}
      : {
          fee: fee,
          type: type,
          typeId: typeId,
          clientId: clientId,
          clientName: clientName,
          paid: paid,
        }),
  };

  try {
    // console.log("Single event data ready for Firestore:", event);
    const cleanedEvent = removeUndefinedFields(event);
    // console.log("Event data before submitting to firebase:", cleanedEvent);

    await createFireStoreEvent(user.uid, cleanedEvent);
    return cleanedEvent;
  } catch (error) {
    // console.error("Error saving event:", error);
    throw error;
  }
};

//----------- A function that control updating a new event  -----------//

export const updatEventFormDialog = async (
  eventData: {
    id?: string;
    type: string;
    typeId: string;
    fee: number;
    clientId: string;
    clientName: string;
    coachId: string;
    description: string;
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
  userId: string
) => {
  let startDateTime = new Date(`${eventData.date}T${eventData.startTime}`);
  let endDateTime = new Date(`${eventData.date}T${eventData.endTime}`);

  if (eventData.startTime && eventData.endTime) {
    const [startHour, startMinute] = eventData.startTime.split(":").map(Number);
    const [endHour, endMinute] = eventData.endTime.split(":").map(Number);

    startDateTime.setHours(startHour, startMinute, 0, 0);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    // Ensure end time is after the start time
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
  }

  const startDay = startDateTime.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const endDay = endDateTime.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const reminder = new Date(`${eventData.date}T${eventData.startTime}`);
  reminder.setDate(reminder.getDate() - 1);
  reminder.setHours(8, 0, 0, 0);

  try {
    if (!eventData.recurrence || eventData.recurrence.daysOfWeek.length === 0) {
      // console.log("updating event in firebase");
      if (!eventData.id) {
        throw new Error("Event ID is missing");
      }
      const eventInput = {
        type: eventData.type,
        typeId: eventData.typeId,
        fee: eventData.fee,
        clientId: eventData.clientId,
        clientName: eventData.clientName,
        coachId: eventData.coachId,
        description: eventData.description,
        // location: eventData.location || "",
        isBackgroundEvent: eventData.isBackgroundEvent,
        start: startDateTime,
        end: endDateTime,
        startDate: startDateTime,
        endDate: endDateTime,
        startDay: startDay,
        endDay: endDay,
        reminderDateTime: reminder,
        paid: eventData.paid,
      };

      try {
        await updateFireStoreEvent(userId!, eventData.id, eventInput);
        toast.success("Booking event updated successfully");
      } catch (error) {
        // console.error("Error saving event:", error);
        toast.error("Error editing booking event");
      }

      // console.log("Single event updated in Firestore");
    } else {
      // update the event in firebase instead of creating a new one
      // console.log("updating event in firebase recurring event");
      if (!eventData.id) {
        throw new Error("Event ID is missing");
      }

      const startRecur = new Date(eventData.recurrence?.startRecur);
      const endRecur = new Date(eventData.recurrence?.endRecur);
      endRecur.setDate(endRecur.getDate() + 1);

      // convert startRecur and endRecur to strings
      const startRecurString = startRecur.toISOString().split("T")[0];
      const endRecurString = endRecur.toISOString().split("T")[0];

      const eventInput = {
        type: eventData.type,
        typeId: eventData.typeId,
        fee: eventData.fee,
        clientId: eventData.clientId,
        clientName: eventData.clientName,
        coachId: eventData.coachId,
        description: eventData.description,
        // location: eventData.location || "",
        isBackgroundEvent: eventData.isBackgroundEvent,
        start: startDateTime,
        end: endDateTime,
        startDate: startDateTime,
        endDate: endDateTime,
        startDay: startDay,
        endDay: endDay,
        reminderDateTime: reminder,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        paid: eventData.paid,
        recurrence: {
          daysOfWeek: eventData.recurrence?.daysOfWeek || [],
          startRecur: startRecurString,
          endRecur: endRecurString,
        },
        userId: userId!,
      };

      try {
        await updateFireStoreEvent(userId!, eventData.id, eventInput);
        toast.success("Booking event updated successfully");
      } catch (error) {
        // console.error("Error saving event:", error);
        toast.error("Error editing booking event");
      }
    }
  } catch (error) {
    // console.error("Error saving event:", error);
  }
};
