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
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import EventFormDialog from "../../../../comp/EventFormModal";
import { auth, db } from "../../../../../firebase";
import useFetchEvents from "../../../../hooks/useFetchEvents";
import { EventInput } from "../../../../interfaces/types";
import { EventResizeDoneArg } from "@fullcalendar/interaction";
import { EventDropArg } from "@fullcalendar/core";
import axios from "axios";

import CreateBookingsFormDialog from "@/comp/CreateBookingsFormDialog";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";
import { Auth } from "firebase/auth";
import {
  createFireStoreEvent,
  updateFireStoreEvent,
} from "@/lib/converters/events";

// an instance of the tooltip for each event { this is initialized to track the instances of the tooltip to prevent adding multiple instances of the tooltip to the same event }
const tippyInstances = new Map<string, any>();

export default function FullCalendarComponent() {
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
      fetchEvents();

      // setCalendarKey((prevKey) => {
      //   const newKey = prevKey + 1;
      //   console.log("Calendar Key Updated:", newKey); // Log calendar key update
      //   return newKey;
      // }); // Trigger the fetch events after the page has fully loaded
    };
  }, []);

  const renderEventContent = (eventInfo: EventContentArg) => {
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
      const formattedStartTime = defaultStartTimeLocal.toLocaleTimeString(
        "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      );
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
        const startDay = resizeInfo.event.start?.toLocaleDateString("en-US", {
          weekday: "long",
        });

        const endDay = resizeInfo.event.end?.toLocaleDateString("en-US", {
          weekday: "long",
        });

        const startDate = resizeInfo.event.start
          ? resizeInfo.event.start
          : null;
        const endDate = resizeInfo.event.end ? resizeInfo.event.end : null;

        await updateFireStoreEvent(user.uid, resizeInfo.event.id, {
          start: startDate!,
          end: endDate!,
          startDate: startDate!,
          endDate: endDate!,
          startDay: startDay,
          endDay: endDay,
        });

        setEvents((prevEvents) => {
          const updatedEvents = prevEvents.map((event) => {
            if (event.id === resizeInfo.event.id) {
              return {
                ...event,
                start: startDate!,
                end: endDate!,
                startDate: startDate!,
                endDate: endDate!,
                startDay: startDay!,
                endDay: endDay!,
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
        const startDay = dropInfo.event.start?.toLocaleDateString("en-US", {
          weekday: "long",
        });

        const endDay = dropInfo.event.end?.toLocaleDateString("en-US", {
          weekday: "long",
        });

        const startDate = dropInfo.event.start ? dropInfo.event.start : null;
        const endDate = dropInfo.event.end ? dropInfo.event.end : null;

        await updateFireStoreEvent(user.uid, dropInfo.event.id, {
          start: startDate!,
          end: endDate!,
          startDate: startDate!,
          endDate: endDate!,
          startDay: startDay,
          endDay: endDay,
        });

        // Update the local state to reflect the changes
        setEvents((prevEvents) => {
          const updatedEvents = prevEvents.map((event) => {
            if (event.id === dropInfo.event.id) {
              return {
                ...event,
                start: startDate!,
                end: endDate!,
                startDate: startDate!,
                endDate: endDate!,
                startDay: startDay!,
                endDay: endDay!,
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

    const defaultStartTimeLocal = new Date(selectInfo.startStr);
    const defaultEndTimeLocal = new Date(selectInfo.endStr);

    console.log("Select Info start date:", defaultStartTimeLocal);

    // Derive the day of the week from startDate
    const defaultStartDay = defaultStartTimeLocal.toLocaleDateString("en-US", {
      weekday: "long",
    });

    setEditingEvent((prevState) => {
      const updatedEvent: EventInput = {
        id: prevState?.id,
        ...prevState,
        title: prevState?.title || "",
        fee: prevState?.fee || 0,
        clientId: prevState?.clientId || "",
        clientName: prevState?.clientName || "",
        type: prevState?.type || "No type",
        typeId: prevState?.typeId || "",
        isBackgroundEvent: prevState?.isBackgroundEvent ?? false,
        start:
          prevState?.start instanceof Date
            ? prevState.start
            : defaultStartTimeLocal,
        end:
          prevState?.end instanceof Date ? prevState.end : defaultEndTimeLocal,
        startDate: defaultStartTimeLocal,
        endDate: defaultEndTimeLocal,
        startDay: prevState?.startDay || defaultStartDay,
        endDay:
          prevState?.endDay ||
          defaultEndTimeLocal.toLocaleDateString("en-US", { weekday: "long" }),
        recurrence: undefined,
      };
      return updatedEvent;
    });

    setIsDialogOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const { event } = clickInfo;
    const { extendedProps, start, end } = event;

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      setEditingEvent({
        ...event,
        id: event.id,
        start: startDate,
        end: endDate,
        title: extendedProps.title || "",
        type: extendedProps.type || "",
        typeId: extendedProps.typeId || "",
        clientId: extendedProps.clientId || "",
        clientName: extendedProps.clientName || "",
        description: extendedProps.description || "",
        location: extendedProps.location || "",
        isBackgroundEvent: extendedProps.isBackgroundEvent || false,
        fee: extendedProps.fee || 0,
        paid: extendedProps.paid || false,
        startDate: startDate,
        startDay: startDate.toLocaleDateString("en-US", {
          weekday: "long",
        }),
        endDate: endDate,
        endDay: endDate.toLocaleDateString("en-US", {
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

  const convertToUTC = (date: Date): Date => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
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

    let startDate = date
      ? new Date(date).toISOString().split("T")[0]
      : new Date(selectInfo.startStr).toISOString().split("T")[0];

    setLoading(true); // Start loading

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get the user's time zone
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // If this is a recurring event, handle it using the cloud function
      if (
        recurrence &&
        recurrence.daysOfWeek &&
        recurrence.daysOfWeek.length > 0
      ) {
        // Calculate the time zone offsets for start time and end time
        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = new Date(`${startDate}T${endTime}`);
        const startRecur = new Date(recurrence.startRecur);
        const endRecur = new Date(recurrence.endRecur || startDate);
        endRecur.setDate(endRecur.getDate() + 1);

        // Prepare the event input for the cloud function

        if (isBackgroundEvent) {
          const eventInput = {
            title: title || "",
            description: description || "",
            location: location || "",
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
          };

          console.log(
            "event data ready for cloud function for background event",
            eventInput
          );

          //"http://127.0.0.1:5001/prune-94ad9/us-central1/createRecurringAvailabilityInstances"

          const result = await axios.post(
            "https://us-central1-prune-94ad9.cloudfunctions.net/createRecurringAvailabilityInstances",
            eventInput
          );

          console.log("Recurring event instances created:", result.data);
        } else {
          const eventInput = {
            title: title || "",
            type: type || "No type",
            typeId: typeId || "",
            clientId: clientId || "",
            clientName: clientName || "",
            description: description || "",
            fee: fee || 0,
            location: location || "",
            startDate,
            startTime,
            endTime,
            paid,
            recurrence: {
              daysOfWeek: recurrence.daysOfWeek,
              startRecur: startRecur.toISOString().split("T")[0] || startDate,
              endRecur: endRecur.toISOString().split("T")[0],
            },
            userId: user.uid,
            userTimeZone,
          };

          console.log(
            "event data ready for cloud function for recurring bookings",
            eventInput
          );

          //"http://127.0.0.1:5001/prune-94ad9/us-central1/createRecurringBookingInstances"

          const result = await axios.post(
            "https://us-central1-prune-94ad9.cloudfunctions.net/createRecurringBookingInstances",
            eventInput
          );

          console.log("Recurring event instances created:", result.data);
        }
      } else {
        // Handle single or background event directly on the client side
        // Parse the start and end times

        let startDateTime = new Date(selectInfo.startStr);
        let endDateTime = new Date(selectInfo.startStr);

        if (startTime && endTime) {
          const [startHour, startMinute] = startTime.split(":").map(Number);
          const [endHour, endMinute] = endTime.split(":").map(Number);

          startDateTime.setHours(startHour, startMinute, 0, 0);
          endDateTime.setHours(endHour, endMinute, 0, 0);

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

        // Create the event object for a booking or availability event
        let event: EventInput = {
          id: "",
          title,
          type,
          typeId,
          fee,
          clientId,
          clientName,
          location,
          start: startDateTime,
          end: endDateTime,
          description,
          display: isBackgroundEvent ? "inverse-background" : "auto",
          className: isBackgroundEvent ? "custom-bg-event" : "",
          isBackgroundEvent,
          startDate: startDateTime,
          startDay: startDay,
          endDate: endDateTime,
          endDay: endDay,
          paid,
        };

        console.log("Single event data ready for Firestore:", event);
        event = removeUndefinedFields(event);

        console.log("Event data before submitting to firebase:", event);

        await createFireStoreEvent(user.uid, event);
        setEvents((prevEvents) => [...prevEvents, event]);
      }
      await fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setLoading(false);
    }

    handleDialogClose();
  };

  if (eventsLoading) {
    return <div>Loading...</div>;
  }
  // // test build
  const checkOverlap = (
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

  const handleEventDidMount = (info: {
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

    let startDateTime = new Date(`${eventData.date}T${eventData.startTime}`);
    let endDateTime = new Date(`${eventData.date}T${eventData.endTime}`);

    if (eventData.startTime && eventData.endTime) {
      const [startHour, startMinute] = eventData.startTime
        .split(":")
        .map(Number);
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

    setLoading(true); // Start loading

    try {
      if (
        !eventData.recurrence ||
        eventData.recurrence.daysOfWeek.length === 0
      ) {
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

        await updateFireStoreEvent(userId!, eventData.id, eventInput);

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

        await updateFireStoreEvent(userId!, eventData.id, eventInput);

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
      <div className="overflow-hidden">
        <div className="calendar-container overflow-y-scroll ">
          <FullCalendar
            timeZone="local"
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
              const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
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
                    originalEventId: event.originalEventId,
                    // className: "bg-event-mirror",
                  };
                } else {
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
                    display: "auto",
                    groupId: event.id,
                    uniqueId: `${event.id}-${index}`,
                    color: event.color,
                    duration: formattedDuration,
                    originalEventId: event.originalEventId,
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
                    originalEventId: event.originalEventId,
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
                    groupId: event.id,
                    uniqueId: `${event.id}-${index}`,
                    color: event.color,
                    originalEventId: event.originalEventId,
                  };
                }
              }
            })}
            nowIndicator={true}
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
