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

type SortableKeys = "start" | "end" | "title" | "startDate";

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
  }>({ key: "startDate", direction: "asc" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventInput | null>(null);
  const [userTimezone, setUserTimezone] = useState<string>("UTC");

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

  const fetchEvents = async () => {
    if (auth.currentUser) {
      const eventsRef = collection(db, "users", auth.currentUser.uid, "events");
      const q = query(eventsRef, where("isBackgroundEvent", "==", true));
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
            recurrence: data.recurrence,
            exceptions: data.exceptions,
          });
        } else {
          eventsList.push({
            id: doc.id,
            title: data.title,
            start: start,
            end: end,
            description: data.description || "",
            isBackgroundEvent: data.isBackgroundEvent,
            startDate: start,
            startDay: start.toLocaleDateString("en-US", { weekday: "long" }),
            endDate: end,
            endDay: end.toLocaleDateString("en-US", { weekday: "long" }),
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
    if (!isRecurring) {
      setEditingCell({ id, field });
      setEditedValue(value);
    }
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

      const getUserTimeZoneOffset = () => {
        // Returns the time zone offset in hours (e.g., -7 for PDT)
        return new Date().getTimezoneOffset() / 60;
      };

      if (field === "start" || field === "end") {
        const [hours, minutes] = editedValue.split(":");
        if (hours !== undefined && minutes !== undefined) {
          const currentEvent = events.find((event) => event.id === id);
          if (currentEvent) {
            const updatedTime = new Date(
              currentEvent[field === "start" ? "start" : "end"]
            );
            updatedTime.setHours(parseInt(hours, 10) - getUserTimeZoneOffset()); // Subtract time zone offset
            updatedTime.setMinutes(parseInt(minutes, 10));
            updatedTime.setSeconds(0);

            // Calculate related fields
            const updatedDay = updatedTime.toLocaleDateString("en-US", {
              weekday: "long",
              timeZone: "UTC",
            });
            const updatedDate = updatedTime;

            if (field === "start") {
              updates = {
                start: updatedTime,
                startDate: updatedDate,
                startDay: updatedDay,
              };
            } else if (field === "end") {
              updates = {
                end: updatedTime,
                endDate: updatedDate,
                endDay: updatedDay,
              };
            }
          }
        } else {
          console.error("Invalid time format for start or end time.");
          return;
        }
      } else if (field === "startDate" || field === "endDate") {
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
          } else if (field === "endDate") {
            updates = {
              endDate: updatedTime,
              endDay: updatedDay,
              end: updatedTime,
            };
          }
        }
      } else if (field === "title" || field === "description") {
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
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const startDate =
        eventData.date || new Date().toISOString().split("T")[0];

      // Add 1 day to the endRecur date to ensure the last day is included
      const endRecur = new Date(eventData.recurrence?.endRecur || startDate);
      endRecur.setDate(endRecur.getDate() + 1);

      const eventInput = {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location || "",
        startDate,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        recurrence: {
          daysOfWeek: eventData.recurrence?.daysOfWeek || [],
          startRecur: eventData.recurrence?.startRecur || startDate,
          endRecur: endRecur.toISOString().split("T")[0], // Adjusted endRecur
        },
        userId: user.uid,
      };

      const result = await axios.post(
        "https://us-central1-prune-94ad9.cloudfunctions.net/createRecurringAvailabilityInstances",
        eventInput
      );

      console.log("Recurring event instances created:", result.data);
      await fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
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
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      (event.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full relative">
      <h1 className="text-xl font-bold mb-4">My Available Times</h1>
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
                  onCheckedChange={(checked) =>
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
                      {/* <DropdownMenuItem onClick={() => handleEditClick(event)}>
                        Edit Occurrence
                      </DropdownMenuItem> */}
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
        <Button
          onClick={deleteSelectedEvents}
          disabled={selectedRows.size === 0}
        >
          Delete Selected
        </Button>
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
