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
  const { events: fetchedEvents, loading: eventsLoading } = useFetchEvents();
  const [events, setEvents] = useState<EventInput[]>([]);

  useEffect(() => {
    setEvents(fetchedEvents);
  }, [fetchedEvents]);

  const renderEventContent = (eventInfo: EventContentArg) => {
    const { isBackgroundEvent } = eventInfo.event.extendedProps;
    const classNames = eventInfo.event.classNames || [];

    console.log("--- Event Info:", eventInfo);

    if (classNames.includes("bg-event-mirror")) {
      return (
        <div className="bg-blue-200 opacity-50 text-black p-1 rounded text-center border border-blue-500">
          {eventInfo.event.title}
        </div>
      );
    }

    if (isBackgroundEvent) {
      if (eventInfo.view.type === "dayGridMonth") {
        console.log("Rendering background event in month view:", eventInfo);
        return (
          <div className="bg-green-200 opacity-50 text-black p-1 rounded text-center">
            {eventInfo.event.title}
          </div>
        );
      } else {
        console.log(
          "Rendering background event in week or day view:",
          eventInfo
        );
        return (
          <div className="bg-green-100 opacity-75 text-black p-1 rounded text-center">
            {eventInfo.event.title} <br />
            (Background Event)
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
    console.log("Event resized:", resizeInfo);
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

        // Calculate the new startDay and endDay
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

        // Convert ISO strings back to Date objects to store as timestamps
        const startDateUTC = resizeInfo.event.start
          ? new Date(resizeInfo.event.start.toISOString())
          : null;
        const endDateUTC = resizeInfo.event.end
          ? new Date(resizeInfo.event.end.toISOString())
          : null;

        // Update the event in Firestore with new start and end times
        await updateDoc(eventRef, {
          start: startDateUTC, // Store as Date object (which Firestore stores as Timestamp)
          end: endDateUTC, // Store as Date object (which Firestore stores as Timestamp)
          startDate: startDateUTC, // Update startDate
          endDate: endDateUTC, // Update endDate
          startDay: startDay, // Update startDay
          endDay: endDay, // Update endDay
          updated_at: Timestamp.now(),
        });

        console.log(
          `Event resized and updated in Firestore - ${resizeInfo.event.id}`
        );
      }
    } catch (error) {
      console.error("Error updating event in Firestore:", error);
    }
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    console.log("Event dropped:", dropInfo);
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

        // Calculate the new startDay and endDay
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

        // Convert ISO strings back to Date objects to store as timestamps
        const startDateUTC = dropInfo.event.start
          ? new Date(dropInfo.event.start.toISOString())
          : null;
        const endDateUTC = dropInfo.event.end
          ? new Date(dropInfo.event.end.toISOString())
          : null;

        // Update the event in Firestore with new start and end times
        await updateDoc(eventRef, {
          start: startDateUTC, // Store as Date object (which Firestore stores as Timestamp)
          end: endDateUTC, // Store as Date object (which Firestore stores as Timestamp)
          startDate: startDateUTC, // Update startDate
          endDate: endDateUTC, // Update endDate
          startDay: startDay, // Update startDay
          endDay: endDay, // Update endDay
          updated_at: Timestamp.now(),
        });

        console.log(
          `Event dropped and updated in Firestore - ${dropInfo.event.id}`
        );
      }
    } catch (error) {
      console.error("Error updating event in Firestore:", error);
    }
  };

  const handleSelect = (selectInfo: DateSelectArg) => {
    setSelectInfo(selectInfo);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectInfo(null);
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

    // Convert startTime and endTime to Date objects in UTC
    let startDateTime = new Date(selectInfo.startStr);
    let endDateTime = new Date(selectInfo.startStr);

    if (startTime && endTime) {
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      // Setting hours and minutes for startDateTime and endDateTime
      startDateTime.setUTCHours(startHour, startMinute, 0, 0);
      endDateTime.setUTCHours(endHour, endMinute, 0, 0);

      if (endDateTime <= startDateTime) {
        endDateTime.setUTCDate(endDateTime.getUTCDate() + 1);
      }
    }

    // Create the event object with UTC times
    let event: EventInput = {
      id: "", // Placeholder for the Firestore document ID
      title,
      start: startDateTime, // These are already UTC
      end: endDateTime, // These are already UTC
      description,
      display: isBackgroundEvent ? "background" : "auto",
      className: isBackgroundEvent ? "custom-bg-event" : "",
      isBackgroundEvent,
      startDate: startDateTime, // UTC date
      startDay: startDateTime.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      }),
      endDate: endDateTime, // UTC date
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
        // Create a new document in Firestore
        const eventRef = await addDoc(
          collection(db, "users", user.uid, "events"),
          event
        );

        // Update the event object with the Firestore document ID
        const eventId = eventRef.id;
        event.id = eventId;

        // Update Firestore document with the correct ID
        await updateDoc(eventRef, { id: eventId });

        console.log("Event created in Firestore with ID:", event.id);

        // Update local state with the new event
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

  return (
    <div className="p-4">
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="availabile_time">Available Time</TabsTrigger>
          <TabsTrigger value="create_bookings">Create Bookings</TabsTrigger>
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
                slotDuration="00:15:00"
                slotMinTime="04:00:00"
                slotLabelFormat={{
                  hour: "numeric",
                  minute: "2-digit",
                  meridiem: "short",
                  omitZeroMinute: false, // This ensures "2:00pm" is displayed instead of "2pm"
                }}
                initialView="timeGridWeek"
                nowIndicator={true}
                editable={true}
                selectable={true}
                selectMirror={true}
                select={handleSelect}
                eventResize={handleEventResize} // Called when resizing an event
                eventDrop={handleEventDrop}
                events={events.map((event) => {
                  if (event.recurrence) {
                    return {
                      ...event,
                      rrule: {
                        freq: "weekly",
                        interval: 1,
                        byweekday: event.recurrence.daysOfWeek,
                        dtstart: event.recurrence.startRecur,
                        until: event.recurrence.endRecur,
                      },
                      startTime: event.recurrence.startTime,
                      endTime: event.recurrence.endTime,
                    };
                  } else {
                    return event;
                  }
                })}
                eventContent={renderEventContent}
                slotMaxTime="22:00:00" // End time of the visible time grid
                height="auto"
                aspectRatio={1.35}
                contentHeight="auto"
                views={{
                  dayGridMonth: { nowIndicator: true },
                  timeGridWeek: {
                    nowIndicator: true,
                    // slotDuration: "00:10:00",
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
      />
    </div>
  );
}
