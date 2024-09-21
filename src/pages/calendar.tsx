"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import rrulePlugin from "@fullcalendar/rrule";
import { DateSelectArg, EventApi, EventContentArg } from "@fullcalendar/core";
import EventFormDialog from "./EventFormModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Availability from "../pages/tabs/availability";
import CreateBookings from "./tabs/create_bookings";
import { auth, db } from "../../firebase";
import { createEvent } from "../services/userService";
import useFetchEvents from "../hooks/useFetchEvents";
import { EventInput } from "../interfaces/types";
import { addDoc, getDoc, Timestamp } from "firebase/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { collection, query, getDocs } from "firebase/firestore";
import { EventResizeDoneArg } from "@fullcalendar/interaction";
import { EventDropArg } from "@fullcalendar/core";
import axios from "axios";

export default function Calendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectInfo, setSelectInfo] = useState<DateSelectArg | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventInput | null>(null);
  const [editAll, setEditAll] = useState(false); // New state to control if we're editing all instances
  const [loading, setLoading] = useState(false); // New loading state

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
    const { isBackgroundEvent, location } = eventInfo.event.extendedProps;
    const classNames = eventInfo.event.classNames || [];

    if (classNames.includes("bg-event-mirror")) {
      return (
        <div className="bg-blue-200 opacity-50 text-black p-1 rounded text-center border border-blue-500">
          {eventInfo.event.title}
        </div>
      );
    }

    if (isBackgroundEvent) {
      if (eventInfo.view.type === "dayGridMonth") {
        return (
          <div className="bg-green-200 opacity-75 text-black p-1 rounded text-center">
            {eventInfo.event.title}
            {location && <div>{location}</div>}
          </div>
        );
      } else {
        return (
          <div className="bg-green-100 opacity-75 text-black p-1 rounded text-center">
            {eventInfo.event.title} <br />
            {location && <div>{location}</div>}
          </div>
        );
      }
    }

    return (
      <>
        <i>{eventInfo.event.title}</i>
      </>
    );
  };

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
        ...prevState, // Preserve previous state
        title: prevState?.title || "", // Ensure title is not undefined
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

  const handleEventClick = (clickInfo: { event: { extendedProps: any } }) => {
    const event = clickInfo.event.extendedProps;
    setEditingEvent(event);
    setEditAll(!!event.recurrence); // Set editAll based on whether the event is recurring
    setIsDialogOpen(true);
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

  //HandleSave with UTC offset
  // const handleSave = async ({
  //   title,
  //   description,
  //   location,
  //   isBackgroundEvent,
  //   startTime,
  //   endTime,
  //   recurrence,
  // }: {
  //   title: string;
  //   description: string;
  //   location: string;
  //   isBackgroundEvent: boolean;
  //   startTime: string;
  //   endTime: string;
  //   recurrence?: {
  //     daysOfWeek: number[];
  //     startTime: string;
  //     endTime: string;
  //     startRecur: string;
  //     endRecur: string;
  //   };
  // }) => {
  //   if (!selectInfo) return;

  //   let calendarApi = selectInfo.view.calendar;
  //   calendarApi.unselect();

  //   let startDateTime = new Date(selectInfo.startStr);
  //   let endDateTime = new Date(selectInfo.startStr);

  //   if (startTime && endTime) {
  //     const [startHour, startMinute] = startTime.split(":").map(Number);
  //     const [endHour, endMinute] = endTime.split(":").map(Number);

  //     startDateTime.setUTCHours(startHour, startMinute, 0, 0);
  //     endDateTime.setUTCHours(endHour, endMinute, 0, 0);

  //     if (endDateTime <= startDateTime) {
  //       endDateTime.setUTCDate(endDateTime.getUTCDate() + 1);
  //     }
  //   }

  //   let event: EventInput = {
  //     id: "",
  //     title,
  //     location: location || "",
  //     start: startDateTime,
  //     end: endDateTime,
  //     description,
  //     display: isBackgroundEvent ? "background" : "auto",
  //     className: isBackgroundEvent ? "custom-bg-event" : "",
  //     isBackgroundEvent,
  //     startDate: startDateTime,
  //     startDay: startDateTime.toLocaleDateString("en-US", {
  //       weekday: "long",
  //       timeZone: "UTC",
  //     }),
  //     endDate: endDateTime,
  //     endDay: endDateTime.toLocaleDateString("en-US", {
  //       weekday: "long",
  //       timeZone: "UTC",
  //     }),
  //     recurrence: recurrence || undefined,
  //   };

  //   event = removeUndefinedFields(event);

  //   try {
  //     const user = auth.currentUser;
  //     if (user) {
  //       const eventRef = await addDoc(
  //         collection(db, "users", user.uid, "events"),
  //         event
  //       );

  //       const eventId = eventRef.id;
  //       event.id = eventId;

  //       await updateDoc(eventRef, { id: eventId });

  //       console.log("Event created in Firestore with ID:", event.id);

  //       setEvents((prevEvents) => [...prevEvents, event]);
  //     }
  //   } catch (error) {
  //     console.error("Error creating event in Firestore:", error);
  //   }

  //   handleDialogClose();
  // };

  // handleSave with cloudfunction only
  // const handleSave = async ({
  //   title,
  //   description,
  //   location,
  //   isBackgroundEvent,
  //   startTime,
  //   endTime,
  //   recurrence,
  // }: {
  //   title: string;
  //   description: string;
  //   location: string;
  //   isBackgroundEvent: boolean;
  //   startTime: string;
  //   endTime: string;
  //   recurrence?: {
  //     daysOfWeek: number[];
  //     startTime: string;
  //     endTime: string;
  //     startRecur: string;
  //     endRecur: string;
  //   };
  // }) => {
  //   if (!selectInfo) return;

  //   let calendarApi = selectInfo.view.calendar;
  //   calendarApi.unselect();

  //   // Format the start and end dates based on the event selection
  //   const startDate = new Date(selectInfo.startStr).toISOString().split("T")[0];

  //   setLoading(true); // Start loading

  //   try {
  //     const user = auth.currentUser;
  //     if (!user) {
  //       throw new Error("User not authenticated");
  //     }

  //     // Adjust end recurrence date
  //     const endRecur = new Date(recurrence?.endRecur || startDate);
  //     endRecur.setDate(endRecur.getDate() + 1);

  //     // Prepare the event input for the cloud function
  //     const eventInput = {
  //       title,
  //       description,
  //       location: location || "",
  //       startDate,
  //       startTime,
  //       endTime,
  //       recurrence: {
  //         daysOfWeek: recurrence?.daysOfWeek || [],
  //         startRecur: recurrence?.startRecur || startDate,
  //         endRecur: endRecur.toISOString().split("T")[0], // Adjusted endRecur
  //       },
  //       userId: user.uid,
  //     };

  //     // Make the axios call to your cloud function
  //     const result = await axios.post(
  //       "https://us-central1-prune-94ad9.cloudfunctions.net/createRecurringAvailabilityInstances",
  //       eventInput
  //     );

  //     console.log("Recurring event instances created:", result.data);

  //     // Fetch the updated events for the calendar view
  //     await fetchEvents();
  //   } catch (error) {
  //     console.error("Error saving event:", error);
  //   } finally {
  //     setLoading(false); // Stop loading
  //   }

  //   // Close the dialog or modal after saving the event
  //   handleDialogClose();
  // };

  const handleSave = async ({
    title,
    description,
    location,
    isBackgroundEvent,
    startTime,
    endTime,
    recurrence,
  }: {
    title: string;
    description: string;
    location: string;
    isBackgroundEvent: boolean;
    startTime: string;
    endTime: string;
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
    const startDate = new Date(selectInfo.startStr).toISOString().split("T")[0];

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

        // Prepare the event input for the cloud function
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

        // Make the axios call to your cloud function
        const result = await axios.post(
          "https://us-central1-prune-94ad9.cloudfunctions.net/createRecurringAvailabilityInstances",
          eventInput
        );

        console.log("Recurring event instances created:", result.data);
      } else {
        // Handle single or background event directly on the client side
        // Parse the start and end times
        let startDateTime = new Date(selectInfo.startStr);
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
        };

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
                // stickyHeaderDates={true} // Enables sticky headers for dates
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
                height="auto"
                eventResize={handleEventResize} // Called when resizing an event
                eventDidMount={handleEventDidMount} // Called after an event is rendered
                eventDrop={handleEventDrop}
                events={events.map((event) => {
                  if (event.recurrence) {
                    return {
                      ...event,
                      location: event.location,
                      rrule: {
                        freq: "weekly",
                        interval: 1,
                        byweekday: event.recurrence.daysOfWeek
                          ? event.recurrence.daysOfWeek.map(
                              (day) =>
                                ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][day]
                            )
                          : undefined,
                        dtstart: new Date(event.start).toISOString(),
                        until: event.recurrence.endRecur
                          ? new Date(event.recurrence.endRecur).toISOString()
                          : undefined,
                      },
                      startTime: event.recurrence.startTime,
                      endTime: event.recurrence.endTime,
                    };
                  } else {
                    return {
                      ...event,
                      location: event.location,
                    };
                  }
                })}
                eventContent={renderEventContent}
                contentHeight="auto"
                scrollTime="07:00:00" // Automatically scrolls to 7:00 AM on load
                views={{
                  dayGridMonth: { nowIndicator: true },
                  timeGridWeek: {
                    // nowIndicator: true,
                    scrollTime: "07:00:00",
                    stickyHeaderDates: true, // Enable sticky headers for dates
                  },
                  timeGridDay: {
                    // nowIndicator: true,
                    slotDuration: "00:10:00",
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
      <EventFormDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSave={handleSave}
        event={editingEvent} // Pass the selected event
        editAll={false} // Pass the editAll state
      />
    </div>
  );
}
