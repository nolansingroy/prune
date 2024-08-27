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

export default function Calendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectInfo, setSelectInfo] = useState<DateSelectArg | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventInput | null>(null);
  const [editAll, setEditAll] = useState(false); // New state to control if we're editing all instances
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

  // useEffect(() => {
  //   console.log("Component mounted, fetching events...");
  //   fetchEvents(); // Fetch events when the component mounts (on load or refresh)
  // }, [fetchEvents]);

  // useEffect(() => {
  //   const handleLoad = () => {
  //     fetchEvents(); // Fetch events after the page has loaded
  //   };

  //   // Add event listener for load event
  //   window.addEventListener("load", handleLoad);

  //   // Clean up event listener on unmount
  //   return () => {
  //     window.removeEventListener("load", handleLoad);
  //   };
  // }, []);

  // useEffect(() => {
  //   const fetchOnMount = async () => {
  //     console.log("Fetching events on mount...");
  //     await fetchEvents();
  //   };

  //   fetchOnMount();
  // }, [fetchEvents]);

  // useEffect(() => {
  //   if (sessionStorage.getItem("isRefreshed")) {
  //     fetchEvents(); // Fetch events if the page was refreshed
  //   } else {
  //     sessionStorage.setItem("isRefreshed", "true");
  //   }
  // }, []);

  // useEffect(() => {
  //   const [navigationEntry] = performance.getEntriesByType(
  //     "navigation"
  //   ) as PerformanceNavigationTiming[];

  //   if (navigationEntry?.type === "reload") {
  //     fetchEvents(); // Fetch events if the page was refreshed
  //   }
  // }, [fetchEvents]);

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
          <div className="bg-green-200 opacity-50 text-black p-1 rounded text-center">
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

  const handleSelect = (selectInfo: DateSelectArg) => {
    setSelectInfo(selectInfo);
    setEditingEvent(null); // Clear editing event
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

    let startDateTime = new Date(selectInfo.startStr);
    let endDateTime = new Date(selectInfo.startStr);

    if (startTime && endTime) {
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      startDateTime.setUTCHours(startHour, startMinute, 0, 0);
      endDateTime.setUTCHours(endHour, endMinute, 0, 0);

      if (endDateTime <= startDateTime) {
        endDateTime.setUTCDate(endDateTime.getUTCDate() + 1);
      }
    }

    let event: EventInput = {
      id: "",
      title,
      location: location || "",
      start: startDateTime,
      end: endDateTime,
      description,
      display: isBackgroundEvent ? "background" : "auto",
      className: isBackgroundEvent ? "custom-bg-event" : "",
      isBackgroundEvent,
      startDate: startDateTime,
      startDay: startDateTime.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      }),
      endDate: endDateTime,
      endDay: endDateTime.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      }),
      recurrence: recurrence || undefined,
    };

    event = removeUndefinedFields(event);

    try {
      const user = auth.currentUser;
      if (user) {
        const eventRef = await addDoc(
          collection(db, "users", user.uid, "events"),
          event
        );

        const eventId = eventRef.id;
        event.id = eventId;

        await updateDoc(eventRef, { id: eventId });

        console.log("Event created in Firestore with ID:", event.id);

        setEvents((prevEvents) => [...prevEvents, event]);
      }
    } catch (error) {
      console.error("Error creating event in Firestore:", error);
    }

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
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                stickyHeaderDates={true}
                slotDuration="00:15:00"
                slotMinTime="04:00:00"
                slotLabelFormat={{
                  hour: "numeric",
                  minute: "2-digit",
                  meridiem: "short",
                  omitZeroMinute: false,
                }}
                initialView="timeGridWeek"
                nowIndicator={true}
                editable={true}
                selectable={true}
                selectMirror={true}
                select={handleSelect}
                eventClick={handleEventClick} // Handle event click to open dialog
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
                slotMaxTime="22:00:00"
                height="auto"
                aspectRatio={1.35}
                contentHeight="auto"
                views={{
                  dayGridMonth: { nowIndicator: true },
                  timeGridWeek: {
                    nowIndicator: true,
                    scrollTime: "07:00:00",
                  },
                  timeGridDay: { nowIndicator: true, slotDuration: "00:10:00" },
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
