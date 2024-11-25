"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import rrulePlugin from "@fullcalendar/rrule";
import { DateSelectArg, EventClickArg } from "@fullcalendar/core";
import EventFormDialog from "../../../../components/modals/EventFormModal";
import { useAuth } from "@/context/AuthContext";
import useFetchEvents from "../../../../hooks/useFetchEvents";
import { EventInput } from "../../../../interfaces/types";
import { EventResizeDoneArg } from "@fullcalendar/interaction";
import { EventDropArg } from "@fullcalendar/core";
import axios from "axios";

import CreateBookingsFormDialog from "@/components/modals/CreateBookingsFormDialog";

import {
  createFireStoreEvent,
  deleteEvents,
  updateFireStoreEvent,
} from "@/lib/converters/events";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import useConfirmationStore from "@/lib/store/confirmationStore";
import { toast } from "sonner";
import { getDoc } from "firebase/firestore";
import {
  handleEventDidMount,
  removeUndefinedFields,
  renderEventContent,
  updatEventFormDialog,
} from "@/lib/helpers/calendar";
import { DecodedIdToken } from "next-firebase-auth-edge/lib/auth";
import PageContainer from "@/components/layout/page-container";

// type FullCalendarProps = {
//   events: EventInput[];
//   tokens: DecodedIdToken;
// };

