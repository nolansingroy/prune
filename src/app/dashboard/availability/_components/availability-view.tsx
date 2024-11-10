"use client";

import React, { useTransition, useCallback, useEffect, useState } from "react";
import { EventInput } from "@/interfaces/types";
import { useFirebaseAuth } from "@/services/authService";
import {
  createFireStoreEvent,
  fetchAvailabilitiesListviewEvents,
  updateFireStoreEvent,
} from "@/lib/converters/events";
import moment from "moment";
import axios from "axios";
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../../../../../firebase";
import {
  CaretSortIcon,
  DotsHorizontalIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";
import AvailabilityDialog from "@/comp/AvailabilityFormDialog";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DataTableSkeleton } from "@/components/tables/data-table-skeleton";
import { Trash2 } from "lucide-react";
import useConfirmationStore from "@/lib/store/confirmationStore";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type SortableKeys = "start" | "end" | "title" | "startDate";
export default function AvailabilityView() {
  const { openConfirmation } = useConfirmationStore();
  const [loading, startTransition] = useTransition();
  const { authUser } = useFirebaseAuth();
  const [events, setEvents] = useState<Omit<EventInput, "fee">[]>([]);
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
  const [editingEvent, setEditingEvent] = useState<Omit<
    EventInput,
    "fee"
  > | null>(null);
  const [isLoading, setIsLoading] = useState(false); // New loading state

  const fetchEvents = useCallback(async () => {
    if (!authUser) {
      return;
    } else {
      setIsLoading(true);
      const eventList = await fetchAvailabilitiesListviewEvents(authUser.uid);
      setEvents(eventList);
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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

      const currentEvent = events.find((event) => event.id === id);
      if (!currentEvent) {
        setEditingCell(null);
        return;
      }
      let updates: any = {};

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
              console.log(`Time changed for ${field}:`);
              console.log(`Original time: ${originalHours}:${originalMinutes}`);
              console.log(`New time: ${inputHours}:${minutes}`);

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

              console.log(`Start date changed: ${updatedTime.toDate()}`);
              console.log(`End date adjusted: ${endTime.toDate()}`);
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

              console.log(`End date changed: ${updatedTime.toDate()}`);
              console.log(`Start date adjusted: ${startTime.toDate()}`);
            }
          } else {
            console.log(`Date not changed for ${field}:`);
            console.log(`Original date: ${originalDateString}`);
            console.log(`New date: ${newDateString}`);
          }
        }
      } else if (field === "title") {
        if (currentEvent.title !== editedValue) {
          updates = { [field]: editedValue };
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
      await updateFireStoreEvent(authUser?.uid!, id, updates);

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

  const handleSaveEvent = async (eventData: {
    title: string;
    description: string;
    location: string;
    isBackgroundEvent: boolean;
    date?: string;
    startTime: string;
    endTime: string;
    recurrence?: {
      daysOfWeek: number[];
      startRecur: string; // YYYY-MM-DD
      endRecur: string; // YYYY-MM-DD
    };
  }) => {
    console.log("handleSaveEvent called from create Availability");

    // First format the start date and end date based on the event selection
    const startDate = eventData.date
      ? new Date(eventData.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    setIsLoading(true);

    try {
      const user = authUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get the user's time zone
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Check if the event is recurring or a single event
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
          description: eventData.description || "",
          location: eventData.location || "",
          startDate,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          recurrence: {
            daysOfWeek: eventData.recurrence.daysOfWeek || [],
            startRecur: startRecur.toISOString().split("T")[0] || startDate,
            endRecur: endRecur.toISOString().split("T")[0],
          },
          userId: user.uid,
          userTimeZone,
        };

        console.log(
          "event data ready for cloud function for background event from availabity tab",
          eventInput
        );

        const result = await axios.post(
          "https://us-central1-prune-94ad9.cloudfunctions.net/createRecurringAvailabilityInstances",
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

        // Create a new event object
        const eventInput = {
          id: "",
          title: eventData.title,
          type: "",
          typeId: "",
          fee: 0,
          clientId: "",
          clientName: "",
          location: eventData.location || "",
          start: startDateTime,
          end: endDateTime,
          description: eventData.description || "",
          display: "inverse-background",
          className: "",
          isBackgroundEvent: true,
          startDate: startDateTime,
          startDay: startDay,
          endDate: endDateTime,
          endDay: endDay,
          paid: false,
        };
        console.log("Single event data ready for Firestore:", eventInput);

        console.log("Event data before submitting to firebase:", eventInput);

        await createFireStoreEvent(user.uid, eventInput);

        console.log(
          "Single event created in Firestore with ID:",
          eventInput.id
        );
      }

      // Fetch events again to update the list
      await fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setIsLoading(false); // Stop loading
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
    const confirmDelet = async () => {
      try {
        const batch = writeBatch(db); // Create a Firestore batch operation
        const eventRef = doc(
          db,
          "users",
          authUser?.uid ?? "",
          "events",
          eventId
        );
        batch.delete(eventRef);
        await batch.commit();

        // Update the local state to remove the deleted event
        setEvents((prev) => prev.filter((event) => event.id !== eventId));

        console.log("Event deleted successfully");
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    };

    openConfirmation({
      title: "Delete Availability",
      description: "Are you sure you want to delete this availability?",
      cancelLabel: "Cancel",
      actionLabel: "Delete",
      onAction: () => {
        startTransition(async () => {
          await confirmDelet();
          toast.success("Availability deleted successfully");
        });
      },
      onCancel: () => {},
    });
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
    // if (
    //   window.confirm("Are you sure you want to delete the selected events?")
    // ) {

    const confirmDelete = async () => {
      const batch = writeBatch(db);
      selectedRows.forEach((id) => {
        const docRef = doc(db, "users", authUser?.uid ?? "", "events", id);
        batch.delete(docRef);
      });
      await batch.commit();
      setEvents(
        events.filter((event) => event.id && !selectedRows.has(event.id))
      );
      setSelectedRows(new Set());
    };

    openConfirmation({
      title: "Delete Availabilities",
      description:
        "Are you sure you want to delete the selected availabilities?",
      cancelLabel: "Cancel",
      actionLabel: "Delete",
      onAction: () => {
        startTransition(async () => {
          await confirmDelete();
          toast.success("Availabilities deleted successfully");
        });
      },
      onCancel: () => {},
    });
  };

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      (event.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Function to clone the event
  const handleCloneClick = async (event: Omit<EventInput, "fee">) => {
    try {
      const user = authUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Remove any undefined fields from the cloned event (like exceptions)
      const { id, ...clonedEventData } = {
        ...event,
        title: `${event.title} (Clone)`, // Optional: Append "Clone" to the title
        created_at: new Date(), // Update creation timestamp
      };

      // Remove fields that are undefined
      const sanitizedEventData = Object.fromEntries(
        Object.entries(clonedEventData).filter(([_, v]) => v !== undefined)
      );

      // Save the cloned event to Firestore without the id field
      const eventRef = doc(collection(db, "users", user.uid, "events"));
      await setDoc(eventRef, sanitizedEventData);

      // Update local state
      setEvents((prevEvents: Omit<EventInput, "fee">[]) => [
        ...prevEvents,
        { ...sanitizedEventData, id: eventRef.id } as EventInput, // Assign the newly generated id
      ]);

      console.log("Event cloned successfully");
    } catch (error) {
      console.error("Error cloning event:", error);
    }
  };

  return (
    <div className="w-full relative flex flex-col h-screen">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by title or description"
        className="mb-4"
      />

      <div className="space-y-4">
        <ScrollArea className="h-[calc(80vh-220px)] rounded-md border md:h-[calc(90dvh-240px)]">
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

                <TableHead>Title</TableHead>
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
                  <TableCell>{event.startDate.toLocaleDateString()}</TableCell>
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
                    editingCell?.field === "title" ? (
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
                            "title",
                            event.title || "",
                            !!event.recurrence
                          )
                        }
                      >
                        {event.title || "Untitled"}
                      </div>
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
                        {/* <DropdownMenuItem onClick={() => handleCloneClick(event)}>
                        Clone
                      </DropdownMenuItem> */}
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
      </div>

      <div className="flex justify-between mt-4 p-4">
        <span>{`${selectedRows.size} of ${events.length} row(s) selected`}</span>
        {/* <div className="pr-16">
          <Button
            onClick={deleteSelectedEvents}
            disabled={selectedRows.size === 0}
          >
            Delete Selected
          </Button>
        </div> */}
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

      <AvailabilityDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveEvent}
        event={editingEvent}
      />
    </div>
  );
}
