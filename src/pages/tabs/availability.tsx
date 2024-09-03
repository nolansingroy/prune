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
  getDoc,
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
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogOverlay,
} from "@radix-ui/react-dialog";
import { createEvent } from "../../services/userService";
import EventFormDialog from "../EventFormModal";
import moment from "moment-timezone";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventInput | null>(null);
  const [editAll, setEditAll] = useState(false); // New state for editing all instances
  const [userTimezone, setUserTimezone] = useState<string>("UTC");

  // Pagination states
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    const fetchUserTimezone = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        console.log(
          `Component is fetching the user doc.timezone - ${
            userData?.timezone ?? ""
          }`
        );
        setUserTimezone(userData?.timezone || "UTC");
      }
    };

    fetchUserTimezone();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      if (auth.currentUser) {
        const eventsRef = collection(
          db,
          "users",
          auth.currentUser.uid,
          "events"
        );

        // Query for all background events, whether they are recurring or not
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
            const adjustedDaysOfWeek = data.recurrence.daysOfWeek.map(
              (day: number) => (day === 0 ? 6 : day - 1)
            );

            const dtstart = new Date(start);

            const rule = new RRule({
              freq: RRule.WEEKLY,
              byweekday: adjustedDaysOfWeek,
              dtstart: dtstart,
              tzid: "UTC",
              until: new Date(data.recurrence.endRecur),
            });

            rule.all().forEach((date) => {
              const occurrenceStart = new Date(date);
              const duration = end.getTime() - start.getTime();
              const occurrenceEnd = new Date(
                occurrenceStart.getTime() + duration
              );

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
            // Also include non-recurring background events
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

  // Pagination logic
  const paginatedEvents = filteredEvents.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  const handlePreviousPage = () => {
    setPageIndex((old) => Math.max(old - 1, 0));
  };

  const handleNextPage = () => {
    setPageIndex((old) =>
      Math.min(old + 1, Math.ceil(filteredEvents.length / pageSize) - 1)
    );
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

  const deleteOccurrence = async (eventId: string, occurrenceDate: Date) => {
    const eventRef = doc(
      db,
      "users",
      auth.currentUser?.uid ?? "",
      "events",
      eventId
    );

    const occurrenceISO = occurrenceDate.toISOString();

    await updateDoc(eventRef, {
      exceptions: arrayUnion(occurrenceISO),
    });

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

  const handleCellClick = (
    id: string,
    field: string,
    value: string,
    isRecurring: boolean
  ) => {
    if (!isRecurring) {
      setEditingCell({ id, field });
      setEditedValue(value);
    }
  };

  const displayTimeInUserTimezone = (date: Date, timezone: string) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone, // Use the fetched user timezone
    });
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

      if (field === "start") {
        const [hours, minutes] = editedValue.split(":");

        if (hours !== undefined && minutes !== undefined) {
          const currentEvent = events.find((event) => event.id === id);
          if (currentEvent) {
            const updatedStart = new Date(currentEvent.start);

            // Apply the changes to the start time
            updatedStart.setHours(
              parseInt(hours, 10) - getUserTimeZoneOffset()
            );
            updatedStart.setMinutes(parseInt(minutes, 10));
            updatedStart.setSeconds(0);

            // Calculate related fields (startDate and startDay)
            const updatedStartDay = updatedStart.toLocaleDateString("en-US", {
              weekday: "long",
              timeZone: "UTC",
            });

            const updatedStartDate = updatedStart;

            updates = {
              start: updatedStart,
              startDate: updatedStartDate,
              startDay: updatedStartDay,
            };
          }
        } else {
          console.error("Invalid time format for start time.");
          return;
        }
      } else if (field === "end") {
        const [hours, minutes] = editedValue.split(":");

        if (hours !== undefined && minutes !== undefined) {
          const currentEvent = events.find((event) => event.id === id);
          if (currentEvent) {
            const updatedEnd = new Date(currentEvent.end);

            updatedEnd.setHours(parseInt(hours, 10) - getUserTimeZoneOffset());
            updatedEnd.setMinutes(parseInt(minutes, 10));
            updatedEnd.setSeconds(0);

            const updatedEndDay = updatedEnd.toLocaleDateString("en-US", {
              weekday: "long",
              timeZone: "UTC",
            });

            const updatedEndDate = updatedEnd;

            updates = {
              end: updatedEnd,
              endDate: updatedEndDate,
              endDay: updatedEndDay,
            };
          }
        } else {
          console.error("Invalid time format for end time.");
          return;
        }
      } else if (field === "startDate") {
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

          updates = {
            startDate: updatedStart,
            startDay: updatedStartDay,
            start: updatedStart,
          };
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

  const handleSaveEvent = async ({
    title,
    description,
    location,
    isBackgroundEvent,
    date,
    startTime,
    endTime,
    recurrence,
  }: {
    title: string;
    description: string;
    location: string;
    isBackgroundEvent: boolean;
    date?: string;
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
    try {
      console.log("handleSaveEvent triggered");
      console.log("Data passed in:", {
        title,
        description,
        location,
        isBackgroundEvent,
        date,
        startTime,
        endTime,
        recurrence,
        editingEvent,
      });

      const selectedDate = date ? new Date(date) : new Date();

      // Set start time based on the user's timezone
      const [startHours, startMinutes] = startTime.split(":");
      const startDateTime = new Date(selectedDate);
      startDateTime.setDate(startDateTime.getDate() + 1); // Add one day to correct the date shift
      startDateTime.setHours(
        parseInt(startHours, 10) - getUserTimeZoneOffset()
      );
      startDateTime.setMinutes(parseInt(startMinutes, 10));
      startDateTime.setSeconds(0);

      // Set end time based on the user's timezone
      const [endHours, endMinutes] = endTime.split(":");
      const endDateTime = new Date(selectedDate);
      endDateTime.setDate(endDateTime.getDate() + 1); // Add one day to correct the date shift
      endDateTime.setHours(parseInt(endHours, 10) - getUserTimeZoneOffset());
      endDateTime.setMinutes(parseInt(endMinutes, 10));
      endDateTime.setSeconds(0);

      console.log("Adjusted Start DateTime:", startDateTime);
      console.log("Adjusted End DateTime:", endDateTime);

      // Handle the case where end time is before start time
      if (endDateTime <= startDateTime) {
        endDateTime.setUTCDate(endDateTime.getUTCDate() + 1);
        console.log("Adjusted End DateTime to next day:", endDateTime);
      }

      // Prepare the event object
      const event: EventInput = {
        title,
        location: location || "",
        start: startDateTime,
        end: endDateTime,
        description,
        display: isBackgroundEvent ? "background" : "auto",
        className: isBackgroundEvent ? "custom-bg-event" : "",
        isBackgroundEvent,
        startDate: startDateTime,
        startDay: startDateTime.toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "UTC",
        }),
        endDate: endDateTime,
        endDay: endDateTime.toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "UTC",
        }),
      };

      if (recurrence) {
        // Remove automatic date prefill; let the user manually fill the startRecur date
        const dtstart = new Date(
          `${recurrence.startRecur}T${recurrence.startTime}:00`
        );

        console.log("RRule dtstart:", dtstart);

        if (isNaN(dtstart.getTime())) {
          throw new Error("Invalid dtstart date");
        }

        event.recurrence = {
          ...recurrence,
          rrule: new RRule({
            freq: RRule.WEEKLY,
            byweekday: recurrence.daysOfWeek.map((day) => {
              switch (day) {
                case 0:
                  return RRule.SU;
                case 1:
                  return RRule.MO;
                case 2:
                  return RRule.TU;
                case 3:
                  return RRule.WE;
                case 4:
                  return RRule.TH;
                case 5:
                  return RRule.FR;
                case 6:
                  return RRule.SA;
                default:
                  throw new Error("Invalid day of week");
              }
            }),
            dtstart,
            until: new Date(`${recurrence.endRecur}T${recurrence.endTime}:00`),
          }).toString(),
        };
      }

      console.log("Prepared Event Object:", event);

      const user = auth.currentUser;
      if (user) {
        if (editingEvent) {
          // If editing an existing event, delete the original occurrence if necessary
          if (!editAll) {
            await deleteOccurrence(editingEvent.id!, editingEvent.start);
            console.log(
              `Deleted original occurrence of event with ID: ${editingEvent.id}`
            );
          }
        }

        // Save the event (create new or replace the old one)
        const docRef = await createEvent(user.uid, event);
        console.log(`Event saved with ID: ${docRef.id}`);

        setEvents((prevEvents) => {
          const updatedEvents = editingEvent
            ? prevEvents.map((evt) =>
                evt.id === editingEvent.id ? { ...event, id: docRef.id } : evt
              )
            : [...prevEvents, { ...event, id: docRef.id }];

          console.log("Updated Events State:", updatedEvents);
          return updatedEvents;
        });

        setEditingEvent(null);
        setIsDialogOpen(false);
      } else {
        console.error("User not authenticated");
      }
    } catch (error) {
      console.error(
        "Error saving event in Firestore:",
        (error as Error).message
      );
      console.error("Error stack trace:", (error as Error).stack);
    }
  };

  const getUserTimeZoneOffset = () => {
    const offsetMinutes = new Date().getTimezoneOffset();
    return offsetMinutes / 60;
  };

  const addHoursToDate = (date: Date, hours: number) => {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  };

  const totalEvents = filteredEvents.length;
  const startItemIndex = pageIndex * pageSize + 1;
  const endItemIndex = Math.min(startItemIndex + pageSize - 1, totalEvents);

  const handleEditClick = (event: EventInput) => {
    console.log("handle edit click called");
    try {
      const newEvent = {
        ...event,
        recurrence: undefined, // Remove the recurrence to make it a single event
        exceptions: [], // Clear exceptions since it's a new event
      };

      setEditingEvent(newEvent);
      setEditAll(false); // Make sure editAll is false when editing only one occurrence
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error preparing the event for editing:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleEditAllClick = (event: EventInput) => {
    // Temporarily disable the Edit All functionality
    console.log("Edit All is currently disabled until further notice.");
    // setEditingEvent(event);
    // setEditAll(true); // Indicate that we are editing the entire series
    // setIsDialogOpen(true);
  };

  // const handleSaveEditedEvent = async ({
  //   title,
  //   description,
  //   location,
  //   isBackgroundEvent,
  //   date,
  //   startTime,
  //   endTime,
  // }: {
  //   title: string;
  //   description: string;
  //   location: string;
  //   isBackgroundEvent: boolean;
  //   date?: string;
  //   startTime: string;
  //   endTime: string;
  // }) => {
  //   try {
  //     if (editingEvent) {
  //       const formattedDate =
  //         date || editingEvent.startDate.toISOString().split("T")[0];
  //       const formattedStartTime =
  //         startTime || editingEvent.start.toTimeString().split(" ")[0];
  //       const formattedEndTime =
  //         endTime || editingEvent.end.toTimeString().split(" ")[0];

  //       // Convert start and end time to UTC
  //       let startDateTime = moment
  //         .tz(
  //           `${formattedDate} ${formattedStartTime}`,
  //           "YYYY-MM-DD HH:mm",
  //           userTimezone
  //         )
  //         .utc()
  //         .toDate();

  //       let endDateTime = moment
  //         .tz(
  //           `${formattedDate} ${formattedEndTime}`,
  //           "YYYY-MM-DD HH:mm",
  //           userTimezone
  //         )
  //         .utc()
  //         .toDate();

  //       // Handle the case where end time is before start time
  //       if (endDateTime <= startDateTime) {
  //         endDateTime.setUTCDate(endDateTime.getUTCDate() + 1);
  //       }

  //       // Delete the original occurrence now, before saving the new event
  //       if (editingEvent.id && !editAll) {
  //         await deleteOccurrence(editingEvent.id, editingEvent.start);
  //       }

  //       // Save the edited event as a new single background event
  //       await handleSave({
  //         title,
  //         description,
  //         location,
  //         isBackgroundEvent,
  //         date: formattedDate,
  //         startTime: formattedStartTime,
  //         endTime: formattedEndTime,
  //       });

  //       setEditingEvent(null);
  //       setIsDialogOpen(false);
  //     }
  //   } catch (error) {
  //     console.error("Error saving edited event:", error);
  //     alert(
  //       "An error occurred while saving the event. Please check the console for details."
  //     );
  //   }
  // };

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
                checked={selectedRows.size === paginatedEvents.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    const newSelectedRows = new Set<string>();
                    paginatedEvents.forEach((event) => {
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
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedEvents.map((event) => (
            <TableRow
              key={event.id || ""}
              className={event.recurrence ? "bg-gray-200 bg-opacity-50" : ""}
            >
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
                          : "Invalid Date",
                        !!event.recurrence
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
                        event.startDay,
                        !!event.recurrence
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
                    step="900"
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
                        const timezoneOffset = getUserTimeZoneOffset();
                        const localStart = addHoursToDate(
                          event.start,
                          timezoneOffset
                        );
                        handleCellClick(
                          event.id ?? "",
                          "start",
                          localStart.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }),
                          !!event.recurrence
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
                    step="900"
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
                        const timezoneOffset = getUserTimeZoneOffset();
                        const localEnd = addHoursToDate(
                          event.end,
                          timezoneOffset
                        );
                        handleCellClick(
                          event.id ?? "",
                          "end",
                          localEnd.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }),
                          !!event.recurrence
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
                        event.title ?? "",
                        !!event.recurrence
                      )
                    }
                  >
                    {event.title || (
                      <span className="text-gray-500">Enter title</span>
                    )}
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
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() =>
                      handleCellClick(
                        event.id ?? "",
                        "description",
                        event.description ?? "",
                        !!event.recurrence
                      )
                    }
                  >
                    {event.description || (
                      <span className="text-gray-500">Enter description</span>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {event.recurrence ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost">
                        <DotsHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEditClick(event)}>
                        Edit Occurrence
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEditAllClick(event)}
                      >
                        Edit All
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Button
                          variant="destructive"
                          onClick={() =>
                            handleDeleteClick(event.id!, event.start)
                          }
                        >
                          Delete Occurrence
                        </Button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteClick(event.id!, event.start)}
                  >
                    Delete
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between mt-4">
        <span>{`${selectedRows.size} of ${filteredEvents.length} row(s) selected`}</span>

        <div className="flex items-center  -ml-24">
          <span className="mx-2">
            Showing {startItemIndex}-{endItemIndex} of {totalEvents}
          </span>
          <Button onClick={handlePreviousPage} disabled={pageIndex === 0}>
            Previous
          </Button>

          <Button
            onClick={handleNextPage}
            disabled={
              pageIndex === Math.ceil(filteredEvents.length / pageSize) - 1
            }
          >
            Next
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

      <AvailabilityDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveEvent}
        event={editingEvent}
      />
    </div>
  );
}
