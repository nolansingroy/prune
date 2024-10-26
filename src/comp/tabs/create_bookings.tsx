import Image from "next/image";
import React, { useCallback } from "react";
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  updateDoc,
  Timestamp,
  arrayUnion,
  getDoc,
  setDoc,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { EventInput } from "../../interfaces/types";
import { RRule } from "rrule";
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";
import AvailabilityDialog from "../AvailabilityFormDialog";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createEvent } from "../../services/userService";
import { getFunctions, httpsCallable } from "firebase/functions";
import moment from "moment-timezone";
import axios from "axios";
import { orderBy } from "firebase/firestore";
import CreateBookingsFormDialog from "../CreateBookingsFormDialog";
import { fetchBookingTypes } from "@/lib/converters/bookingTypes";
import { fetchClients } from "@/lib/converters/clients";

const formatFee = (fee: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(fee);
};

type SortableKeys = "start" | "end" | "title" | "startDate";

export default function CreateBookings() {
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
  const [userTimezone, setUserTimezone] = useState<string>("UTC");
  const [loading, setLoading] = useState(false); // New loading state
  const [clients, setClients] = useState<{ docId: string; fullName: string }[]>(
    []
  );
  const [types, setTypes] = useState<{ docId: string; name: string }[]>([]);

  useEffect(() => {
    fetchUserTimezone();
    fetchEvents();
  }, []);

  const fetchUserTimezone = async () => {
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      setUserTimezone(userData?.timezone || "UTC");
    }
  };

  const fetchAllClients = useCallback(async () => {
    if (auth.currentUser) {
      // Fetching clients from Firestore
      const clients = await fetchClients(auth.currentUser.uid);
      //create an array of object with "key": name and value : join firstName field and lastName field
      const clientsArray = clients.map((client) => {
        return {
          docId: client.docId,
          fullName: client.firstName + " " + client.lastName,
        };
      });
      console.log("Clients fetched:", clientsArray);
      setClients(clientsArray);
    }
  }, []);

  const fetchAllBookingTypes = useCallback(async () => {
    if (auth.currentUser) {
      // Fetching booking types from Firestore
      const types = await fetchBookingTypes(auth.currentUser.uid);
      const typesArray = types.map((type) => {
        return {
          docId: type.docId!,
          name: type.name,
        };
      });
      console.log("Booking types fetched:", typesArray);
      setTypes(typesArray);
    }
  }, []);

  useEffect(() => {
    fetchAllClients();
  }, [fetchAllClients]);

  useEffect(() => {
    fetchAllBookingTypes();
  }, [fetchAllBookingTypes]);

  const fetchEvents = async () => {
    if (auth.currentUser) {
      const eventsRef = collection(db, "users", auth.currentUser.uid, "events");

      // Get the current date (from today onwards)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set time to midnight to match the start of the day

      // Fetch events by "start" field where the date is from today onwards
      const q = query(
        eventsRef,
        where("isBackgroundEvent", "==", false),
        where("start", ">=", today), // Fetch events starting from today onwards
        orderBy("start", "asc") // Ascending order
      );

      const querySnapshot = await getDocs(q);
      let eventsList: EventInput[] = [];

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const start =
          data.start instanceof Timestamp
            ? data.start.toDate()
            : new Date(data.start);
        const end =
          data.end instanceof Timestamp
            ? data.end.toDate()
            : new Date(data.end);

        if (data.recurrence) {
          const dtstart = new Date(start);
          eventsList.push({
            id: doc.id,
            title: data.title,
            type: data.type,
            typeId: data.typeId,
            fee: data.fee,
            clientId: data.clientId,
            clientName: data.clientName,
            start: dtstart,
            end: new Date(
              dtstart.getTime() + (end.getTime() - start.getTime())
            ), // Calculate end time based on duration
            description: data.description || "",
            isBackgroundEvent: data.isBackgroundEvent,
            startDate: dtstart,
            startDay: dtstart.toLocaleDateString("en-US", { weekday: "long" }),
            endDate: new Date(
              dtstart.getTime() + (end.getTime() - start.getTime())
            ),
            endDay: new Date(
              dtstart.getTime() + (end.getTime() - start.getTime())
            ).toLocaleDateString("en-US", { weekday: "long" }),
            paid: data.paid,
            recurrence: data.recurrence,
            exceptions: data.exceptions,
          });
        } else {
          eventsList.push({
            id: doc.id,
            title: data.title,
            type: data.type,
            typeId: data.typeId,
            fee: data.fee,
            clientId: data.clientId,
            clientName: data.clientName,
            start: start,
            end: end,
            description: data.description || "",
            isBackgroundEvent: data.isBackgroundEvent,
            startDate: start,
            startDay: start.toLocaleDateString("en-US", { weekday: "long" }),
            endDate: end,
            endDay: end.toLocaleDateString("en-US", { weekday: "long" }),
            paid: data.paid,
          });
        }
      });
      setEvents(eventsList);
    }
  };

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
      const docRef = doc(
        db,
        "users",
        auth.currentUser?.uid ?? "",
        "events",
        id
      );
      let updates: any = {};

      if (field === "clientName") {
        updates = { [field]: editedValue };
        const matchedClient = clients.find(
          (client) =>
            client.fullName.toLowerCase() === editedValue.toLowerCase()
        );
        if (matchedClient) {
          updates = { clientId: matchedClient.docId, clientName: editedValue };
          console.log("Matched client:", matchedClient);
        } else {
          updates = { clientId: "", clientName: editedValue };
          console.log("Client not found:", editedValue);
        }
      }

      if (field === "type") {
        updates = { [field]: editedValue };
        const matchedType = types.find(
          (type) => type.name.toLowerCase() === editedValue.toLowerCase()
        );
        if (matchedType) {
          updates = { typeId: matchedType.docId, type: editedValue };
          console.log("Matched type:", matchedType);
        } else {
          updates = { typeId: "", type: editedValue };
          console.log("Type not found:", editedValue);
        }
      }

      if (field === "fee") {
        updates = { [field]: parseFloat(editedValue) };
      }

      const getUserTimeZoneOffset = () => {
        return new Date().getTimezoneOffset() / 60;
      };

      if (field === "start" || field === "end") {
        const [time, period] = editedValue.split(" ");
        const [hours, minutes] = time.split(":");
        if (hours !== undefined && minutes !== undefined) {
          const currentEvent = events.find((event) => event.id === id);
          if (currentEvent) {
            const updatedTime = new Date(
              currentEvent[field === "start" ? "start" : "end"]
            );
            const originalHours = updatedTime.getUTCHours();
            const originalMinutes = updatedTime.getUTCMinutes();

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
              console.log(`Time changed for ${field}:`);
              console.log(`Original time: ${originalHours}:${originalMinutes}`);
              console.log(`New time: ${inputHours}:${minutes}`);

              updatedTime.setUTCHours(inputHours);
              updatedTime.setUTCMinutes(parseInt(minutes, 10));
              updatedTime.setUTCSeconds(0);

              const updatedDay = updatedTime.toLocaleDateString("en-US", {
                weekday: "long",
                timeZone: "UTC",
              });
              const updatedDate = updatedTime;

              if (field === "start") {
                // Check if start time is after end time
                const endTime = new Date(currentEvent.end);
                if (updatedTime > endTime) {
                  alert("Start time cannot be after end time.");
                  return;
                }

                updates = {
                  start: updatedTime,
                  startDate: updatedDate,
                  startDay: updatedDay,
                };

                // Check if start time is the same as end time
                if (updatedTime.getTime() === endTime.getTime()) {
                  alert("Start time cannot be the same as end time.");
                  return;
                }
              } else if (field === "end") {
                // Check if end time is before start time
                const startTime = new Date(currentEvent.start);
                if (updatedTime < startTime) {
                  alert("End time cannot be before start time.");
                  return;
                }

                // Check if end time is the same as start time
                if (updatedTime.getTime() === startTime.getTime()) {
                  alert("End time cannot be the same as start time.");
                  return;
                }

                updates = {
                  end: updatedTime,
                  endDate: updatedDate,
                  endDay: updatedDay,
                };
              }

              console.log(`Updated date: ${updatedDate}`);
              console.log(`Updated day: ${updatedDay}`);
            } else {
              console.log(`Time not changed for ${field}:`);
              console.log(`Original time: ${originalHours}:${originalMinutes}`);
              console.log(`New time: ${inputHours}:${minutes}`);
            }
          }
        } else {
          console.error("Invalid time format for start or end time.");
          return;
        }
      } else if (field === "startDate" || field === "endDate") {
        const newDate = new Date(editedValue);
        const currentEvent = events.find((event) => event.id === id);
        if (currentEvent) {
          const originalDate = new Date(currentEvent[field]);
          const originalDateString = originalDate.toISOString().split("T")[0];
          const newDateString = newDate.toISOString().split("T")[0];

          // Only update if the date has changed
          if (originalDateString !== newDateString) {
            const utcDate = new Date(
              Date.UTC(
                newDate.getUTCFullYear(),
                newDate.getUTCMonth(),
                newDate.getUTCDate(),
                newDate.getUTCHours(),
                newDate.getUTCMinutes(),
                newDate.getUTCSeconds()
              )
            );

            const updatedDateField = field === "startDate" ? "start" : "end";
            const updatedTime = new Date(currentEvent[updatedDateField]);

            updatedTime.setUTCFullYear(
              utcDate.getUTCFullYear(),
              utcDate.getUTCMonth(),
              utcDate.getUTCDate()
            );

            const updatedDay = updatedTime.toLocaleDateString("en-US", {
              weekday: "long",
              timeZone: "UTC",
            });

            if (field === "startDate") {
              updates = {
                startDate: updatedTime,
                startDay: updatedDay,
                start: updatedTime,
              };

              // Update end fields if startDate is changed
              const endTime = new Date(currentEvent.end);
              endTime.setUTCFullYear(
                utcDate.getUTCFullYear(),
                utcDate.getUTCMonth(),
                utcDate.getUTCDate()
              );

              const endDay = endTime.toLocaleDateString("en-US", {
                weekday: "long",
                timeZone: "UTC",
              });

              updates.end = endTime;
              updates.endDate = endTime;
              updates.endDay = endDay;

              console.log(`Start date changed: ${updatedTime}`);
              console.log(`End date adjusted: ${endTime}`);
            } else if (field === "endDate") {
              updates = {
                endDate: updatedTime,
                endDay: updatedDay,
                end: updatedTime,
              };
              // Update start fields if endDate is changed
              const startTime = new Date(currentEvent.start);
              startTime.setUTCFullYear(
                utcDate.getUTCFullYear(),
                utcDate.getUTCMonth(),
                utcDate.getUTCDate()
              );

              const startDay = startTime.toLocaleDateString("en-US", {
                weekday: "long",
                timeZone: "UTC",
              });

              updates.start = startTime;
              updates.startDate = startTime;
              updates.startDay = startDay;

              console.log(`End date changed: ${updatedTime}`);
              console.log(`Start date adjusted: ${startTime}`);
            }
          } else {
            console.log(`Date not changed for ${field}:`);
            console.log(`Original date: ${originalDateString}`);
            console.log(`New date: ${newDateString}`);
          }
        }
      } else if (field === "description") {
        updates = { [field]: editedValue };
      }

      // Save the updates to Firestore
      await updateDoc(docRef, updates);

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
    description: string;
    location: string;
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
  }) => {
    console.log("handleSaveEvent called from create bookings"); // Add this line

    //First format the start and end date based on the event selection

    const startDate = eventData.date
      ? new Date(eventData.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    setLoading(true); // Start loading

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      // If this is a recurring event, handle it using the cloud function
      if (
        eventData.recurrence &&
        eventData.recurrence.daysOfWeek &&
        eventData.recurrence.daysOfWeek.length > 0
      ) {
        // Adjust end recurrence date
        const endRecur = new Date(eventData.recurrence.endRecur || startDate);
        endRecur.setDate(endRecur.getDate() + 1);

        const eventInput = {
          title: eventData.title,
          type: eventData.type,
          typeId: eventData.typeId,
          clientId: eventData.clientId,
          clientName: eventData.clientName,
          description: eventData.description,
          fee: eventData.fee,
          location: eventData.location || "",
          startDate,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          paid: eventData.paid,
          recurrence: {
            daysOfWeek: eventData.recurrence.daysOfWeek,
            startRecur: eventData.recurrence.startRecur || startDate,
            endRecur: endRecur.toISOString().split("T")[0],
          },
          userId: user.uid,
        };

        console.log(
          "event data ready for cloud function for recurring bookings",
          eventInput
        );

        // Make the axios call to your cloud function
        // "http://127.0.0.1:5001/prune-94ad9/us-central1/createRecurringBookingInstances",
        const result = await axios.post(
          "https://us-central1-prune-94ad9.cloudfunctions.net/createRecurringBookingInstances",
          eventInput
        );

        console.log("Recurring event instances created:", result.data);
      } else {
        let startDateTime = new Date(`${startDate}T${eventData.startTime}`);
        let endDateTime = new Date(`${startDate}T${eventData.endTime}`);

        if (eventData.startTime && eventData.endTime) {
          const [startHour, startMinute] = eventData.startTime
            .split(":")
            .map(Number);
          const [endHour, endMinute] = eventData.endTime.split(":").map(Number);

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
          title: eventData.title,
          type: eventData.type,
          typeId: eventData.typeId,
          fee: eventData.fee,
          clientId: eventData.clientId,
          clientName: eventData.clientName,
          location: eventData.location || "",
          start: startDateTime, // Save in UTC
          end: endDateTime, // Save in UTC
          description: eventData.description,
          display: "auto",
          className: "",
          isBackgroundEvent: false,
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
          paid: eventData.paid,
        };

        console.log("Single event data ready for Firestore:", event);
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
      }

      // // Helper function to adjust for time zone offset and return UTC date
      // const adjustToUTC = (dateTime: Date) => {
      //   const timezoneOffset = dateTime.getTimezoneOffset(); // Timezone offset in minutes
      //   return new Date(dateTime.getTime() - timezoneOffset * 60 * 1000); // Adjust to UTC
      // };

      // // Parse the start and end times
      // let startDateTime = new Date(`${startDate}T${eventData.startTime}`);
      // let endDateTime = new Date(`${startDate}T${eventData.endTime}`);

      // // Ensure the end time is after the start time
      // if (endDateTime <= startDateTime) {
      //   endDateTime.setDate(endDateTime.getDate() + 1);
      // }

      // // Adjust the start and end times to UTC
      // startDateTime = adjustToUTC(startDateTime);
      // endDateTime = adjustToUTC(endDateTime);

      // // Calculate related fields
      // const startDay = startDateTime.toLocaleDateString("en-US", {
      //   weekday: "long",
      //   timeZone: "UTC",
      // });
      // const endDay = endDateTime.toLocaleDateString("en-US", {
      //   weekday: "long",
      //   timeZone: "UTC",
      // });

      // // Check if the event is recurring or a single event
      // if (
      //   !eventData.recurrence ||
      //   eventData.recurrence.daysOfWeek.length === 0
      // ) {
      //   // Client-side single event creation
      //   console.log("storing using client side single event creation");
      //   // Parse the start and end times
      //   // let startDateTime = new Date(`${startDate}T${eventData.startTime}`);
      //   // let endDateTime = new Date(`${startDate}T${eventData.endTime}`);

      //   // // Ensure the end time is after the start time
      //   // if (endDateTime <= startDateTime) {
      //   //   endDateTime.setDate(endDateTime.getDate() + 1);
      //   // }

      //   // // Adjust the start and end times to UTC
      //   // startDateTime = adjustToUTC(startDateTime);
      //   // endDateTime = adjustToUTC(endDateTime);

      //   // Create a new event object
      //   const eventInput = {
      //     type: eventData.type,
      //     typeId: eventData.typeId,
      //     fee: eventData.fee,
      //     clientId: eventData.clientId,
      //     clientName: eventData.clientName,
      //     description: eventData.description,
      //     location: eventData.location || "",
      //     isBackgroundEvent: eventData.isBackgroundEvent,

      //     start: startDateTime, // Save in UTC
      //     end: endDateTime, // Save in UTC
      //     startDate: startDateTime,
      //     startDay: startDay,
      //     endDate: endDateTime,
      //     endDay: endDay,
      //     paid: eventData.paid,
      //     created_at: new Date(), // Timestamp of creation
      //     updated_at: new Date(), // Timestamp of last update
      //   };

      //   // Save the event directly to Firestore
      //   const eventRef = doc(collection(db, "users", user.uid, "events"));
      //   await setDoc(eventRef, eventInput);

      //   console.log("Single event created in Firestore");
      // } else {
      //   // Server-side recurring event creation using the cloud function
      //   console.log("storing using server side");

      //   // Add 2 day to the endRecur date to ensure the last day is included
      //   const endRecur = new Date(eventData.recurrence?.endRecur || startDate);
      //   endRecur.setDate(endRecur.getDate() + 2);

      //   const eventInput = {
      //     type: eventData.type,
      //     typeId: eventData.typeId,
      //     fee: eventData.fee,
      //     clientId: eventData.clientId,
      //     clientName: eventData.clientName,
      //     description: eventData.description,
      //     location: eventData.location || "",
      //     startDate,
      //     startTime: eventData.startTime,
      //     endTime: eventData.endTime,
      //     paid: eventData.paid,
      //     recurrence: {
      //       daysOfWeek: eventData.recurrence?.daysOfWeek || [],
      //       startRecur: eventData.recurrence?.startRecur || startDate,
      //       endRecur: adjustToUTC(endRecur).toISOString().split("T")[0],
      //     },
      //     userId: user.uid,
      //   };

      //   const result = await axios.post(
      //     "https://us-central1-prune-94ad9.cloudfunctions.net/createRecurringBookingInstances",
      //     eventInput
      //   );

      //   console.log("Recurring event instances created:", result.data);
      // }

      // Fetch events again to update the list
      await fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setLoading(false); // Stop loading
    }
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

  const displayTimeWithOffset = (date: Date) => {
    const userTimezoneOffsetInHours = new Date().getTimezoneOffset() / 60;
    const adjustedDate = new Date(
      date.getTime() + userTimezoneOffsetInHours * 60 * 60 * 1000
    );
    return adjustedDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleEditClick = (event: EventInput) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = async (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const batch = writeBatch(db); // Create a Firestore batch operation
        const eventRef = doc(
          db,
          "users",
          auth.currentUser?.uid ?? "",
          "events",
          eventId
        );

        batch.delete(eventRef); // Add delete operation to batch

        // Commit the batch to execute the delete
        await batch.commit();

        // Update the local state to remove the deleted event
        setEvents((prev) => prev.filter((event) => event.id !== eventId));

        console.log("Event deleted successfully");
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      const newSelectedRows = new Set<string>();
      filteredEvents.forEach((event) => {
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
    if (
      window.confirm("Are you sure you want to delete the selected events?")
    ) {
      const batch = writeBatch(db);
      selectedRows.forEach((id) => {
        const docRef = doc(
          db,
          "users",
          auth.currentUser?.uid ?? "",
          "events",
          id
        );
        batch.delete(docRef);
      });
      await batch.commit();
      setEvents(
        events.filter((event) => event.id && !selectedRows.has(event.id))
      );
      setSelectedRows(new Set());
    }
  };

  const filteredEvents = events.filter(
    (event) =>
      event.type.toLowerCase().includes(search.toLowerCase()) ||
      (event.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Function to clone the event
  const handleCloneClick = async (event: EventInput) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Remove any undefined fields from the cloned event (like exceptions)
      const { id, ...clonedEventData } = {
        ...event,
        description: `${event.type} (Clone)`, // Optional: Append "Clone" to the description
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
        { ...sanitizedEventData, id: eventRef.id } as EventInput, // Assign the newly generated id
      ]);

      console.log("Event cloned successfully");
    } catch (error) {
      console.error("Error cloning event:", error);
    }
  };

  return (
    <div className="w-full relative">
      <h1 className="text-xl font-bold mb-4">Bookings</h1>
      {/* Add loading spinner here */}
      {loading && <div className="spinner">Loading...</div>}
      <hr></hr>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by title or description"
        className="mb-4"
      />

      <div className="overflow-y-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox
                  checked={selectedRows.size === filteredEvents.length}
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
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredEvents.map((event) => (
              <TableRow key={event.id || ""}>
                <TableCell>
                  <Checkbox
                    checked={selectedRows.has(event.id || "")}
                    onCheckedChange={() => toggleRowSelection(event.id!)}
                  />
                </TableCell>

                {/* <TableCell>{event.startDate.toLocaleDateString()}</TableCell> */}

                {/* Display the date and make it editable */}
                <TableCell>
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
                      onClick={() =>
                        handleCellClick(
                          event.id!,
                          "start",
                          displayTimeWithOffset(event.start),
                          !!event.recurrence
                        )
                      }
                    >
                      {displayTimeWithOffset(event.start)}
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
                      onClick={() =>
                        handleCellClick(
                          event.id!,
                          "end",
                          displayTimeWithOffset(event.end),
                          !!event.recurrence
                        )
                      }
                    >
                      {displayTimeWithOffset(event.end)}
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
                      <DropdownMenuItem onClick={() => handleCloneClick(event)}>
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
      </div>

      <div className="flex justify-between mt-4">
        <span>{`${selectedRows.size} of ${events.length} row(s) selected`}</span>
        <div className="pr-16">
          <Button
            onClick={deleteSelectedEvents}
            disabled={selectedRows.size === 0}
          >
            Delete Selected
          </Button>
        </div>
      </div>

      <div className="fixed bottom-[calc(4rem+30px)] right-4">
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
  );
}
