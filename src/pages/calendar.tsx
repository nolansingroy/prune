"use client";

import React, { useState, useRef } from "react";
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
import { auth, db } from "../../firebase"; // Ensure 'db' is correctly imported
import { createEvent } from "../services/userService";
import { Timestamp } from "firebase/firestore";
import useFetchEvents from "../hooks/useFetchEvents";
import useFetchTimezone from "../hooks/useFetchTimezone";

export default function Calendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectInfo, setSelectInfo] = useState<DateSelectArg | null>(null);
  const { timeZone, loading: timezoneLoading } = useFetchTimezone();
  const { events, loading: eventsLoading } = useFetchEvents();
  const [calendarEvents, setCalendarEvents] = useState(events);

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
      let start = selectInfo.start;
      let end = selectInfo.end;

      if (isBackgroundEvent && startTime && endTime) {
        let startDateTime = new Date(selectInfo.start);
        let endDateTime = new Date(selectInfo.end);

        let [startHour, startMinute] = startTime.split(":").map(Number);
        let [endHour, endMinute] = endTime.split(":").map(Number);

        startDateTime.setHours(startHour, startMinute);
        endDateTime.setHours(endHour, endMinute);

        start = startDateTime;
        end = endDateTime;
      }

      const event = {
        title,
        start: Timestamp.fromDate(start),
        end: Timestamp.fromDate(end),
        description: "",
        isBackgroundEvent,
      };

      try {
        const user = auth.currentUser;
        if (user) {
          await createEvent(user.uid, event);
          console.log("Event created in Firestore");

          setCalendarEvents([
            ...calendarEvents,
            {
              id: String(Date.now()), // Generate a unique ID
              title,
              start,
              end,
              allDay: selectInfo.allDay,
              display: isBackgroundEvent ? "background" : "auto",
              className: isBackgroundEvent ? "fc-bg-event" : "", // Apply custom class
            },
          ]);
        }
      } catch (error) {
        console.error("Error creating event in Firestore:", error);
      }
    }

    handleDialogClose();
  };

  if (timezoneLoading || eventsLoading) {
    return <div>Loading...</div>; // Or any loading indicator you prefer
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
              events={calendarEvents}
              timeZone={timeZone} // Use the fetched timezone
              resources={[
                { id: "a", title: "Auditorium A" },
                { id: "b", title: "Auditorium B", eventColor: "green" },
                { id: "c", title: "Auditorium C", eventColor: "orange" },
              ]}
              height="auto"
              aspectRatio={1.35} // Adjust aspect ratio for mobile screens
              contentHeight="auto" // Make sure content height adjusts properly
              views={{
                dayGridMonth: {
                  eventLimit: true, // Allow "more" link when too many events
                },
                timeGridWeek: {
                  nowIndicator: true,
                },
                timeGridDay: {
                  nowIndicator: true,
                },
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