export default function FullCalendarComponent({}) {
  const { user } = useAuth();
  const { openConfirmation } = useConfirmationStore();
  const calendarRef = useRef<FullCalendar>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectInfo, setSelectInfo] = useState<DateSelectArg | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventInput | null>(null);
  const [editAll, setEditAll] = useState(false); // New state to control if we're editing all instances
  // const [isLoading, setIsLoading] = useState(false); // New loading state
  const [calendarKey, setCalendarKey] = useState(0); // a stet variable to check if the calendar is re-rendered
  const [loading, startTransition] = useTransition();
  const [events, setEvents] = useState<EventInput[]>([]);
  const [userStartTime, setUserStartTime] = useState("07:00:00");

  // useEffect(() => {
  //   // console.log("Calendar re-rendered with key:", calendarKey); // Log calendar re-render
  // }, [calendarKey]);

  const {
    events: fetchedEvents,
    isLoading: eventsLoading,
    setIsLoading,
    userStartTime: fetchedUserStartTime,
    fetchEvents,
    fetchUserStartTime,
  } = useFetchEvents();

  useEffect(() => {
    setEvents(fetchedEvents);
    setUserStartTime(fetchedUserStartTime);
  }, [fetchedEvents, fetchedUserStartTime]);

  // Fetch events on page load - fix calendar blank screen no fetch on refresh
  useEffect(() => {
    window.onload = () => {
      fetchEvents();
      fetchUserStartTime();

      // setCalendarKey((prevKey) => {
      //   const newKey = prevKey + 1;
      //   console.log("Calendar Key Updated:", newKey); // Log calendar key update
      //   return newKey;
      // }); // Trigger the fetch events after the page has fully loaded
    };
  }, []);

  // useEffect(() => {
  //   const fetchUserStartTime = async () => {
  //     const user = auth.currentUser;
  //     if (user) {
  //       const userDocRef = doc(db, "users", user.uid);
  //       const userDoc = await getDoc(userDocRef);
  //       if (userDoc.exists()) {
  //         const userData = userDoc.data();
  //         setUserStartTime(userData.calendarStartTime || "07:00:00");
  //       }
  //     }
  //   };

  //   fetchUserStartTime();
  // }, []);

  // add event to firestore
  const handleEventResize = async (resizeInfo: EventResizeDoneArg) => {
    try {
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
          // console.log("Updated Events:", updatedEvents); // Log updated events
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
          // console.log("Updated Events:", updatedEvents); // Log updated events
          return updatedEvents;
        });
      }
    } catch (error) {
      console.error("Error updating event in Firestore:", error);
    }
  };

  const handleSelect = (selectInfo: DateSelectArg) => {
    setSelectInfo(selectInfo);

    const defaultStartTimeLocal = new Date(selectInfo.startStr);
    const defaultEndTimeLocal = new Date(selectInfo.endStr);

    // console.log("Select Info start date:", defaultStartTimeLocal);

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
        // location: extendedProps.location || "",
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

  const handleSave = async ({
    title,
    type,
    typeId,
    fee,
    clientId,
    clientName,
    description,
    // location,
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
    // location: string;
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
  }): Promise<void> => {
    if (!selectInfo) return Promise.resolve();

    let calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    let startDate = date
      ? new Date(date).toISOString().split("T")[0]
      : new Date(selectInfo.startStr).toISOString().split("T")[0];

    startTransition(async () => {
      setIsLoading(true); // Start loading
      try {
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
              // location: location || "",
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

            try {
              const result = await axios.post(
                "https://us-central1-prune-94ad9.cloudfunctions.net/createRecurringAvailabilityInstances",
                eventInput
              );
              console.log(
                "Recurring availability instances created:",
                result.data
              );
              toast.success("Recurring availability added successfully");
            } catch (error) {
              console.error("Error saving recurring event:", error);
              toast.error("Error adding recurring availability");
            }
          } else {
            const eventInput = {
              title: title || "",
              type: type || "No type",
              typeId: typeId || "",
              clientId: clientId || "",
              clientName: clientName || "",
              description: description || "",
              fee: fee || 0,
              // location: location || "",
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

            try {
              const result = await axios.post(
                "https://us-central1-prune-94ad9.cloudfunctions.net/createRecurringBookingInstances",
                eventInput
              );
              console.log("Recurring bookings instances created:", result.data);
              toast.success("Recurring bookings added successfully");
            } catch (error) {
              console.error("Error saving recurring event:", error);
              toast.error("Error adding recurring bookings");
            }
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

          if (isBackgroundEvent) {
            // Create the event object for a booking or availability event
            let event: EventInput = {
              id: "",
              title,
              type,
              typeId,
              fee,
              clientId,
              clientName,
              // location,
              start: startDateTime,
              end: endDateTime,
              description,
              display: "inverse-background",
              className: "custom-bg-event",
              isBackgroundEvent,
              startDate: startDateTime,
              startDay: startDay,
              endDate: endDateTime,
              endDay: endDay,
              paid,
            };

            try {
              console.log("Single event data ready for Firestore:", event);
              event = removeUndefinedFields(event);
              console.log("Event data before submitting to firebase:", event);

              await createFireStoreEvent(user.uid, event);
              setEvents((prevEvents) => [...prevEvents, event]);
              toast.success("Availability event added successfully");
            } catch (error) {
              console.error("Error saving event:", error);
              toast.error(
                "An error occurred while adding the availability event"
              );
            }
          } else {
            let event: EventInput = {
              id: "",
              title,
              type,
              typeId,
              fee,
              clientId,
              clientName,
              // location,
              start: startDateTime,
              end: endDateTime,
              description,
              display: "auto",
              className: "",
              isBackgroundEvent,
              startDate: startDateTime,
              startDay: startDay,
              endDate: endDateTime,
              endDay: endDay,
              paid,
            };

            try {
              console.log("Single event data ready for Firestore:", event);
              event = removeUndefinedFields(event);
              console.log("Event data before submitting to firebase:", event);

              await createFireStoreEvent(user.uid, event);
              setEvents((prevEvents) => [...prevEvents, event]);
              toast.success("Booking event added successfully");
            } catch (error) {
              console.error("Error saving event:", error);
              toast.error("An error occurred while adding the booking event");
            }
          }
        }
      } catch (error) {
        console.error("Error saving event:", error);
        toast.error("An error occurred while adding the event");
      } finally {
        console.log("handle save finished");
        await fetchEvents();
        setIsLoading(false);
      }
    });
    return Promise.resolve();
  };

  const handleUpdatEventFormDialog = (eventData: {
    id?: string;
    type: string;
    typeId: string;
    fee: number;
    clientId: string;
    clientName: string;
    description: string;
    // location: string;
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
    const userId = user?.uid;
    if (!user) {
      throw new Error("User not authenticated");
    }
    console.log("updating information triggered");

    startTransition(async () => {
      await updatEventFormDialog(eventData, userId!);
      await fetchEvents();
      setIsLoading(false);
    });
  };

  const handleDeleteEventFromDialog = async (
    eventId: string,
    action: string
  ) => {
    const closeActions = async () => {
      setIsDialogOpen(false);
      setSelectInfo(null);
      setEditingEvent(null);
      setEditAll(false);
      await fetchEvents();
    };

    if (!user) {
      throw new Error("User not authenticated");
    }

    try {
      console.log("Deleting event from Firestore for event ID:", eventId);
      // construct the array
      let eventIds: string[] = [];

      // do the database operation based on the action
      if (action === "single") {
        // make sure the array is empty
        eventIds = [eventId];
        console.log("Events to delete (single):", eventIds);

        openConfirmation({
          title: "Delete Confirmation",
          description: "Do you want to delete this booking event?",
          cancelLabel: "Cancel",
          actionLabel: "Delete",
          onAction: () => {
            startTransition(async () => {
              setIsLoading(true); // Start loading
              await deleteEvents(user.uid, eventIds);
              await closeActions();
              setIsLoading(false);
              toast.success("Booking event deleted successfully");
            });
          },
          onCancel: () => {
            setIsLoading(false); // Stop loading if canceled
          },
        });
      } else {
        // make sure the array is empty
        eventIds = [];

        // extract the originalEventId from the event with the eventId
        const event = events.find((event) => event.id === eventId);
        if (event) {
          let foundOriginalEventId = event.originalEventId;

          if (foundOriginalEventId) {
            console.log(
              "original event id found (series) : ",
              foundOriginalEventId
            );
            // get all the events with the same originalEventId

            const eventsToDelete = events
              .filter((event) => event.originalEventId === foundOriginalEventId)
              .map((event) => event.id);

            console.log(
              "(series) finding all the events that will be deleted",
              eventsToDelete
            );

            // update the eventIds array with all the found events with the same originalEventId and add the original event id to the eventIds array as well

            eventIds = [...eventsToDelete, foundOriginalEventId] as string[];

            console.log(
              "Events to delete (series) when the event to delete is not the original event :",
              eventIds
            );

            // Filter out undefined values
            const validEventIds = eventIds.filter(
              (id): id is string => id !== undefined
            );

            // call the deleteEvents function with the eventIds array

            openConfirmation({
              title: "Delete Confirmation",
              description:
                "Do you want to delete all the bookings in this series?",
              cancelLabel: "Cancel",
              actionLabel: "Delete",
              onAction: () => {
                startTransition(async () => {
                  setIsLoading(true); // Start loading
                  await deleteEvents(user.uid, validEventIds);
                  await closeActions();
                  setIsLoading(false);
                  toast.success("Series deleted successfully");
                });
              },
              onCancel: () => {
                setIsLoading(false); // Stop loading if canceled
              },
            });
          } else {
            console.log(
              "original event id not found (series) so this is the original event  : ",
              foundOriginalEventId
            );
            // if the original event id is not found, then this event is the original event, in this case find all the events with the same originalEventId

            // assign the eventId to the foundOriginalEventId
            foundOriginalEventId = eventId;

            const eventsToDelete = events
              .filter((event) => event.originalEventId === foundOriginalEventId)
              .map((event) => event.id);

            console.log(
              "(series) finding all the events that will be deleted",
              eventsToDelete
            );

            // update the eventIds array with all the found events with the same originalEventId and add the eventId to the eventIds array as well

            eventIds = [...eventsToDelete, foundOriginalEventId] as string[];

            console.log(
              "Events to delete (series) when the event to delete is the original event :",
              eventIds
            );

            // Filter out undefined values
            const validEventIds = eventIds.filter(
              (id): id is string => id !== undefined
            );

            // call the deleteEvents function with the eventIds array

            openConfirmation({
              title: "Delete Confirmation",
              description:
                "Do you want to delete all the bookings in this series?",
              cancelLabel: "Cancel",
              actionLabel: "Delete",
              onAction: () => {
                startTransition(async () => {
                  setIsLoading(true); // Start loading
                  await deleteEvents(user.uid, validEventIds);
                  await closeActions();
                  setIsLoading(false);
                  toast.success("Series deleted successfully");
                });
              },
              onCancel: () => {
                setIsLoading(false); // Stop loading if canceled
              },
            });
          }
        } else {
          // This case is not possible because the clicked event must have an id , but its here to debug if the clicked event does not have an id
          eventIds = [eventId];
          console.log("Event object was not found (series) for: ", eventIds);
          setIsLoading(false); // Stop loading
          // await deleteEvents(user.uid, eventIds);
        }
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      setIsLoading(false); // Stop loading
      toast.error("An error occurred while deleting the event");
    } finally {
      console.log("delete event success");
    }
  };

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-10 h-10" />
      </div>
    );
  }

  return (
    <PageContainer className="md:px-0" scrollable>
      <div className="flex flex-col pb-4">
        <div className="flex-grow">
          <div className="py-0 px-3">
            {/* <div className="calendar-container overflow-y-scroll "> */}
            <FullCalendar
              timeZone="local"
              key={calendarKey}
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
              contentHeight="auto"
              slotDuration="00:15:00"
              slotMinTime={userStartTime}
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
                // console.log("Clicked day:", date);
                calendarRef.current
                  ?.getApi()
                  .changeView("timeGridDay", date.toISOString());
              }}
              navLinkWeekClick={(weekStartDate) => {
                // console.log("Clicked week:", weekStartDate);
                calendarRef.current
                  ?.getApi()
                  .changeView("timeGridWeek", weekStartDate.toISOString());
              }}
              eventResize={handleEventResize} // Called when resizing an event
              eventDidMount={handleEventDidMount} // Called after an event is rendered
              eventDrop={handleEventDrop}
              nowIndicator={true}
              eventContent={renderEventContent}
              scrollTime="07:00:00" // Automatically scrolls to 7:00 AM on load
              allDaySlot={false}
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
                  dayHeaderContent: (args) => {
                    const date = args.date;
                    const dayOfWeek = date.toLocaleDateString("en-US", {
                      weekday: "short",
                    }); // e.g., "Tue"
                    const dayOfMonth = date.getDate(); // e.g., 4

                    return (
                      <div style={{ textAlign: "center" }}>
                        <div className="text-sm font-normal">{dayOfWeek}</div>
                        <div className="text-sm font-normal">{dayOfMonth}</div>
                      </div>
                    );
                  },
                },
                timeGridDay: {
                  // nowIndicator: true,
                  slotDuration: "00:15:00",
                  stickyHeaderDates: true, // Enable sticky headers for dates
                  dayHeaderContent: (args) => {
                    const date = args.date;
                    const dayOfWeek = date.toLocaleDateString("en-US", {
                      weekday: "long",
                    });

                    return (
                      <div style={{ textAlign: "center" }}>
                        <div>{dayOfWeek}</div>
                      </div>
                    );
                  },
                },
              }}
              // eventColor="#000"
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
                      // location: event.location,
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
                      // location: event.location,
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
                      // location: event.location,
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
                      // location: event.location,
                      display: "auto",
                      groupId: event.id,
                      uniqueId: `${event.id}-${index}`,
                      color: event.color,
                      originalEventId: event.originalEventId,
                    };
                  }
                }
              })}
            />
            {/* </div> */}
          </div>

          {editAll ? (
            <CreateBookingsFormDialog
              isOpen={isDialogOpen}
              onClose={handleDialogClose}
              onSave={handleUpdatEventFormDialog}
              onDelete={handleDeleteEventFromDialog}
              showDateSelector={true}
              event={editingEvent}
              editAll={editAll}
              eventId={editingEvent?.id}
              isLoading={loading}
            />
          ) : (
            <EventFormDialog
              isOpen={isDialogOpen}
              onClose={handleDialogClose}
              onSave={handleSave}
              showDateSelector={true}
              event={editingEvent}
              editAll={editAll}
              isLoading={loading}
            />
          )}
        </div>
      </div>
    </PageContainer>
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
