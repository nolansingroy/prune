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

  // Fetch user timezone from Firestore
  const fetchUserTimezone = async () => {
    if (auth.currentUser) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      setUserTimezone(userData?.timezone || "UTC");
    }
  };

  // Fetch events from Firestore
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
          // Non-recurring event
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

  const displayTimeWithOffset = (date: Date) => {
    // Get the user's timezone offset in hours (this is in minutes, so divide by 60)
    const userTimezoneOffsetInHours = new Date().getTimezoneOffset() / 60;

    // Convert the UTC time stored in the database to the local time
    const adjustedDate = new Date(
      date.getTime() + userTimezoneOffsetInHours * 60 * 60 * 1000
    );

    // Log for debugging purposes
    console.log(`Original Time (UTC): ${date}`);
    console.log(`Timezone Offset (hours): ${userTimezoneOffsetInHours}`);
    console.log(`Adjusted Time: ${adjustedDate}`);

    // Return the adjusted time in user's local time format
    return adjustedDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Sorting functionality
  const handleSort = (key: SortableKeys) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    setEvents((prevEvents) =>
      [...prevEvents].sort((a, b) => {
        let aValue: string, bValue: string;

        if (key === "startDate" || key === "start" || key === "end") {
          aValue = new Date(a[key]).getTime().toString();
          bValue = new Date(b[key]).getTime().toString();
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

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Filtered events based on search
  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      (event.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Handle row selection
  const toggleRowSelection = (id: string) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(id)) {
      newSelectedRows.delete(id);
    } else {
      newSelectedRows.add(id);
    }
    setSelectedRows(newSelectedRows);
  };

  // Handle select all rows
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

  // Delete selected events
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

  // Handle saving events
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
      startRecur: string;
      endRecur: string;
    };
  }) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const startDate =
        eventData.date || new Date().toISOString().split("T")[0];
      const eventInput = {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location || "",
        startDate,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        recurrence: eventData.recurrence,
        userId: user.uid,
      };

      const result = await axios.post(
        "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/createRecurringAvailabilityInstances",
        eventInput
      );

      console.log("Recurring event instances created:", result.data);
      await fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

  const handleEditClick = (event: EventInput) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = async (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this occurrence?")) {
      const eventRef = doc(
        db,
        "users",
        auth.currentUser?.uid ?? "",
        "events",
        eventId
      );
      await updateDoc(eventRef, {
        exceptions: arrayUnion(new Date().toISOString()),
      });
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    }
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
                <TableCell>{displayTimeWithOffset(event.start)}</TableCell>
                <TableCell>{displayTimeWithOffset(event.end)}</TableCell>
                <TableCell>{event.title}</TableCell>
                <TableCell>{event.description}</TableCell>
                <TableCell>
                  {event.recurrence ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost">
                          <DotsHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => handleEditClick(event)}
                        >
                          Edit Occurrence
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(event.id!)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteClick(event.id!)}
                    >
                      Delete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
