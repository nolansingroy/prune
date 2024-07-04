"use client";

import React, { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { DateSelectArg } from "@fullcalendar/core";
import EventFormDialog from "./EventFormModal"; // Import the dialog component

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Availability from "../pages/tabs/availability";
import { CreateBookings } from "./tabs/create_bookings";

export default function Calendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectInfo, setSelectInfo] = useState<DateSelectArg | null>(null);

  const handleSelect = (selectInfo: DateSelectArg) => {
    setSelectInfo(selectInfo);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectInfo(null);
  };

  const handleSave = ({
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
    calendarApi.unselect(); // clear date selection

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

      calendarApi.addEvent({
        id: String(Date.now()), // generate a unique ID
        title,
        start,
        end,
        allDay: selectInfo.allDay,
        display: isBackgroundEvent ? "background" : "auto",
        className: isBackgroundEvent ? "fc-bg-event" : "", // Apply custom class
      });
    }

    handleDialogClose();
  };

  return (
    <div className="p-4">
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="availabile_time">My Available Time</TabsTrigger>
          <TabsTrigger value="create_bookings">Create Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <h1 className="text-xl font-bold mb-4">Hello, Calendar Page!</h1>
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
              initialEvents={[
                { title: "nice event", start: new Date(), resourceId: "a" },
              ]}
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
