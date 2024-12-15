"use client";

import { EventInput } from "@/interfaces/types";
import { fetchBookingTypes } from "@/lib/converters/bookingTypes";
import { fetchClients } from "@/lib/converters/clients";
import {
  createFireStoreEvent,
  fetchBookingsListviewEvents,
  updateFireStoreEvent,
} from "@/lib/converters/events";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import moment from "moment";
import React, { useTransition, useCallback, useEffect, useState } from "react";
import { db } from "../../../../../firebase";
import CreateBookingsFormDialog from "@/components/modals/CreateBookingsFormDialog";
import {
  CaretSortIcon,
  DotsHorizontalIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";
import AvailabilityDialog from "@/components/modals/AvailabilityFormDialog";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { DataTableSkeleton } from "@/components/loaders/data-table-skeleton";
import useConfirmationStore from "@/lib/store/confirmationStore";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CalendarDatePicker } from "@/components/ui/calendar-date-picker";
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from "date-fns";
import { Switch } from "@headlessui/react";
import { StatusFilter } from "@/components/status-filter";
import { cloudFunctions } from "@/constants/data";

const formatFee = (fee: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(fee);
};
type SortableKeys = "start" | "end" | "title" | "startDate";

const title = "My bookings";
const description = "Manage your bookings here.";

