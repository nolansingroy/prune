import {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import { auth, db, doc } from "../../../firebase";
import { updateFireStoreEvent } from "../converters/events";
import { toast } from "sonner";

// an instance of the tooltip for each event { this is initialized to track the instances of the tooltip to prevent adding multiple instances of the tooltip to the same event }
const tippyInstances = new Map<string, any>();

//----------- A function to render the event content -----------//
export const checkOverlap = (
  event: {
    extendedProps: { isBackgroundEvent: any };
    start: { getTime: () => any };
    end: { getTime: () => any };
    id: any;
  },
  allEvents: any[]
) => {
  const isBackgroundEvent = event.extendedProps.isBackgroundEvent;
  if (isBackgroundEvent) return false;

  const eventStart = event.start.getTime();
  // const eventEnd = event.end.getTime();
  const eventEnd = event.end ? event.end.getTime() : eventStart;

  return allEvents.some((e) => {
    if (e.id !== event.id && e.extendedProps.isBackgroundEvent) {
      const bgStart = e.start.getTime();
      // const bgEnd = e.end.getTime();
      const bgEnd = e.end ? e.end.getTime() : bgStart;

      return (
        (eventStart >= bgStart && eventStart < bgEnd) ||
        (eventEnd > bgStart && eventEnd <= bgEnd) ||
        (eventStart <= bgStart && eventEnd >= bgEnd)
      );
    }
    return false;
  });
};

//----------- A function to render the event content -----------//

export const handleEventDidMount = (info: {
  view: { calendar: any };
  event: any;
  el: { classList: { add: (arg0: string) => void } };
}) => {
  const calendarApi = info.view.calendar;
  const allEvents = calendarApi.getEvents();

  // Check for overlap with background events
  if (checkOverlap(info.event, allEvents)) {
    info.el.classList.add("overlap-event");
  }

  // add a popOver to the event here
};

//----------- A function to render the event content -----------//
export const removeUndefinedFields = (obj: any) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as any);
};

//----------- A function to render the event content -----------//

export const renderEventContent = (eventInfo: EventContentArg) => {
  const {
    isBackgroundEvent,
    clientName,
    title,
    description,
    paid,
    type,
    location,
  } = eventInfo.event.extendedProps;

  // console.log("for month view props", eventInfo);

  const backgroundColor = eventInfo.backgroundColor || "#000000";

  const monthViw = eventInfo.view.type.includes("dayGridMonth");

  const classNames = eventInfo.event.classNames || [];
  const view = eventInfo.view.type;

  // console.log("==================================", eventInfo);

  if (isBackgroundEvent) {
  }

  if (classNames.includes("bg-event-mirror")) {
    return (
      <div className="bg-blue-200 opacity-50 text-black p-1 rounded text-center border">
        {eventInfo.event.title}
      </div>
    );
  }
  if (monthViw) {
    const defaultStartTimeLocal = new Date(eventInfo.event.startStr);
    let formattedStartTime = defaultStartTimeLocal.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Remove leading zero from the hour part
    formattedStartTime = formattedStartTime.replace(/^0(\d)/, "$1");
    return (
      <div className="flex gap-1 items-center w-full overflow-hidden">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: backgroundColor }}
        ></div>
        <div className="flex items-center truncate w-full font-semibold">
          <span className="text-xs">{formattedStartTime}</span>
          <span className="text-xs truncate ml-2">{clientName}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isBackgroundEvent && (
        <div>
          <span
            className="underline"
            ref={(el) => {
              if (el) {
                // Destroy existing tippy instance if it exists
                const existingInstance = tippyInstances.get(eventInfo.event.id);
                if (existingInstance) {
                  existingInstance.destroy();
                }

                // Create new tippy instance
                const tippyInstance = tippy(el, {
                  trigger: "mouseenter", // Change trigger to 'mouseenter' for hover
                  touch: "hold",
                  allowHTML: true,
                  content: `
                    <div class="tippy-content">
                      <p class="${paid ? "paid-status" : "unpaid-status"}">
                        <strong>${paid ? "Paid" : "Unpaid"}</strong>
                      </p>
                      <p><strong>Notes:</strong> ${description}</p>
                    </div>
                  `,
                  theme: "custom", // Apply custom theme
                });

                // Store the new tippy instance in the Map
                tippyInstances.set(eventInfo.event.id, tippyInstance);
              }
            }}
          >
            <span className="flex items-center truncate w-full font-bold">
              {clientName || "No name"}
            </span>
          </span>
        </div>
      )}
    </>
  );
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

  try {
    if (!eventData.recurrence || eventData.recurrence.daysOfWeek.length === 0) {
      console.log("updating event in firebase");
      if (!eventData.id) {
        throw new Error("Event ID is missing");
      }
      const eventInput = {
        type: eventData.type,
        typeId: eventData.typeId,
        fee: eventData.fee,
        clientId: eventData.clientId,
        clientName: eventData.clientName,
        description: eventData.description,
        location: eventData.location || "",
        isBackgroundEvent: eventData.isBackgroundEvent,
        start: startDateTime,
        end: endDateTime,
        startDate: startDateTime,
        endDate: endDateTime,
        startDay: startDay,
        endDay: endDay,
        paid: eventData.paid,
      };

      try {
        await updateFireStoreEvent(userId!, eventData.id, eventInput);
        toast.success("Booking event updated successfully");
      } catch (error) {
        console.error("Error saving event:", error);
        toast.error("Error editing booking event");
      }

      console.log("Single event updated in Firestore");
    } else {
      // update the event in firebase instead of creating a new one
      console.log("updating event in firebase recurring event");
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
        description: eventData.description,
        location: eventData.location || "",
        isBackgroundEvent: eventData.isBackgroundEvent,
        start: startDateTime,
        end: endDateTime,
        startDate: startDateTime,
        endDate: endDateTime,
        startDay: startDay,
        endDay: endDay,
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
        console.error("Error saving event:", error);
        toast.error("Error editing booking event");
      }
    }
  } catch (error) {
    console.error("Error saving event:", error);
  }
};

//----------------------------------------------------------//
