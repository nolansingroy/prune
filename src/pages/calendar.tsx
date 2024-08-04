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

    // Convert startTime and endTime to Date objects
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

    let event: EventInput = {
      title,
      start: startDateTime,
      end: endDateTime,
      description,
      display: isBackgroundEvent ? "background" : "auto",
      className: isBackgroundEvent ? "custom-bg-event" : "",
      isBackgroundEvent,
      recurrence: recurrence || undefined,
    };

    event = removeUndefinedFields(event);

    try {
      const user = auth.currentUser;
      if (user) {
        await createEvent(user.uid, event);
        console.log("Event created in Firestore");

        setEvents((prevEvents) => [
          ...prevEvents,
          {
            ...event,
            id: String(Date.now()),
          },
        ]);
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
            <FullCalendar
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
              initialView="timeGridWeek"
              nowIndicator={true}
              editable={true}
              selectable={true}
              selectMirror={true}
              select={handleSelect}
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
              // resources={[
              //   { id: "a", title: "Auditorium A" },
              //   { id: "b", title: "Auditorium B", eventColor: "green" },
              //   { id: "c", title: "Auditorium C", eventColor: "orange" },
              // ]}
              height="auto"
              aspectRatio={1.35}
              contentHeight="auto"
              views={{
                dayGridMonth: { nowIndicator: true },
                timeGridWeek: { nowIndicator: true, slotDuration: "00:10:00" },
                timeGridDay: { nowIndicator: true, slotDuration: "00:10:00" },
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
