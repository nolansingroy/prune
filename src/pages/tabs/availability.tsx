import Image from "next/image";
import * as React from "react";
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
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

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
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogOverlay,
} from "@radix-ui/react-dialog";
import { createEvent } from "../../services/userService";
import EventFormDialog from "../EventFormModal";

type SortableKeys = "start" | "end" | "title";

export default function Availability() {
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
  }>({ key: "start", direction: "asc" });
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State for the dialog

  useEffect(() => {
    const fetchEvents = async () => {
      if (auth.currentUser) {
        const eventsRef = collection(
          db,
          "users",
          auth.currentUser.uid,
          "events"
        );
        const q = query(eventsRef, where("isBackgroundEvent", "==", true));
        const querySnapshot = await getDocs(q);
        let expandedEvents: EventInput[] = [];

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
            console.log("Recurrence data found:", data.recurrence);
            console.log(
              `days of the week (original): ${data.recurrence.daysOfWeek}`
            );
            console.log(`startRecur - ${data.recurrence.startRecur}`);
            console.log(`endRecur - ${data.recurrence.endRecur}`);

            // Adjust daysOfWeek by subtracting 1
            const adjustedDaysOfWeek = data.recurrence.daysOfWeek.map(
              (day: number) => (day === 0 ? 6 : day - 1)
            );
            console.log(`days of the week (adjusted): ${adjustedDaysOfWeek}`);

            const dtstart = new Date(start);
            console.log("dtstart (UTC):", dtstart);

            const rule = new RRule({
              freq: RRule.WEEKLY,
              byweekday: adjustedDaysOfWeek,
              dtstart: dtstart,
              tzid: "UTC",
              until: new Date(data.recurrence.endRecur),
            });

            const firstOccurrence = rule.all()[0];
            console.log("First Occurrence Date:", new Date(firstOccurrence));

            rule.all().forEach((date) => {
              const occurrenceStart = new Date(date);
              const occurrenceEnd = new Date(
                occurrenceStart.getTime() + (end.getTime() - start.getTime())
              );

              console.log("Occurrence Start:", occurrenceStart);
              console.log("Occurrence End:", occurrenceEnd);
              console.log("Occurrence Day of Week:", occurrenceStart.getDay());

              if (!data.exceptions?.includes(occurrenceStart.toISOString())) {
                expandedEvents.push({
                  id: doc.id,
                  title: data.title,
                  start: occurrenceStart,
                  end: occurrenceEnd,
                  description: data.description || "",
                  display: data.display,
                  className: data.className,
                  isBackgroundEvent: data.isBackgroundEvent,
                  startDate: occurrenceStart,
                  startDay: occurrenceStart.toLocaleDateString("en-US", {
                    weekday: "long",
                  }),
                  endDate: occurrenceEnd,
                  endDay: occurrenceEnd.toLocaleDateString("en-US", {
                    weekday: "long",
                  }),
                  recurrence: data.recurrence,
                  exceptions: data.exceptions,
                });
              }
            });
          } else {
            expandedEvents.push({
              id: doc.id,
              title: data.title,
              start: start,
              end: end,
              description: data.description || "",
              display: data.display,
              className: data.className,
              isBackgroundEvent: data.isBackgroundEvent,
              startDate: start,
              startDay: start.toLocaleDateString("en-US", {
                weekday: "long",
                timeZone: "UTC",
              }),
              endDate: end,
              endDay: end.toLocaleDateString("en-US", {
                weekday: "long",
                timeZone: "UTC",
              }),
            });
          }
        });

        setEvents(expandedEvents);
      }
    };

    fetchEvents();
  }, []);

  const handleSort = (key: SortableKeys) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setEvents((prevEvents) =>
      [...prevEvents].sort((a, b) => {
        if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
        if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
        return 0;
      })
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      (event.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

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

  const deleteOccurrence = async (eventId: string, occurrenceDate: Date) => {
    const eventRef = doc(
      db,
      "users",
      auth.currentUser?.uid ?? "",
      "events",
      eventId
    );

    // Convert the occurrence date to an ISO string (adjust for UTC if necessary)
    const occurrenceISO = occurrenceDate.toISOString();

    // Add the date to the exceptions array in Firestore
    await updateDoc(eventRef, {
      exceptions: arrayUnion(occurrenceISO),
    });

    // Update local state (or re-fetch events) to reflect changes
    setEvents((prevEvents) =>
      prevEvents.filter(
        (event) =>
          !(
            event.id === eventId &&
            event.start.getTime() === occurrenceDate.getTime()
          )
      )
    );
  };

  const handleDeleteClick = (eventId: string, occurrenceStart: Date) => {
    if (window.confirm("Are you sure you want to delete this occurrence?")) {
      deleteOccurrence(eventId, occurrenceStart);
    }
  };

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allSelected = e.target.checked;
    if (allSelected) {
      const newSelectedRows = new Set<string>();
      filteredEvents.forEach((event) => {
        if (event.id) newSelectedRows.add(event.id);
      });
      setSelectedRows(newSelectedRows);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleCheckboxChange = (id: string | undefined) => {
    if (id) {
      toggleRowSelection(id);
    }
  };

  const handleCellClick = (id: string, field: string, value: string) => {
    setEditingCell({ id, field });

    if (field === "end") {
      const currentEvent = events.find((event) => event.id === id);
      if (currentEvent && currentEvent.end) {
        const formattedTime = currentEvent.end.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        setEditedValue(formattedTime);
      }
    } else {
      setEditedValue(value);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedValue(e.target.value);
  };

  // Adding temporary handleBlur function to with -5 hours to the time
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

      if (field === "startDate") {
        const newDate = new Date(editedValue);

        // Convert the date to UTC explicitly
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

        const currentEvent = events.find((event) => event.id === id);
        if (currentEvent) {
          const updatedStart = new Date(currentEvent.start);
          updatedStart.setUTCFullYear(
            utcDate.getUTCFullYear(),
            utcDate.getUTCMonth(),
            utcDate.getUTCDate()
          );

          const updatedStartDay = updatedStart.toLocaleDateString("en-US", {
            weekday: "long",
            timeZone: "UTC",
          });

          // Update startDate, startDay, and start
          updates = {
            startDate: updatedStart,
            startDay: updatedStartDay,
            start: updatedStart,
          };

          // Optionally, adjust endDate and endDay if needed
          const updatedEnd = new Date(currentEvent.end);
          const duration = updatedEnd.getTime() - currentEvent.start.getTime();
          updatedEnd.setTime(updatedStart.getTime() + duration);

          const updatedEndDay = updatedEnd.toLocaleDateString("en-US", {
            weekday: "long",
            timeZone: "UTC",
          });

          updates.endDate = updatedEnd;
          updates.endDay = updatedEndDay;
          updates.end = updatedEnd;
        }
      } else if (field === "endDate") {
        const newDate = new Date(editedValue);
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

        const currentEvent = events.find((event) => event.id === id);
        if (currentEvent) {
          const updatedEnd = new Date(currentEvent.end);
          updatedEnd.setUTCFullYear(
            utcDate.getUTCFullYear(),
            utcDate.getUTCMonth(),
            utcDate.getUTCDate()
          );

          const updatedEndDay = updatedEnd.toLocaleDateString("en-US", {
            weekday: "long",
            timeZone: "UTC",
          });

          updates = {
            endDate: updatedEnd,
            endDay: updatedEndDay,
            end: updatedEnd,
          };
        }
      } else if (field === "start") {
        const [hours, minutes] = editedValue.split(":");

        if (hours !== undefined && minutes !== undefined) {
          const currentEvent = events.find((event) => event.id === id);
          if (currentEvent) {
            const updatedStart = new Date(currentEvent.start);

            // Update only the time portion of the Date object
            updatedStart.setHours(parseInt(hours, 10) - 5); // Subtract 5 hours
            updatedStart.setMinutes(parseInt(minutes, 10));
            updatedStart.setSeconds(0); // Reset seconds to 0

            updates = {
              start: updatedStart,
            };
          }
        } else {
          console.error("Invalid time format for start time.");
          return; // Don't proceed if the time format is invalid
        }
      } else if (field === "end") {
        const [hours, minutes] = editedValue.split(":");

        if (hours !== undefined && minutes !== undefined) {
          const currentEvent = events.find((event) => event.id === id);
          if (currentEvent) {
            const updatedEnd = new Date(currentEvent.end);

            // Update only the time portion of the Date object
            updatedEnd.setHours(parseInt(hours, 10) - 5); // Subtract 5 hours
            updatedEnd.setMinutes(parseInt(minutes, 10));
            updatedEnd.setSeconds(0); // Reset seconds to 0

            updates = {
              end: updatedEnd,
            };
          }
        } else {
          console.error("Invalid time format for end time.");
          return; // Don't proceed if the time format is invalid
        }
      } else {
        updates[field] = editedValue;
      }

      await updateDoc(docRef, updates);

      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === id ? { ...event, ...updates } : event
        )
      );

      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  //Save event data form from the dialog to firestore

  const handleSave = async ({
    title,
    description,
    location,
    isBackgroundEvent,
    startTime,
    endTime,
  }: {
    title: string;
    description: string;
    location: string;
    isBackgroundEvent: boolean;
    startTime: string;
    endTime: string;
  }) => {
    // Assuming the user should select a date. Replace this with the actual date selection logic.
    const date = new Date(); // Replace this with the actual date chosen by the user

    // Convert startTime and endTime to Date objects in UTC
    let startDateTime = new Date(date);
    let endDateTime = new Date(date);

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
    const event: EventInput = {
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
    };

    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = await createEvent(user.uid, event);
        console.log("Event created with ID: ", docRef.id);

        setEvents((prevEvents) => [...prevEvents, { ...event, id: docRef.id }]);
      }
    } catch (error) {
      console.error("Error creating event in Firestore:", error);
    }
  };

  const getUserTimeZoneOffset = () => {
    const offsetMinutes = new Date().getTimezoneOffset();
    return offsetMinutes / 60; // Convert minutes to hours and invert sign
  };

  const addHoursToDate = (date: Date, hours: number) => {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  };

  return (
    <div className="w-full relative">
      <h1 className="text-xl font-bold mb-4">My Available Times</h1>
      <Button onClick={deleteSelectedEvents} disabled={selectedRows.size === 0}>
        Delete Selected
      </Button>
      <Input
        value={search}
        onChange={handleSearchChange}
        placeholder="Search by title or description"
        className="mb-4"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={selectedRows.size === filteredEvents.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    const newSelectedRows = new Set<string>();
                    filteredEvents.forEach((event) => {
                      if (event.id) newSelectedRows.add(event.id);
                    });
                    setSelectedRows(newSelectedRows);
                  } else {
                    setSelectedRows(new Set());
                  }
                }}
              />
            </TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Day</TableHead>
            <TableHead>
              <div className="flex items-center">
                Start Time
                <button onClick={() => handleSort("start")}>
                  <CaretSortIcon />
                </button>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center">
                End Time
                <button onClick={() => handleSort("end")}>
                  <CaretSortIcon />
                </button>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center">
                Title
                <button onClick={() => handleSort("title")}>
                  <CaretSortIcon />
                </button>
              </div>
            </TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEvents.map((event) => (
            <TableRow key={event.id || ""}>
              <TableCell>
                <Checkbox
                  checked={selectedRows.has(event.id || "")}
                  onCheckedChange={() => handleCheckboxChange(event.id)}
                />
              </TableCell>
              <TableCell>
                {editingCell?.id === event.id &&
                editingCell?.field === "startDate" ? (
                  <input
                    type="date"
                    value={new Date(editedValue).toISOString().split("T")[0]}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() =>
                      handleCellClick(
                        event.id ?? "",
                        "startDate",
                        event.startDate instanceof Date &&
                          !isNaN(event.startDate.getTime())
                          ? event.startDate.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            })
                          : "Invalid Date"
                      )
                    }
                  >
                    {event.startDate instanceof Date &&
                    !isNaN(event.startDate.getTime())
                      ? event.startDate.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })
                      : "Invalid Date"}
                  </div>
                )}
              </TableCell>
              {/* Day  */}
              <TableCell>
                {editingCell?.id === event.id &&
                editingCell?.field === "startDay" ? (
                  <input
                    value={editedValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() =>
                      handleCellClick(
                        event.id ?? "",
                        "startDay",
                        event.startDay
                      )
                    }
                  >
                    {event.startDay}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {editingCell?.id === event.id &&
                editingCell?.field === "start" ? (
                  <input
                    type="time"
                    value={editedValue}
                    step="900" // 900 seconds = 15 minutes
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => {
                      if (
                        event.start instanceof Date &&
                        !isNaN(event.start.getTime())
                      ) {
                        const timezoneOffset = getUserTimeZoneOffset(); // Get current timezone offset
                        const localStart = addHoursToDate(
                          event.start,
                          timezoneOffset
                        ); // Adjust time to user's local time
                        handleCellClick(
                          event.id ?? "",
                          "start",
                          localStart.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        );
                      } else {
                        console.error("Invalid Date for start:", event.start);
                      }
                    }}
                  >
                    {event.start instanceof Date &&
                    !isNaN(event.start.getTime())
                      ? addHoursToDate(
                          event.start,
                          getUserTimeZoneOffset()
                        ).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "Invalid Date"}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {editingCell?.id === event.id &&
                editingCell?.field === "end" ? (
                  <input
                    type="time"
                    value={editedValue}
                    step="900" // 900 seconds = 15 minutes
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => {
                      if (
                        event.end instanceof Date &&
                        !isNaN(event.end.getTime())
                      ) {
                        const timezoneOffset = getUserTimeZoneOffset(); // Get current timezone offset
                        const localEnd = addHoursToDate(
                          event.end,
                          timezoneOffset
                        ); // Adjust time to user's local time
                        handleCellClick(
                          event.id ?? "",
                          "end",
                          localEnd.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        );
                      } else {
                        console.error("Invalid Date for end:", event.end);
                      }
                    }}
                  >
                    {event.end instanceof Date && !isNaN(event.end.getTime())
                      ? addHoursToDate(
                          event.end,
                          getUserTimeZoneOffset()
                        ).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "Invalid Date"}
                  </div>
                )}
              </TableCell>
              {/* <TableCell>
                {editingCell?.id === event.id &&
                editingCell?.field === "title" ? (
                  <input
                    value={editedValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() =>
                      handleCellClick(
                        event.id ?? "",
                        "title",
                        event.title ?? ""
                      )
                    }
                  >
                    {event.title || (
                      <span className="text-gray-500">Enter title</span>
                    )}
                  </div>
                )}
              </TableCell> */}
              {/* // Title */}
              <TableCell>
                {editingCell?.id === event.id &&
                editingCell?.field === "title" ? (
                  <input
                    value={editedValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() =>
                      handleCellClick(
                        event.id ?? "",
                        "title",
                        event.title ?? ""
                      )
                    }
                  >
                    {event.title || (
                      <span className="text-gray-500">Enter title</span>
                    )}
                  </div>
                )}
              </TableCell>
              {/* // Description */}
              <TableCell>
                {editingCell?.id === event.id &&
                editingCell?.field === "description" ? (
                  <input
                    value={editedValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() =>
                      handleCellClick(
                        event.id ?? "",
                        "description",
                        event.description ?? ""
                      )
                    }
                  >
                    {event.description || (
                      <span className="text-gray-500">Enter description</span>
                    )}
                  </div>
                )}
              </TableCell>
              {/* <TableCell>{event.id}</TableCell> ID column moved here */}
              <TableCell>
                {event.recurrence ? (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteClick(event.id!, event.start)}
                  >
                    Delete Occurrence
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Floating Action Button */}
      <div className="fixed bottom-[calc(4rem+30px)] right-4">
        <button
          className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 focus:outline-none"
          onClick={() => setIsDialogOpen(true)}
        >
          <PlusCircledIcon className="h-6 w-6" />
        </button>
      </div>

      <EventFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