export default function BookingsView() {
  const { openConfirmation } = useConfirmationStore();
  const [loading, startTransition] = useTransition();
  const { user } = useAuth();
  const [allEvents, setAllEvents] = useState<EventInput[]>([]);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
  } | null>(null);
  const [editedValue, setEditedValue] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: SortableKeys;
    direction: "asc" | "desc";
  }>({ key: "startDate", direction: "asc" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventInput | null>(null);
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const [clients, setClients] = useState<{ docId: string; fullName: string }[]>(
    []
  );
  const [types, setTypes] = useState<{ docId: string; name: string }[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState({
    from: new Date(), // Today's date
    to: new Date(9999, 11, 31), // Far future date
  });
  const [selectedLabel, setSelectedLabel] = useState<string>("Future");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchEvents = useCallback(async () => {
    if (!user) {
      return;
    } else {
      const eventList = await fetchBookingsListviewEvents(user.uid);
      setAllEvents(eventList); // Store all events
      filterEvents("Future", eventList); // Initialize displayed events with "Future" events
      setIsLoading(false);
    }
  }, [user]);

  const filterEvents = (
    label: string,
    eventsToFilter: EventInput[] = allEvents,
    status: string = statusFilter,
    dateRange: { from: Date; to: Date } = selectedDateRange,
    searchTerm: string = search
  ) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filteredEvents = eventsToFilter;

    switch (label) {
      case "Today":
        filteredEvents = eventsToFilter.filter(
          (event) => event.start >= today && event.start < subDays(today, -1)
        );
        break;
      case "Yesterday":
        const yesterday = subDays(today, 1);
        filteredEvents = eventsToFilter.filter(
          (event) => event.start >= yesterday && event.start < today
        );
        break;
      case "This Week":
        const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
        const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });
        filteredEvents = eventsToFilter.filter(
          (event) =>
            event.start >= startOfThisWeek && event.start <= endOfThisWeek
        );
        break;
      case "Last Week":
        const startOfLastWeek = subDays(
          startOfWeek(today, { weekStartsOn: 1 }),
          7
        );
        const endOfLastWeek = subDays(endOfWeek(today, { weekStartsOn: 1 }), 7);
        filteredEvents = eventsToFilter.filter(
          (event) =>
            event.start >= startOfLastWeek && event.start <= endOfLastWeek
        );
        break;
      case "Last 7 Days":
        const last7Days = subDays(today, 6);
        filteredEvents = eventsToFilter.filter(
          (event) => event.start >= last7Days && event.start <= today
        );
        break;
      case "This Month":
        const startOfThisMonth = startOfMonth(today);
        const endOfThisMonth = endOfMonth(today);
        filteredEvents = eventsToFilter.filter(
          (event) =>
            event.start >= startOfThisMonth && event.start <= endOfThisMonth
        );
        break;
      case "Last Month":
        const startOfLastMonth = startOfMonth(subDays(today, today.getDate()));
        const endOfLastMonth = endOfMonth(subDays(today, today.getDate()));
        filteredEvents = eventsToFilter.filter(
          (event) =>
            event.start >= startOfLastMonth && event.start <= endOfLastMonth
        );
        break;
      case "This Year":
        const startOfThisYear = startOfYear(today);
        const endOfThisYear = endOfYear(today);
        filteredEvents = eventsToFilter.filter(
          (event) =>
            event.start >= startOfThisYear && event.start <= endOfThisYear
        );
        break;
      case "Last Year":
        const startOfLastYear = startOfYear(subDays(today, 365));
        const endOfLastYear = endOfYear(subDays(today, 365));
        filteredEvents = eventsToFilter.filter(
          (event) =>
            event.start >= startOfLastYear && event.start <= endOfLastYear
        );
        break;
      case "Future":
        filteredEvents = eventsToFilter.filter((event) => event.start >= today);
        break;
      case "Past":
        filteredEvents = eventsToFilter.filter((event) => event.start < today);
        break;
      case "All Time":
        filteredEvents = eventsToFilter;
        break;
      case "Custom":
        filteredEvents = eventsToFilter.filter(
          (event) =>
            event.start >= dateRange.from && event.start <= dateRange.to
        );
        break;
      default:
        break;
    }

    if (status) {
      filteredEvents = filteredEvents.filter((event) =>
        status === "paid" ? event.paid : !event.paid
      );
    }

    if (searchTerm) {
      filteredEvents = filteredEvents.filter(
        (event) =>
          event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (event.description ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (event.clientName ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    setEvents(filteredEvents);
  };

  const applyFilters = (status: string, range: { from: Date; to: Date }) => {
    let filteredEvents = allEvents;

    // Filter by status
    if (status) {
      filteredEvents = filteredEvents.filter((event) =>
        status === "paid" ? event.paid : !event.paid
      );
    }

    if (range.from && range.to) {
      filteredEvents = filteredEvents.filter(
        (event) => event.start >= range.from && event.start <= range.to
      );
    }

    setEvents(filteredEvents);
  };

  const filterEventsByDateRange = (from: Date, to: Date) => {
    let filteredEvents = allEvents.filter(
      (event) => event.start >= from && event.start <= to
    );

    if (statusFilter) {
      filteredEvents = filteredEvents.filter((event) =>
        statusFilter === "paid" ? event.paid : !event.paid
      );
    }
    setEvents(filteredEvents);
  };

  const handleStatusFilterChange = (filter: string) => {
    setStatusFilter(filter);
    if (filter === "") {
      filterEvents(selectedLabel, allEvents, "", selectedDateRange, search); // Pass search term
    } else {
      filterEvents(selectedLabel, allEvents, filter, selectedDateRange, search); // Pass search term
    }
  };

  const handleLabelSelect = (label: string) => {
    setSelectedLabel(label);
    filterEvents(label, allEvents, statusFilter, selectedDateRange, search); // Pass search term
  };

  const handleDateSelect = (range: { from: Date; to: Date }) => {
    setSelectedDateRange(range);
    setSelectedLabel("Custom"); // Update label to "Custom"
    filterEvents("Custom", allEvents, statusFilter, range, search); // Pass search term
  };

  const getColorWithOpacity = (color: string, opacity: number) => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const color = "#007bff"; // Example color, replace with your desired color
  const colorWithOpacity = getColorWithOpacity(color, 0.2);

  const fetchAllClients = useCallback(async () => {
    if (user) {
      // Fetching clients from Firestore
      const clients = await fetchClients(user.uid);
      // an array of objects with "key": name and value: join firstName field and lastName field
      const clientsArray = clients.map((client) => {
        return {
          docId: client.docId || "", // Ensure docId is always a string
          fullName: client.firstName + " " + client.lastName,
        };
      });
      setClients(clientsArray);
    }
  }, [user]);

  const fetchAllBookingTypes = useCallback(async () => {
    if (user) {
      // Fetching booking types from Firestore
      const types = await fetchBookingTypes(user.uid);
      const typesArray = types.map((type) => {
        return {
          docId: type.docId!,
          name: type.name,
        };
      });
      // console.log("Booking types fetched:", typesArray);
      setTypes(typesArray);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true); // Start loading

      try {
        await Promise.all([
          fetchEvents(),
          fetchAllClients(),
          fetchAllBookingTypes(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchData();
  }, [fetchEvents, fetchAllClients, fetchAllBookingTypes]);

  useEffect(() => {
    filterEvents(
      selectedLabel,
      allEvents,
      statusFilter,
      selectedDateRange,
      search
    );
  }, [search, selectedLabel, statusFilter, selectedDateRange, allEvents]);

  const handleCellClick = (
    id: string,
    field: string,
    value: string,
    isRecurring: boolean
  ) => {
    // Remove the condition that prevents non-recurring events from being edited
    setEditingCell({ id, field });
    setEditedValue(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedValue(e.target.value);
  };

  const handleBlur = async () => {
    if (editingCell) {
      const { id, field } = editingCell;
      // const docRef = doc(
      //   db,
      //   "users",
      //   auth.currentUser?.uid ?? "",
      //   "events",
      //   id
      // );
      const currentEvent = events.find((event) => event.id === id);
      if (!currentEvent) {
        setEditingCell(null);
        return;
      }
      let updates: any = {};

      // if (field === "paid") {
      //   updates[field] = editedValue === "true";
      // }

      if (field === "clientName") {
        if (currentEvent.clientName !== editedValue) {
          updates = { [field]: editedValue };
          const matchedClient = clients.find(
            (client) =>
              client.fullName.toLowerCase() === editedValue.toLowerCase()
          );
          if (matchedClient) {
            updates = {
              clientId: matchedClient.docId,
              clientName: editedValue,
            };
            // console.log("Matched client:", matchedClient);
          } else {
            updates = { clientId: "", clientName: editedValue };
            // console.log("Client not found:", editedValue);
          }
        }
      }

      if (field === "type") {
        if (currentEvent.type !== editedValue) {
          updates = { [field]: editedValue };
          const matchedType = types.find(
            (type) => type.name.toLowerCase() === editedValue.toLowerCase()
          );
          if (matchedType) {
            updates = { typeId: matchedType.docId, type: editedValue };
            // console.log("Matched type:", matchedType);
          } else {
            updates = { typeId: "", type: editedValue };
            // console.log("Type not found:", editedValue);
          }
        }
      }

      if (field === "fee") {
        if (currentEvent.fee !== parseFloat(editedValue)) {
          updates = { [field]: parseFloat(editedValue) };
        }
      }

      if (field === "start" || field === "end") {
        const [time, period] = editedValue.split(" ");
        const [hours, minutes] = time.split(":");
        if (hours !== undefined && minutes !== undefined) {
          if (currentEvent) {
            const updatedTime = new Date(
              currentEvent[field === "start" ? "start" : "end"]
            );
            const originalHours = updatedTime.getHours();
            const originalMinutes = updatedTime.getMinutes();

            // Convert input time to 24-hour format
            let inputHours = parseInt(hours, 10);
            if (period) {
              if (period.toLowerCase() === "pm" && inputHours < 12) {
                inputHours += 12;
              } else if (period.toLowerCase() === "am" && inputHours === 12) {
                inputHours = 0;
              }
            }

            // Only update if the time has changed
            if (
              inputHours !== originalHours ||
              parseInt(minutes, 10) !== originalMinutes
            ) {
              // console.log(`Time changed for ${field}:`);
              // console.log(`Original time: ${originalHours}:${originalMinutes}`);
              // console.log(`New time: ${inputHours}:${minutes}`);

              updatedTime.setHours(inputHours);
              updatedTime.setMinutes(parseInt(minutes, 10));
              updatedTime.setSeconds(0);

              const updatedDay = updatedTime.toLocaleDateString("en-US", {
                weekday: "long",
              });
              const updatedDate = updatedTime;

              if (field === "start") {
                // Check if start time is after end time
                const endTime = new Date(currentEvent.end);
                if (updatedTime > endTime) {
                  // alert("Start time cannot be after end time.");
                  openConfirmation({
                    title: "Alert",
                    description: "Start time cannot be after end time.",
                    actionLabel: "Ok",
                    onAction: () => {},
                    onCancel: () => {},
                  });
                  return;
                }

                updates = {
                  start: updatedTime,
                  startDate: updatedDate,
                  startDay: updatedDay,
                };

                // Check if start time is the same as end time
                if (updatedTime.getTime() === endTime.getTime()) {
                  // alert("Start time cannot be the same as end time.");

                  openConfirmation({
                    title: "Alert",
                    description: "Start time cannot be the same as end time.",
                    actionLabel: "Ok",
                    onAction: () => {},
                    onCancel: () => {},
                  });
                  return;
                }
              } else if (field === "end") {
                // Check if end time is before start time
                const startTime = new Date(currentEvent.start);
                if (updatedTime < startTime) {
                  // alert("End time cannot be before start time.");

                  openConfirmation({
                    title: "Alert",
                    description: "End time cannot be before start time.",
                    actionLabel: "Ok",
                    onAction: () => {},
                    onCancel: () => {},
                  });
                  return;
                }

                // Check if end time is the same as start time
                if (updatedTime.getTime() === startTime.getTime()) {
                  // alert("End time cannot be the same as start time.");

                  openConfirmation({
                    title: "Alert",
                    description: "End time cannot be the same as start time.",
                    actionLabel: "Ok",
                    onAction: () => {},
                    onCancel: () => {},
                  });
                  return;
                }

                updates = {
                  end: updatedTime,
                  endDate: updatedDate,
                  endDay: updatedDay,
                };
              }

              // console.log(`Updated date: ${updatedDate}`);
              // console.log(`Updated day: ${updatedDay}`);
            } else {
              // console.log(`Time not changed for ${field}:`);
              // console.log(`Original time: ${originalHours}:${originalMinutes}`);
              // console.log(`New time: ${inputHours}:${minutes}`);
            }
          }
        } else {
          console.error("Invalid time format for start or end time.");
          return;
        }
      } else if (field === "startDate" || field === "endDate") {
        const newDate = moment(editedValue).startOf("day");
        const currentEvent = events.find((event) => event.id === id);
        if (currentEvent) {
          const originalDate = moment(currentEvent[field]).startOf("day");
          const originalDateString = originalDate.format("YYYY-MM-DD");
          const newDateString = newDate.format("YYYY-MM-DD");

          // Only update if the date has changed
          if (originalDateString !== newDateString) {
            const updatedDateField = field === "startDate" ? "start" : "end";
            const updatedTime = moment(currentEvent[updatedDateField]);

            // Preserve the time components and set the new date
            updatedTime.year(newDate.year());
            updatedTime.month(newDate.month());
            updatedTime.date(newDate.date());

            const updatedDay = updatedTime.format("dddd");

            if (field === "startDate") {
              updates = {
                startDate: updatedTime.toDate(),
                startDay: updatedDay,
                start: updatedTime.toDate(),
              };

              // Update end fields if startDate is changed
              const endTime = moment(currentEvent.end);
              endTime.year(newDate.year());
              endTime.month(newDate.month());
              endTime.date(newDate.date());

              const endDay = endTime.format("dddd");

              updates.end = endTime.toDate();
              updates.endDate = endTime.toDate();
              updates.endDay = endDay;

              // console.log(`Start date changed: ${updatedTime.toDate()}`);
              // console.log(`End date adjusted: ${endTime.toDate()}`);
            } else if (field === "endDate") {
              updates = {
                endDate: updatedTime.toDate(),
                endDay: updatedDay,
                end: updatedTime.toDate(),
              };
              // Update start fields if endDate is changed
              const startTime = moment(currentEvent.start);
              startTime.year(newDate.year());
              startTime.month(newDate.month());
              startTime.date(newDate.date());

              const startDay = startTime.format("dddd");

              updates.start = startTime.toDate();
              updates.startDate = startTime.toDate();
              updates.startDay = startDay;

              // console.log(`End date changed: ${updatedTime.toDate()}`);
              // console.log(`Start date adjusted: ${startTime.toDate()}`);
            }
          } else {
            // console.log(`Date not changed for ${field}:`);
            // console.log(`Original date: ${originalDateString}`);
            // console.log(`New date: ${newDateString}`);
          }
        }
      } else if (field === "description") {
        if (currentEvent.description !== editedValue) {
          updates = { [field]: editedValue };
        }
      }

      if (Object.keys(updates).length === 0) {
        setEditingCell(null);
        return;
      }

      // Save the updates to Firestore
      await updateFireStoreEvent(user?.uid!, id, updates);
      // await updateDoc(docRef, updates);

      // Update local state
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === id ? { ...event, ...updates } : event
        )
      );

      setEditingCell(null);
    }
  };

  const getUserTimeZoneOffset = () => {
    // Get the user's timezone offset in minutes and convert to hours
    const offsetMinutes = new Date().getTimezoneOffset();
    return offsetMinutes / 60;
  };

  // Function to add hours to a given date object
  const addHoursToDate = (date: Date, hours: number) => {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  };

  const removeUndefinedFields = (obj: any) => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
  };

  const handleSaveEvent = async (eventData: {
    id?: string;
    title: string;
    type: string;
    typeId: string;
    fee: number;
    clientId: string;
    clientName: string;
    clientPhone: string;
    coachId: string;
    description: string;
    // location: string;
    isBackgroundEvent: boolean;
    date?: string;
    startTime: string;
    endTime: string;
    paid: boolean;
    recurrence?: {
      daysOfWeek: number[];
      startTime: string;
      endTime: string;
      startRecur: string; // YYYY-MM-DD
      endRecur: string; // YYYY-MM-DD
    };
  }): Promise<void> => {
    // console.log("handleSaveEvent called from create bookings"); // Add this line

    //First format the start and end date based on the event selection

    const startDate = eventData.date
      ? new Date(eventData.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    startTransition(async () => {
      setIsLoading(true);
      try {
        if (!user) {
          throw new Error("User not authenticated");
        }

        // Get the user's time zone
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // If this is a recurring event, handle it using the cloud function
        if (
          eventData.recurrence &&
          eventData.recurrence.daysOfWeek &&
          eventData.recurrence.daysOfWeek.length > 0
        ) {
          // Calculate the time zone offsets for start time and end time
          const startDateTime = new Date(`${startDate}T${eventData.startTime}`);
          const endDateTime = new Date(`${startDate}T${eventData.endTime}`);
          const startRecur = new Date(eventData.recurrence.startRecur);
          const endRecur = new Date(eventData.recurrence.endRecur || startDate);
          endRecur.setDate(endRecur.getDate() + 1);

          const eventInput = {
            title: eventData.title || "",
            type: eventData.type || "No type",
            typeId: eventData.typeId || "",
            clientId: eventData.clientId || "",
            clientName: eventData.clientName || "",
            clientPhone: eventData.clientPhone || "",
            coachId: eventData.coachId || "",
            description: eventData.description || "",
            fee: eventData.fee || 0,
            // location: eventData.location || "",
            startDate,
            startTime: eventData.startTime,
            endTime: eventData.endTime,
            paid: eventData.paid,
            recurrence: {
              daysOfWeek: eventData.recurrence.daysOfWeek,
              startRecur: startRecur.toISOString().split("T")[0] || startDate,
              endRecur: endRecur.toISOString().split("T")[0],
            },
            userId: user.uid,
            userTimeZone,
          };

          try {
            const result = await axios.post(
              cloudFunctions.recurringBookingsProd,
              eventInput
            );

            // console.log("Recurring bookings instances created:", result.data);
            toast.success("Recurring bookings added successfully");
          } catch (error) {
            // console.error("Error saving recurring bookings:", error);
            toast.error("Error adding recurring bookings");
          }
        } else {
          let startDateTime = new Date(`${startDate}T${eventData.startTime}`);
          let endDateTime = new Date(`${startDate}T${eventData.endTime}`);

          if (eventData.startTime && eventData.endTime) {
            const [startHour, startMinute] = eventData.startTime
              .split(":")
              .map(Number);
            const [endHour, endMinute] = eventData.endTime
              .split(":")
              .map(Number);

            // Set the time in UTC
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

          // Create the event object for a single or background event
          let event: EventInput = {
            id: "",
            title: eventData.title || "",
            type: eventData.type || "",
            typeId: eventData.typeId || "",
            fee: eventData.fee || 0,
            clientId: eventData.clientId || "",
            clientName: eventData.clientName || "",
            clientPhone: eventData.clientPhone || "",
            coachId: eventData.coachId || "",
            // location: eventData.location || "",
            start: startDateTime,
            end: endDateTime,
            description: eventData.description || "",
            display: "auto",
            className: "",
            isBackgroundEvent: false,
            startDate: startDateTime,
            startDay: startDay,
            endDate: endDateTime,
            endDay: endDay,
            paid: eventData.paid,
          };

          try {
            // console.log("Single event data ready for Firestore:", event);
            event = removeUndefinedFields(event);

            // console.log("Event data before submitting to firebase:", event);

            await createFireStoreEvent(user.uid, event);

            // console.log("Single event created in Firestore with ID:", event.id);
            toast.success("Booking event added successfully");
          } catch (error) {
            // console.error("Error saving event single:", error);
            toast.error("Error adding booking event");
          }
        }
      } catch (error) {
        console.error("Error saving event outer:", error);
        toast.error("An error occurred while adding the event");
      } finally {
        await fetchEvents();
        setIsLoading(false); // Stop loading
      }
    });
    return Promise.resolve();
  };

  const handleSort = (key: SortableKeys) => {
    let direction: "asc" | "desc" = "asc";

    // Toggle direction if the same key is clicked
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    // Update sort config state
    setSortConfig({ key, direction });

    // Perform sorting on events array
    setEvents((prevEvents) =>
      [...prevEvents].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        // Convert dates to timestamps for comparison
        if (key === "startDate" || key === "start" || key === "end") {
          aValue = new Date(a[key]).getTime();
          bValue = new Date(b[key]).getTime();
        } else {
          aValue = a[key] as string;
          bValue = b[key] as string;
        }

        if (aValue < bValue) return direction === "asc" ? -1 : 1;
        if (aValue > bValue) return direction === "asc" ? 1 : -1;
        return 0;
      })
    );
  };

  const getAmPm = (date: Date) => {
    const hours = date.getHours();
    return hours >= 12 ? "PM" : "AM";
  };

  const displayTime = (date: Date) => {
    const adjustedDate = new Date(date.getTime());
    const hours = adjustedDate.getHours().toString().padStart(2, "0");
    const minutes = adjustedDate.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const displayTimeWithAmPm = (date: Date) => {
    const adjustedDate = new Date(date.getTime());
    const hours = adjustedDate.getHours();
    const minutes = adjustedDate.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = (hours % 12 || 12).toString();
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  const handleEditClick = (event: EventInput) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = async (eventId: string) => {
    const confirmDelete = async () => {
      try {
        const batch = writeBatch(db);
        const eventRef = doc(db, "users", user?.uid ?? "", "events", eventId);
        batch.delete(eventRef);
        await batch.commit();

        // Update local state
        setAllEvents((prev) => prev.filter((event) => event.id !== eventId));
        filterEvents(
          selectedLabel,
          allEvents.filter((event) => event.id !== eventId)
        );

        // console.log("Event deleted successfully");
      } catch (error) {
        // console.error("Error deleting event:", error);
      }
    };

    openConfirmation({
      title: "Delete Confirmation",
      description: "Are you sure you want to delete this booking event?",
      cancelLabel: "Cancel",
      actionLabel: "Delete",
      onAction: () => {
        startTransition(async () => {
          await confirmDelete();
          toast.success("Booking event deleted successfully");
        });
      },
      onCancel: () => {},
    });
  };

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      const newSelectedRows = new Set<string>();
      events.forEach((event) => {
        if (event.id) newSelectedRows.add(event.id);
      });
      setSelectedRows(newSelectedRows);
    } else {
      setSelectedRows(new Set());
    }
  };

  const toggleRowSelection = (id: string) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(id)) {
      newSelectedRows.delete(id);
    } else {
      newSelectedRows.add(id);
    }
    setSelectedRows(newSelectedRows);
  };

  const deleteSelectedEvents = async () => {
    const confirmDelete = async () => {
      const batch = writeBatch(db);
      selectedRows.forEach((id) => {
        const docRef = doc(db, "users", user?.uid ?? "", "events", id);
        batch.delete(docRef);
      });
      await batch.commit();

      // Update local state
      const updatedEvents = allEvents.filter(
        (event) => !selectedRows.has(event.id!)
      );
      setAllEvents(updatedEvents);
      filterEvents(selectedLabel, updatedEvents);
      setSelectedRows(new Set());
    };

    openConfirmation({
      title: "Delete Confirmation",
      description:
        "Are you sure you want to delete the selected booking events?",
      cancelLabel: "Cancel",
      actionLabel: "Delete",
      onAction: () => {
        startTransition(async () => {
          await confirmDelete();
          toast.success("Booking events deleted successfully");
        });
      },
      onCancel: () => {},
    });
  };

  // const filteredEvents = events.filter(
  //   (event) =>
  //     event.type.toLowerCase().includes(search.toLowerCase()) ||
  //     (event.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
  //     (event.clientName ?? "").toLowerCase().includes(search.toLowerCase())
  // );

  // Function to clone the event
  const handleCloneClick = async (event: EventInput) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Remove any undefined fields from the cloned event (like exceptions)
      const { id, ...clonedEventData } = {
        ...event,
        description: `${event.description} (Clone)`, // Optional: Append "Clone" to the description
        created_at: new Date(), // Update creation timestamp
      };

      // Remove fields that are undefined
      const sanitizedEventData = Object.fromEntries(
        Object.entries(clonedEventData).filter(([_, v]) => v !== undefined)
      );

      // Save the cloned event to Firestore without the id field
      const eventRef = doc(collection(db, "users", user.uid, "events"));
      await setDoc(eventRef, sanitizedEventData);

      // Update the event with the ID
      await updateDoc(eventRef, { id: eventRef.id });

      // Update local state
      setEvents((prevEvents: EventInput[]) => [
        ...prevEvents,
        { ...sanitizedEventData, id: eventRef.id } as EventInput, //
      ]);

      // console.log("Event cloned successfully");
    } catch (error) {
      // console.error("Error cloning event:", error);
    }
  };

  const handleTogglePaid = async (id: string) => {
    // console.log("Toggling paid status for event ID:", id);

    // Optimistically update the UI
    const updatedAllEvents = allEvents.map((event) =>
      event.id === id ? { ...event, paid: !event.paid } : event
    );
    setAllEvents(updatedAllEvents);

    // Update the filtered events based on the new allEvents state
    filterEvents(
      selectedLabel,
      updatedAllEvents,
      statusFilter,
      selectedDateRange,
      search
    );

    const eventToUpdate = updatedAllEvents.find((event) => event.id === id);
    if (eventToUpdate) {
      try {
        await updateFireStoreEvent(user?.uid!, id, {
          paid: eventToUpdate.paid,
        });
        // console.log("Paid status updated successfully");
        toast.success("Paid status updated successfully");
      } catch (error) {
        // console.error("Error updating paid status:", error);
        toast.error("Error updating paid status");
        // Reverting state on failure
        setAllEvents(allEvents);
        filterEvents(
          selectedLabel,
          allEvents,
          statusFilter,
          selectedDateRange,
          search
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between">
        <Heading title={title} description={description} />
        <div className="flex items-center pt-4 lg:pt-0 gap-3">
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-row">
              <Badge
                className="mr-2 py-0 px-1"
                style={{
                  backgroundColor: colorWithOpacity,
                  color: color,
                }}
              >
                <span className="text-sm font-bold">{selectedLabel}</span>
              </Badge>
              <CalendarDatePicker
                date={selectedDateRange}
                onDateSelect={handleDateSelect}
                onLabelSelect={handleLabelSelect}
              />
            </div>

            <StatusFilter
              value={statusFilter}
              setValue={handleStatusFilterChange}
              filterEvents={filterEvents}
              selectedLabel={selectedLabel}
              allEvents={allEvents}
              selectedDateRange={selectedDateRange}
              search={search}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by type, notes or client"
            className="mb-4 text-base input-no-zoom"
          />
        </div>

        <div className="space-y-4">
          <ScrollArea className="h-[calc(80vh-220px)] rounded-md border md:h-[calc(90dvh-240px)] grid">
            {isLoading && (
              <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner className="w-10 h-10" />
              </div>
            )}
            <Table className="relative">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Checkbox
                      checked={selectedRows.size === events.length}
                      onCheckedChange={(checked: any) =>
                        handleSelectAllChange(!!checked)
                      }
                    />
                  </TableHead>

                  <TableHead>
                    <div className="flex items-center">
                      Date
                      <button onClick={() => handleSort("startDate")}>
                        {sortConfig.key === "startDate" &&
                        sortConfig.direction === "asc" ? (
                          <CaretSortIcon className="rotate-180" />
                        ) : (
                          <CaretSortIcon />
                        )}
                      </button>
                    </div>
                  </TableHead>

                  <TableHead>Day</TableHead>

                  <TableHead>
                    <div className="flex items-center">
                      Start Time
                      <button onClick={() => handleSort("start")}>
                        {sortConfig.key === "start" &&
                        sortConfig.direction === "asc" ? (
                          <CaretSortIcon className="rotate-180" />
                        ) : (
                          <CaretSortIcon />
                        )}
                      </button>
                    </div>
                  </TableHead>

                  <TableHead>
                    <div className="flex items-center">
                      End Time
                      <button onClick={() => handleSort("end")}>
                        {sortConfig.key === "end" &&
                        sortConfig.direction === "asc" ? (
                          <CaretSortIcon className="rotate-180" />
                        ) : (
                          <CaretSortIcon />
                        )}
                      </button>
                    </div>
                  </TableHead>

                  <TableHead>Duration</TableHead>

                  <TableHead>Client</TableHead>

                  <TableHead>Booking Type</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id || ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.has(event.id || "")}
                        onCheckedChange={() => toggleRowSelection(event.id!)}
                      />
                    </TableCell>

                    {/* <TableCell>{event.startDate.toLocaleDateString()}</TableCell> */}

                    {/* Display the date and make it editable */}
                    {/* <TableCell>
                  {editingCell?.id === event.id &&
                  editingCell?.field === "startDate" ? (
                    <input
                      type="date"
                      value={editedValue}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={() =>
                        handleCellClick(
                          event.id!,
                          "startDate",
                          event.startDate.toISOString().split("T")[0],
                          !!event.recurrence
                        )
                      }
                    >
                      {event.startDate.toLocaleDateString()}
                    </div>
                  )}
                </TableCell> */}
                    <TableCell>
                      {event.startDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell>{event.startDay}</TableCell>

                    <TableCell>
                      {editingCell?.id === event.id &&
                      editingCell?.field === "start" ? (
                        <input
                          type="time"
                          value={editedValue}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          step="900"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => {
                            handleCellClick(
                              event.id!,
                              "start",
                              displayTime(event.start),
                              !!event.recurrence
                            );
                            setEditedValue(displayTime(event.start));
                          }}
                        >
                          {displayTimeWithAmPm(event.start)}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingCell?.id === event.id &&
                      editingCell?.field === "end" ? (
                        <input
                          type="time"
                          value={editedValue}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          step="900"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => {
                            handleCellClick(
                              event.id!,
                              "end",
                              displayTime(event.end),
                              !!event.recurrence
                            );
                            setEditedValue(displayTime(event.end));
                          }}
                        >
                          {displayTimeWithAmPm(event.end)}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {(() => {
                        const duration = moment.duration(
                          moment(event.end).diff(moment(event.start))
                        );
                        const hours = Math.floor(duration.asHours());
                        const minutes = duration.minutes();

                        let formattedDuration = "";
                        if (hours > 0) {
                          formattedDuration += `${hours} h `;
                        }
                        if (minutes > 0) {
                          formattedDuration += `${minutes} m`;
                        }
                        if (hours === 0 && minutes === 0) {
                          formattedDuration = "0 m";
                        }

                        return formattedDuration.trim();
                      })()}
                    </TableCell>

                    <TableCell>
                      {editingCell?.id === event.id &&
                      editingCell?.field === "clientName" ? (
                        <Input
                          value={editedValue}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() =>
                            handleCellClick(
                              event.id!,
                              "clientName",
                              event.clientName,
                              !!event.recurrence
                            )
                          }
                        >
                          {event.clientName}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingCell?.id === event.id &&
                      editingCell?.field === "type" ? (
                        <Input
                          value={editedValue}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() =>
                            handleCellClick(
                              event.id!,
                              "type",
                              event.type,
                              !!event.recurrence
                            )
                          }
                        >
                          {event.type}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {editingCell?.id === event.id &&
                      editingCell?.field === "fee" ? (
                        <Input
                          value={editedValue}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() =>
                            handleCellClick(
                              event.id!,
                              "fee",
                              event.fee.toString(),
                              !!event.recurrence
                            )
                          }
                        >
                          {formatFee(event.fee)}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Switch
                        checked={event.paid}
                        onChange={() => {
                          if (event.id) {
                            handleTogglePaid(event.id);
                          } else {
                            console.error("No event ID found");
                          }
                        }}
                        className={`${
                          event.paid ? "bg-rebus-green" : "bg-gray-200"
                        } relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus:outline-none`}
                      >
                        <span
                          className={`${
                            event.paid ? "translate-x-5" : "translate-x-1"
                          } inline-block h-4 w-4 transform bg-white rounded-full transition-transform`}
                        />
                      </Switch>
                    </TableCell>

                    <TableCell>
                      {editingCell?.id === event.id &&
                      editingCell?.field === "description" ? (
                        <input
                          value={editedValue}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() =>
                            handleCellClick(
                              event.id!,
                              "description",
                              event.description || "",
                              !!event.recurrence
                            )
                          }
                        >
                          {event.description || "No description"}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost">
                            <DotsHorizontalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {/* Clone Option */}
                          <DropdownMenuItem
                            onClick={() => handleCloneClick(event)}
                          >
                            Clone
                          </DropdownMenuItem>
                          {/*  Delete Option */}
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(event.id!)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="flex justify-between mt-4 p-4">
            <span>{`${selectedRows.size} of ${events.length} row(s) selected`}</span>
          </div>
        </div>

        {selectedRows.size > 0 && (
          <div className="fixed bottom-[calc(4rem+30px)] right-4">
            <button
              className="p-4 bg-black text-white rounded-full shadow-lg hover:bg-blue-500 focus:outline-none"
              onClick={deleteSelectedEvents}
            >
              <Trash2 className="h-6 w-6" />
            </button>
          </div>
        )}

        <div className="fixed bottom-[calc(1.5rem+10px)] right-4">
          <button
            className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 focus:outline-none"
            onClick={() => setIsDialogOpen(true)}
          >
            <PlusCircledIcon className="h-6 w-6" />
          </button>
        </div>

        <CreateBookingsFormDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSaveEvent}
          showDateSelector={true}
          event={editingEvent}
        />
      </div>
    </div>
  );
}
