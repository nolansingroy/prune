"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { DateSelectArg } from "@fullcalendar/core";
import EventFormDialog from "./EventFormModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Availability from "../pages/tabs/availability";
import CreateBookings from "./tabs/create_bookings";
import { auth, db } from "../../firebase";
import { createEvent } from "../services/userService";
import { Timestamp } from "firebase/firestore";
import useFetchEvents from "../hooks/useFetchEvents";
// import type { EventInput } from "@fullcalendar/core";
import { EventInput } from "./types";

export default function Calendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectInfo, setSelectInfo] = useState<DateSelectArg | null>(null);
  const { events: fetchedEvents, loading: eventsLoading } = useFetchEvents();
  const [events, setEvents] = useState<EventInput[]>([]);

  useEffect(() => {
    setEvents(fetchedEvents);
  }, [fetchedEvents]);

  const renderEventContent = (eventInfo: {
    event: {
      extendedProps: { isBackgroundEvent: any };
      title:
        | string
        | number
        | bigint
        | boolean
        | React.ReactElement<any, string | React.JSXElementConstructor<any>>
        | Iterable<React.ReactNode>
        | Promise<React.AwaitedReactNode>
        | null
        | undefined;
    };
    view: { type: string };
    timeText:
      | string
      | number
      | bigint
      | boolean
      | React.ReactElement<any, string | React.JSXElementConstructor<any>>
      | Iterable<React.ReactNode>
      | React.ReactPortal
      | Promise<React.AwaitedReactNode>
      | null
      | undefined;
  }) => {
    const { isBackgroundEvent } = eventInfo.event.extendedProps;

    // Check if it's the month view and the event is a background event
    if (eventInfo.view.type === "dayGridMonth" && isBackgroundEvent) {
      // Render as an all-day event in month view with custom styling
      return (
        <div className="bg-green-200 opacity-50 text-black p-1 rounded text-center">
          {eventInfo.event.title} (All Day Background)
        </div>
      );
    } else if (isBackgroundEvent) {
      // Render with different styling in week or day views
      return (
        <div className="bg-green-100 opacity-75 text-black p-1 rounded text-center">
          {eventInfo.event.title} (Timed Background)
        </div>
      );
    }

    // Default rendering for non-background events
    return (
      <>
        <b>{eventInfo.timeText}</b>
        <i>{eventInfo.event.title}</i>
      </>
    );
  };

  const handleSelect = (selectInfo: DateSelectArg) => {
    setSelectInfo(selectInfo);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectInfo(null);
  };

  const handleSave = async ({
    title,
    isBackgroundEvent,
    startTime,
    endTime,
  }: {
    title: string;
    isBackgroundEvent: boolean;
    startTime: string;
    endTime: string;
  }) => {
    if (!selectInfo) return;

    let calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    if (title) {
      // Correctly handle date and time conversion
      let startDateTime = new Date(selectInfo.start);
      let endDateTime = new Date(selectInfo.end);

      if (startTime && endTime) {
        let [startHour, startMinute] = startTime.split(":").map(Number);
        let [endHour, endMinute] = endTime.split(":").map(Number);

        startDateTime.setHours(startHour, startMinute);
        endDateTime.setHours(endHour, endMinute);
      }

      // Create the event object according to the EventInput type
      const event: EventInput = {
        title,
        start: startDateTime, // FullCalendar expects Date objects, not Timestamps
        end: endDateTime,
        description: "",
        display: isBackgroundEvent ? "background" : "true",
        className: isBackgroundEvent ? "fc-bg-event" : "",
        isBackgroundEvent: isBackgroundEvent, // Ensure this property is included
      };

      try {
        const user = auth.currentUser;
        if (user) {
          await createEvent(user.uid, event);
          console.log("Event created in Firestore");

          // Update the state to include the new event
          setEvents((prevEvents) => [
            ...prevEvents,
            {
              ...event,
              id: String(Date.now()), // Assign a temporary ID until it can be fetched or updated from Firestore
            },
          ]);
        }
      } catch (error) {
        console.error("Error creating event in Firestore:", error);
      }
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
          <TabsTrigger value="availabile_time">My Available Time</TabsTrigger>
          <TabsTrigger value="create_bookings">Create Bookings</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar">
          <h1 className="text-xl font-bold mb-4">Calendar Page</h1>
          <div className="overflow-hidden">
            <FullCalendar
              ref={calendarRef}
              schedulerLicenseKey="0899673068-fcs-1718558974"
              plugins={[
                dayGridPlugin,
                resourceTimelinePlugin,
                interactionPlugin,
                timeGridPlugin,
              ]}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              initialView="dayGridMonth"
              nowIndicator={true}
              editable={true}
              selectable={true}
              selectMirror={true}
              select={handleSelect}
              events={events}
              eventContent={renderEventContent}
              resources={[
                { id: "a", title: "Auditorium A" },
                { id: "b", title: "Auditorium B", eventColor: "green" },
                { id: "c", title: "Auditorium C", eventColor: "orange" },
              ]}
              height="auto"
              aspectRatio={1.35}
              contentHeight="auto"
              views={{
                dayGridMonth: { eventLimit: 5 },
                timeGridWeek: { nowIndicator: true },
                timeGridDay: { nowIndicator: true },
              }}
            />
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
