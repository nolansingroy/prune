"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import rrulePlugin from "@fullcalendar/rrule";
import {
  DateSelectArg,
  EventApi,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import EventFormDialog from "../../../comp/EventFormModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Availability from "../../../comp/tabs/availability";
import CreateBookings from "../../../comp/tabs/create_bookings";
import { auth, db } from "../../../../firebase";
import { createEvent } from "../../../services/userService";
import useFetchEvents from "../../../hooks/useFetchEvents";
import { EventInput } from "../../../interfaces/types";
import { addDoc, getDoc, Timestamp } from "firebase/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { collection, query, getDocs } from "firebase/firestore";
import { EventResizeDoneArg } from "@fullcalendar/interaction";
import { EventDropArg } from "@fullcalendar/core";
import axios from "axios";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { cl } from "@fullcalendar/core/internal-common";
import { useFirebaseAuth } from "@/services/authService";
import CreateBookingsFormDialog from "@/comp/CreateBookingsFormDialog";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
// import { adjustForLocalTimezone } from "@/lib/functions/time-functions";
// import { handleUpdatEventFormDialog } from "@/lib/functions/event-functions";
import { Auth } from "firebase/auth";

// an instance of the tooltip for each event { this is initialized to track the instances of the tooltip to prevent adding multiple instances of the tooltip to the same event }
const tippyInstances = new Map<string, any>();

export default function Calendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectInfo, setSelectInfo] = useState<DateSelectArg | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventInput | null>(null);
  const [editAll, setEditAll] = useState(false); // New state to control if we're editing all instances
  const [loading, setLoading] = useState(false); // New loading state
  const [calendarKey, setCalendarKey] = useState(0); // a stet variable to check if the calendar is re-rendered

  useEffect(() => {
    console.log("Calendar re-rendered with key:", calendarKey); // Log calendar re-render
  }, [calendarKey]);

  const {
    events: fetchedEvents,
    loading: eventsLoading,
    fetchEvents,
  } = useFetchEvents();
  const [events, setEvents] = useState<EventInput[]>([]);

  useEffect(() => {
    setEvents(fetchedEvents);
  }, [fetchedEvents]);

  // Fetch events on page load - fix calendar blank screen no fetch on refresh
  useEffect(() => {
    window.onload = () => {
      fetchEvents(); // Trigger the fetch events after the page has fully loaded
    };
  }, []);

  const handleTabChange = (value: string) => {
    if (value === "calendar") {
      fetchEvents(); // Force fetch events when the calendar tab is clicked
    }
  };

  const renderEventContent = (eventInfo: EventContentArg) => {
    const { isBackgroundEvent, clientName, title, description, paid, type } =
      eventInfo.event.extendedProps;

    // console.log("for month view props", eventInfo);

    const backgroundColor = eventInfo.backgroundColor || "#000000";

    const monthViw = eventInfo.view.type.includes("dayGridMonth");

    const classNames = eventInfo.event.classNames || [];
    const view = eventInfo.view.type;

    // console.log("==================================", eventInfo);

    // i want to remove fc-bg-event from the background events
    if (isBackgroundEvent) {
    }

    if (classNames.includes("bg-event-mirror")) {
      return (
        <div className="bg-blue-200 opacity-50 text-black p-1 rounded text-center border">
          {eventInfo.event.title}
        </div>
      );
    }

    // if (classNames.includes("bg-event-mirror")) {
    //   return (
    //     <div className="bg-black opacity-50 text-black p-1 rounded text-center h-max w-max">
    //       {description}
    //     </div>
    //   );
    // }

    if (monthViw) {
      const defaultStartTimeUTC = new Date(eventInfo.event.startStr);
      const timezoneOffsetHours = -(new Date().getTimezoneOffset() / 60);
      const defaultStartTimeLocal = new Date(defaultStartTimeUTC);
      defaultStartTimeLocal.setHours(
        defaultStartTimeUTC.getHours() - timezoneOffsetHours
      );
      // Convert times to string format using local time (e.g., "10:00" in local time)
      const formattedStartTime = defaultStartTimeLocal.toLocaleTimeString(
        "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      );

      console.log("startTime", formattedStartTime);
      // return a row with a smale circle which has a color of the type of the event and next to it the start time of the event and next to it the client name
      return (
        <div className="flex gap-1 items-center w-full overflow-hidden">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: backgroundColor }}
          ></div>
          <div className="flex items-center truncate w-full">
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
                  const existingInstance = tippyInstances.get(
                    eventInfo.event.id
                  );
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
              <span className="flex items-center truncate w-full">
                {clientName || "No name"}
              </span>
            </span>
          </div>
        )}
      </>
    );
  };

  // add event to firestore
  const handleEventResize = async (resizeInfo: EventResizeDoneArg) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const eventRef = doc(
          db,
          "users",
          user.uid,
          "events",
          resizeInfo.event.id
        );

        const startDay = resizeInfo.event.start?.toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "UTC",
        });
        const endDay = resizeInfo.event.end
          ? resizeInfo.event.end.toLocaleDateString("en-US", {
              weekday: "long",
              timeZone: "UTC",
            })
          : "";

        const startDateUTC = resizeInfo.event.start
          ? new Date(resizeInfo.event.start.toISOString())
          : null;
        const endDateUTC = resizeInfo.event.end
          ? new Date(resizeInfo.event.end.toISOString())
          : null;

        await updateDoc(eventRef, {
          start: startDateUTC,
          end: endDateUTC,
          startDate: startDateUTC,
          endDate: endDateUTC,
          startDay: startDay,
          endDay: endDay,
          updated_at: Timestamp.now(),
        });
        // Update the local state to reflect the changes
        setEvents((prevEvents) => {
          const updatedEvents = prevEvents.map((event) => {
            if (event.id === resizeInfo.event.id) {
              return {
                ...event,
                start: startDateUTC!,
                end: endDateUTC!,
                startDate: startDateUTC!,
                endDate: endDateUTC!,
                startDay: startDay!,
                endDay: endDay,
              };
            }
            return event;
          });
          console.log("Updated Events:", updatedEvents); // Log updated events
          return updatedEvents;
        });

        // Force calendar re-render by updating a key or state variable
        // setCalendarKey((prevKey) => {
        //   const newKey = prevKey + 1;
        //   console.log("Calendar Key Updated:", newKey); // Log calendar key update
        //   return newKey;
        // });
      }
    } catch (error) {
      console.error("Error updating event in Firestore:", error);
    }
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const eventRef = doc(
          db,
          "users",
          user.uid,
          "events",
          dropInfo.event.id
        );

        const startDay = dropInfo.event.start
          ? dropInfo.event.start.toLocaleDateString("en-US", {
              weekday: "long",
              timeZone: "UTC",
            })
          : "";
        const endDay = dropInfo.event.end
          ? dropInfo.event.end.toLocaleDateString("en-US", {
              weekday: "long",
              timeZone: "UTC",
            })
          : "";

        const startDateUTC = dropInfo.event.start
          ? new Date(dropInfo.event.start.toISOString())
          : null;
        const endDateUTC = dropInfo.event.end
          ? new Date(dropInfo.event.end.toISOString())
          : null;

        await updateDoc(eventRef, {
          start: startDateUTC,
          end: endDateUTC,
          startDate: startDateUTC,
          endDate: endDateUTC,
          startDay: startDay,
          endDay: endDay,
          updated_at: Timestamp.now(),
        });

        // Update the local state to reflect the changes
        setEvents((prevEvents) => {
          const updatedEvents = prevEvents.map((event) => {
            if (event.id === dropInfo.event.id) {
              return {
                ...event,
                start: startDateUTC!,
                end: endDateUTC!,
                startDate: startDateUTC!,
                endDate: endDateUTC!,
                startDay: startDay!,
                endDay: endDay,
              };
            }
            return event;
          });
          console.log("Updated Events:", updatedEvents); // Log updated events
          return updatedEvents;
        });
      }
    } catch (error) {
      console.error("Error updating event in Firestore:", error);
    }
  };

  // const handleSelect = (selectInfo: DateSelectArg) => {
  //   setSelectInfo(selectInfo);
  //   setEditingEvent(null); // Clear editing event
  //   setIsDialogOpen(true);
  // };

  const handleSelect = (selectInfo: DateSelectArg) => {
    setSelectInfo(selectInfo);

    // FullCalendar provides the date in UTC, so we need to adjust for the local timezone
    const defaultStartTimeUTC = new Date(selectInfo.startStr);
    const defaultEndTimeUTC = new Date(selectInfo.endStr); // Use the correct end time from selectInfo

    // Get the timezone offset in hours
    const timezoneOffsetHours = -(new Date().getTimezoneOffset() / 60); // getTimezoneOffset returns minutes, convert to hours

    // Adjust UTC times to local times by subtracting the timezone offset
    const defaultStartTimeLocal = new Date(defaultStartTimeUTC);
    defaultStartTimeLocal.setHours(
      defaultStartTimeUTC.getHours() - timezoneOffsetHours
    );

    const defaultEndTimeLocal = new Date(defaultEndTimeUTC);
    defaultEndTimeLocal.setHours(
      defaultEndTimeUTC.getHours() - timezoneOffsetHours
    );

    // Convert times to string format using local time (e.g., "10:00" in local time)
    const formattedStartTime = defaultStartTimeLocal.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }); // Local time
    const formattedEndTime = defaultEndTimeLocal.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }); // Local time

    // Derive the day of the week from startDate
    const defaultStartDay = defaultStartTimeLocal.toLocaleDateString("en-US", {
      weekday: "long",
    });

    setEditingEvent((prevState) => {
      // Ensure required fields like `title`, `startDate`, and `isBackgroundEvent` are preserved
      const updatedEvent: EventInput = {
        id: prevState?.id,
        ...prevState, // Preserve previous state
        title: prevState?.title || "", // Ensure title is not undefined
        fee: prevState?.fee || 0,
        clientId: prevState?.clientId || "",
        clientName: prevState?.clientName || "",
        type: prevState?.type || "No type", // Ensure title is not undefined
        typeId: prevState?.type || "", // Ensure title is not undefined
        isBackgroundEvent: prevState?.isBackgroundEvent ?? false, // Ensure isBackgroundEvent is a boolean (default to false)
        start:
          prevState?.start instanceof Date
            ? prevState.start
            : defaultStartTimeLocal, // Ensure start is a Date object in local time
        end:
          prevState?.end instanceof Date ? prevState.end : defaultEndTimeLocal, // Use the correct end time from selectInfo
        startDate: defaultStartTimeLocal, // Store startDate as the local Date object
        endDate: defaultEndTimeLocal, // Store endDate as the local Date object
        startDay: prevState?.startDay || defaultStartDay, // Ensure startDay is derived from startDate if not already present
        endDay:
          prevState?.endDay ||
          defaultEndTimeLocal.toLocaleDateString("en-US", { weekday: "long" }), // Derive endDay from endDate if not present
        recurrence: undefined, // Set recurrence to undefined to prevent auto-selection
      };
      return updatedEvent;
    });

    setIsDialogOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const { event } = clickInfo;
    const { extendedProps, start, end } = event;

    if (start && end) {
      // const localStart = adjustForLocalTimezone(start);
      // const localEnd = adjustForLocalTimezone(end);

      const timezoneOffsetHours = -(new Date().getTimezoneOffset() / 60);

      const localStart = new Date(start);
      localStart.setHours(start.getHours() - timezoneOffsetHours);

      const localEnd = new Date(end);
      localEnd.setHours(end.getHours() - timezoneOffsetHours);

      setEditingEvent({
        ...event,
        id: event.id,
        start: localStart,
        end: localEnd,
        title: extendedProps.title || "", // Add other required properties here
        type: extendedProps.type || "",
        typeId: extendedProps.typeId || "",
        clientId: extendedProps.clientId || "",
        clientName: extendedProps.clientName || "",
        description: extendedProps.description || "",
        location: extendedProps.location || "",
        isBackgroundEvent: extendedProps.isBackgroundEvent || false,
        fee: extendedProps.fee || 0,
        paid: extendedProps.paid || false,
        startDate: localStart,
        startDay: localStart.toLocaleDateString("en-US", {
          weekday: "long",
        }),
        endDate: localEnd,
        endDay: localEnd.toLocaleDateString("en-US", {
          weekday: "long",
        }),
        recurrence: extendedProps.recurrence || undefined,
      });
      setEditAll(true); // Set editAll to true for now
      setIsDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectInfo(null);
    setEditingEvent(null);
    setEditAll(false);
  };

  const removeUndefinedFields = (obj: any) => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
  };

  const handleSave = async ({
    title,
    type,
    typeId,
    fee,
    clientId,
    clientName,
    description,
    location,
    isBackgroundEvent,
    date,
    startTime,
    endTime,
    paid,
    recurrence,
  }: {
    title: string;
    type: string;
    typeId: string;
    description: string;
    clientId: string;
    clientName: string;
    location: string;
    isBackgroundEvent: boolean;
    startTime: string;
    endTime: string;
    paid: boolean;
    date?: string;
    fee: number;
    recurrence?: {
      daysOfWeek: number[];
      startTime: string;
      endTime: string;
      startRecur: string;
      endRecur: string;
    };
  }) => {
    if (!selectInfo) return;

    let calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    // Format the start and end dates based on the event selection
    const startDate = date
      ? new Date(date).toISOString().split("T")[0]
      : new Date(selectInfo.startStr).toISOString().split("T")[0];

    setLoading(true); // Start loading

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      // If this is a recurring event, handle it using the cloud function
      if (
        recurrence &&
        recurrence.daysOfWeek &&
        recurrence.daysOfWeek.length > 0
      ) {
        // Adjust end recurrence date
        const endRecur = new Date(recurrence.endRecur || startDate);
        endRecur.setDate(endRecur.getDate() + 1);

        //check if its a background event before making the axios call

        // Prepare the event input for the cloud function

        if (isBackgroundEvent) {
          const eventInput = {
            title,
            description,
            location: location || "",
            startDate,
            startTime,
            endTime,
            recurrence: {
              daysOfWeek: recurrence.daysOfWeek,
              startRecur: recurrence.startRecur || startDate,
              endRecur: endRecur.toISOString().split("T")[0],
            },
            userId: user.uid,
          };

          console.log(
            "event data ready for cloud function for background event",
            eventInput
          );
          // Make the axios call to your cloud function
          const result = await axios.post(
            "https://us-central1-prune-94ad9.cloudfunctions.net/createRecurringAvailabilityInstances",
            eventInput
          );

          console.log("Recurring event instances created:", result.data);
        } else {
          const eventInput = {
            title,
            type,
            typeId,
            clientId,
            clientName,
            description,
            fee,
            location: location || "",
            startDate,
            startTime,
            endTime,
            paid,
            recurrence: {
              daysOfWeek: recurrence.daysOfWeek,
              startRecur: recurrence.startRecur || startDate,
              endRecur: endRecur.toISOString().split("T")[0],
            },
            userId: user.uid,
          };

          console.log(
            "event data ready for cloud function for recurring bookings",
            eventInput
          );

          // Make the axios call to your cloud function
          // "https://us-central1-prune-94ad9.cloudfunctions.net/createRecurringBookingInstances",
          const result = await axios.post(
            "http://127.0.0.1:5001/prune-94ad9/us-central1/createRecurringBookingInstances",
            eventInput
          );

          console.log("Recurring event instances created:", result.data);
        }
      } else {
        // Handle single or background event directly on the client side
        // Parse the start and end times
        let startDateTime = date
          ? new Date(date)
          : new Date(selectInfo.startStr);
        let endDateTime = new Date(selectInfo.startStr);

        if (startTime && endTime) {
          const [startHour, startMinute] = startTime.split(":").map(Number);
          const [endHour, endMinute] = endTime.split(":").map(Number);

          // Set the time in UTC
          startDateTime.setUTCHours(startHour, startMinute, 0, 0);
          endDateTime.setUTCHours(endHour, endMinute, 0, 0);

          // Ensure end time is after the start time
          if (endDateTime <= startDateTime) {
            endDateTime.setUTCDate(endDateTime.getUTCDate() + 1);
          }
        }

        // Create the event object for a single or background event
        let event: EventInput = {
          id: "",
          title,
          type,
          typeId,
          fee: fee,
          clientId: clientId,
          clientName: clientName,
          location: location || "",
          start: startDateTime, // Save in UTC
          end: endDateTime, // Save in UTC
          description,
          display: isBackgroundEvent ? "background" : "auto",
          className: isBackgroundEvent ? "custom-bg-event" : "",
          isBackgroundEvent,
          startDate: startDateTime, // Save in UTC
          startDay: startDateTime.toLocaleDateString("en-US", {
            weekday: "long",
            timeZone: "UTC",
          }),
          endDate: endDateTime, // Save in UTC
          endDay: endDateTime.toLocaleDateString("en-US", {
            weekday: "long",
            timeZone: "UTC",
          }),
          paid,
        };

        console.log("Single event data ready for Firestore:", event);

        // Remove any undefined fields before saving
        event = removeUndefinedFields(event);

        // Save single event or background event directly to Firestore
        const eventRef = await addDoc(
          collection(db, "users", user.uid, "events"),
          event
        );

        const eventId = eventRef.id;
        event.id = eventId;

        // Update the event with the ID
        await updateDoc(eventRef, { id: eventId });

        console.log("Single event created in Firestore with ID:", event.id);

        // Add event to local state
        setEvents((prevEvents) => [...prevEvents, event]);
      }

      // Fetch the updated events for the calendar view
      await fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setLoading(false); // Stop loading
    }

    // Close the dialog after saving
    handleDialogClose();
  };

  if (eventsLoading) {
    return <div>Loading...</div>;
  }
  // // test build
  // const checkOverlap = (
  //   event: {
  //     extendedProps: { isBackgroundEvent: any };
  //     start: { getTime: () => any };
  //     end: { getTime: () => any };
  //     id: any;
  //   },
  //   allEvents: any[]
  // ) => {
  //   const isBackgroundEvent = event.extendedProps.isBackgroundEvent;
  //   if (isBackgroundEvent) return false;

  //   const eventStart = event.start.getTime();
  //   // const eventEnd = event.end.getTime();
  //   const eventEnd = event.end ? event.end.getTime() : eventStart;

  //   return allEvents.some((e) => {
  //     if (e.id !== event.id && e.extendedProps.isBackgroundEvent) {
  //       const bgStart = e.start.getTime();
  //       // const bgEnd = e.end.getTime();
  //       const bgEnd = e.end ? e.end.getTime() : bgStart;

  //       return (
  //         (eventStart >= bgStart && eventStart < bgEnd) ||
  //         (eventEnd > bgStart && eventEnd <= bgEnd) ||
  //         (eventStart <= bgStart && eventEnd >= bgEnd)
  //       );
  //     }
  //     return false;
  //   });
  // };

  const handleEventDidMount = (info: {
    view: { calendar: any };
    event: any;
    el: { classList: { add: (arg0: string) => void } };
  }) => {
    const calendarApi = info.view.calendar;
    const allEvents = calendarApi.getEvents();

    // Check for overlap with background events
    // if (checkOverlap(info.event, allEvents)) {
    //   info.el.classList.add("overlap-event");
    // }

    // add a popOver to the event here
  };

  const handleUpdatEventFormDialog = async (eventData: {
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
  }) => {
    const user = auth.currentUser;
    const userId = user?.uid;

    if (!user) {
      throw new Error("User not authenticated");
    }
    console.log("updating information triggered");

    try {
      const startDate =
        eventData.date || new Date().toISOString().split("T")[0];

      // Helper function to adjust for time zone offset and return UTC date
      const adjustToUTC = (dateTime: Date) => {
        const timezoneOffset = dateTime.getTimezoneOffset(); // Timezone offset in minutes
        return new Date(dateTime.getTime() - timezoneOffset * 60 * 1000); // Adjust to UTC
      };

      // Check if the event is recurring or a single event
      if (
        !eventData.recurrence ||
        eventData.recurrence.daysOfWeek.length === 0
      ) {
        // update the event in firebase instead of creating a new one
        console.log("updating event in firebase");
        if (!eventData.id) {
          throw new Error("Event ID is missing");
        }
        const eventRef = doc(db, "users", userId!, "events", eventData.id);

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

        // Adjust the start day
        const startDay = startDateTime.toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "UTC",
        });

        //Adjust the end day
        const endDay = endDateTime.toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "UTC",
        });

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
          startDate: startDateTime,
          endDate: endDateTime,
          startDay: startDay,
          endDay: endDay,
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
        const eventRef = doc(db, "users", userId!, "events", eventData.id);

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
    } finally {
      await fetchEvents();
      setLoading(false); // Stop loading
      setSelectInfo(null);
      setEditingEvent(null);
      setEditAll(false);
    }
  };

  return (
    <div className="p-4">
      <Tabs
        defaultValue="calendar"
        className="w-full"
        onValueChange={handleTabChange}
      >
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="availabile_time">Available Time</TabsTrigger>
          <TabsTrigger value="create_bookings">Bookings</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar">
          <h1 className="text-xl font-bold mb-4">Calendar Page</h1>
          <div className="overflow-hidden">
            <div className="calendar-container overflow-y-scroll h-[600px]">
              <FullCalendar
                timeZone="UTC"
                key={calendarKey}
                // eventColor="#000"
                ref={calendarRef}
                schedulerLicenseKey="0899673068-fcs-1718558974"
                plugins={[
                  dayGridPlugin,
                  resourceTimelinePlugin,
                  interactionPlugin,
                  timeGridPlugin,
                  rrulePlugin,
                ]}
                headerToolbar={{
                  left: "prev,next today", // Sticky header elements
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                stickyHeaderDates={true} // Enables sticky headers for dates
                height="auto"
                contentHeight="150"
                slotDuration="00:15:00"
                slotMinTime="07:00:00"
                slotLabelFormat={{
                  hour: "numeric",
                  minute: "2-digit",
                  meridiem: "short",
                  omitZeroMinute: false,
                }}
                initialView="timeGridWeek"
                editable={true}
                selectable={true}
                selectMirror={true}
                select={handleSelect}
                eventClick={handleEventClick} // Handle event click to open dialog
                navLinks={true}
                navLinkDayClick={(date) => {
                  console.log("Clicked day:", date);
                  calendarRef.current
                    ?.getApi()
                    .changeView("timeGridDay", date.toISOString());
                }}
                navLinkWeekClick={(weekStartDate) => {
                  console.log("Clicked week:", weekStartDate);
                  calendarRef.current
                    ?.getApi()
                    .changeView("timeGridWeek", weekStartDate.toISOString());
                }}
                eventResize={handleEventResize} // Called when resizing an event
                eventDidMount={handleEventDidMount} // Called after an event is rendered
                eventDrop={handleEventDrop}
                // moreLinkClick={(arg) => {
                // }}
                events={events.map((event, index) => {
                  const start = new Date(event.start);
                  const end = new Date(event.end);
                  const durationMs = end.getTime() - start.getTime();
                  const durationHours = Math.floor(
                    durationMs / (1000 * 60 * 60)
                  );
                  const durationMinutes = Math.floor(
                    (durationMs % (1000 * 60 * 60)) / (1000 * 60)
                  );
                  const formattedDuration = `${String(durationHours).padStart(
                    2,
                    "0"
                  )}:${String(durationMinutes).padStart(2, "0")}`;

                  if (event.recurrence) {
                    if (event.isBackgroundEvent) {
                      return {
                        ...event,
                        title: event.title,
                        type: event.type,
                        typeId: event.typeId,
                        location: event.location,
                        // rrule: {
                        //   freq: "weekly",
                        //   interval: 1,
                        //   byweekday: event.recurrence.daysOfWeek
                        //     ? event.recurrence.daysOfWeek.map(
                        //         (day) =>
                        //           ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][
                        //             day
                        //           ]
                        //       )
                        //     : undefined,
                        //   dtstart: new Date(event.start).toISOString(),
                        //   until: event.recurrence.endRecur
                        //     ? new Date(event.recurrence.endRecur).toISOString()
                        //     : undefined,
                        // },
                        startTime: event.recurrence.startTime,
                        endTime: event.recurrence.endTime,
                        display: "inverse-background",
                        groupId: `1234`,
                        uniqueId: `${event.id}-${index}`,
                        color: "#C5C5C5",
                        duration: formattedDuration,
                        // className: "bg-event-mirror",
                      };
                    } else {
                      return {
                        ...event,
                        title: event.title,
                        type: event.type,
                        typeId: event.typeId,
                        location: event.location,
                        rrule: {
                          freq: "weekly",
                          interval: 1,
                          byweekday: event.recurrence.daysOfWeek
                            ? event.recurrence.daysOfWeek.map(
                                (day) =>
                                  ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][
                                    day
                                  ]
                              )
                            : undefined,
                          dtstart: new Date(event.start).toISOString(),
                          until: event.recurrence.endRecur
                            ? new Date(event.recurrence.endRecur).toISOString()
                            : undefined,
                        },
                        startTime: event.recurrence.startTime,
                        endTime: event.recurrence.endTime,
                        display: "auto",
                        // groupId: event.id,
                        uniqueId: `${event.id}-${index}`,
                        color: event.color,
                        duration: formattedDuration,
                      };
                    }
                  } else {
                    if (event.isBackgroundEvent) {
                      return {
                        ...event,
                        title: event.title,
                        type: event.type,
                        typeId: event.typeId,
                        location: event.location,
                        display: "inverse-background",
                        groupId: `1234`,
                        uniqueId: `${event.id}-${index}`,
                        color: "#C5C5C5",
                        // className: "bg-event-mirror",
                      };
                    } else {
                      return {
                        ...event,
                        title: event.title,
                        type: event.type,
                        typeId: event.typeId,
                        location: event.location,
                        display: "auto",
                        // groupId: event.id,
                        uniqueId: `${event.id}-${index}`,
                        color: event.color,
                      };
                    }
                  }
                })}
                eventContent={renderEventContent}
                scrollTime="07:00:00" // Automatically scrolls to 7:00 AM on load
                views={{
                  dayGridMonth: {
                    // eventMaxStack: 3,
                    dayMaxEventRows: 4,
                    // nowIndicator: true
                  },
                  timeGridWeek: {
                    // nowIndicator: true,
                    scrollTime: "07:00:00",
                    stickyHeaderDates: true, // Enable sticky headers for dates
                  },
                  timeGridDay: {
                    // nowIndicator: true,
                    slotDuration: "00:15:00",
                  },
                }}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="availabile_time">
          <Availability />
        </TabsContent>
        <TabsContent value="create_bookings">
          <CreateBookings />
        </TabsContent>
      </Tabs>
      {editAll ? (
        <CreateBookingsFormDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          onSave={handleUpdatEventFormDialog}
          showDateSelector={true}
          event={editingEvent}
          editAll={editAll}
          eventId={editingEvent?.id}
        />
      ) : (
        <EventFormDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          onSave={handleSave}
          showDateSelector={true}
          event={editingEvent}
          editAll={editAll}
        />
      )}
    </div>
  );
}

// <HoverCardContent>
//   <div className="px-2 py-1">
//     <Badge className={paid ? "bg-green-500" : "bg-red-500"}>
//       {paid ? "Paid" : "unpaid"}
//     </Badge>
//     {/* <div className="text-xs">{`payment status : ${paid}`}</div> */}
//     <div className="text-sm font-semibold">
//       {`Notes : ${description}`}
//     </div>
//   </div>
// </HoverCardContent>
// {/* </HoverCard> */}
