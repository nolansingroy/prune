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
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { EventInput } from "../../interfaces/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CaretSortIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import CreateBookingsFormDialog from "../CreateBookingsFormDialog"; // Import the correct component

type SortableKeys = "start" | "end" | "title";

const CreateBookings: React.FC = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: SortableKeys;
    direction: "asc" | "desc";
  }>({ key: "start", direction: "asc" });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventInput | null>(null);

  // Pagination states
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5); // Adjust page size as needed

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    if (auth.currentUser) {
      const eventsRef = collection(db, "users", auth.currentUser.uid, "events");
      const q = query(eventsRef, where("isBackgroundEvent", "==", false));
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
      });

      setEvents(expandedEvents);
    }
  };

  const deleteSelectedEvents = async () => {
    if (selectedRows.size === 0) return;

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
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id && !selectedRows.has(event.id))
      );
      setSelectedRows(new Set());
    }
  };

  const deleteEvent = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const docRef = doc(
          db,
          "users",
          auth.currentUser?.uid ?? "",
          "events",
          id
        );
        await deleteDoc(docRef);
        setEvents((prevEvents) =>
          prevEvents.filter((event) => event.id !== id)
        );
        console.log(`Event with ID ${id} deleted`);
      } catch (error) {
        console.error("Error deleting event: ", error);
      }
    }
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
      startTime: string;
      endTime: string;
      startRecur: string;
      endRecur: string;
    };
  }) => {
    const selectedDate = eventData.date ? new Date(eventData.date) : new Date();

    let startDateTime = new Date(
      selectedDate.toISOString().split("T")[0] + "T" + eventData.startTime
    );
    let endDateTime = new Date(
      selectedDate.toISOString().split("T")[0] + "T" + eventData.endTime
    );

    // Manually subtract the user's timezone offset (in hours)
    const timezoneOffset = getUserTimeZoneOffset();
    startDateTime.setHours(startDateTime.getHours() - timezoneOffset);
    endDateTime.setHours(endDateTime.getHours() - timezoneOffset);

    // Prepare the event object
    const event: EventInput = {
      id: "",
      title: eventData.title,
      location: eventData.location || "",
      start: startDateTime,
      end: endDateTime,
      description: eventData.description,
      display: eventData.isBackgroundEvent ? "background" : "auto",
      className: eventData.isBackgroundEvent ? "custom-bg-event" : "",
      isBackgroundEvent: eventData.isBackgroundEvent,
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

    // Only include the recurrence field if it exists
    if (eventData.recurrence) {
      event.recurrence = eventData.recurrence;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        const eventRef = await addDoc(
          collection(db, "users", user.uid, "events"),
          event
        );

        const eventId = eventRef.id;
        event.id = eventId;

        await updateDoc(eventRef, { id: eventId });

        console.log("Event created in Firestore with ID:", event.id);

        setEvents((prevEvents) => [...prevEvents, event]);
      }
    } catch (error) {
      console.error("Error creating event in Firestore:", error);
    }

    setIsDialogOpen(false);
  };

  // Helper to get user timezone offset
  const getUserTimeZoneOffset = () => {
    const offsetMinutes = new Date().getTimezoneOffset();
    return offsetMinutes / 60;
  };

  // Sorting function
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

  // Row selection function
  const toggleRowSelection = (id: string) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(id)) {
      newSelectedRows.delete(id);
    } else {
      newSelectedRows.add(id);
    }
    setSelectedRows(newSelectedRows);
  };

  // Filtering events based on search input
  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      (event.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full relative">
      <h1 className="text-xl font-bold mb-4">Bookings</h1>
      <Button onClick={deleteSelectedEvents} disabled={selectedRows.size === 0}>
        Delete Selected
      </Button>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
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
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEvents.map((event) => (
            <TableRow key={event.id || ""}>
              <TableCell>
                <Checkbox
                  checked={selectedRows.has(event.id || "")}
                  onCheckedChange={() => {
                    if (event.id) {
                      toggleRowSelection(event.id);
                    }
                  }}
                />
              </TableCell>
              <TableCell>
                {event.startDate instanceof Date &&
                !isNaN(event.startDate.getTime())
                  ? event.startDate.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })
                  : "Invalid Date"}
              </TableCell>
              <TableCell>{event.startDay}</TableCell>
              <TableCell>
                {event.start instanceof Date && !isNaN(event.start.getTime())
                  ? event.start.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "Invalid Date"}
              </TableCell>
              <TableCell>
                {event.end instanceof Date && !isNaN(event.end.getTime())
                  ? event.end.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "Invalid Date"}
              </TableCell>
              <TableCell>{event.title}</TableCell>
              <TableCell>{event.description || "No description"}</TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  onClick={() => deleteEvent(event.id || "")}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Row Selection and Pagination Controls */}
      <div className="flex justify-between mt-4">
        <span>{`${selectedRows.size} of ${filteredEvents.length} row(s) selected`}</span>
        <div className="flex items-center">
          <Button
            onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
            disabled={pageIndex === 0}
          >
            Previous
          </Button>
          <span className="mx-2">
            Showing {pageIndex * pageSize + 1} to{" "}
            {Math.min((pageIndex + 1) * pageSize, filteredEvents.length)} of{" "}
            {filteredEvents.length}
          </span>
          <Button
            onClick={() => setPageIndex((prev) => prev + 1)}
            disabled={(pageIndex + 1) * pageSize >= filteredEvents.length}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Blue Circle Button */}
      <div className="fixed bottom-[calc(4rem+30px)] right-4">
        <button
          className="p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 focus:outline-none"
          onClick={() => setIsDialogOpen(true)}
        >
          <PlusCircledIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Event Form Dialog */}
      <CreateBookingsFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveEvent}
        showDateSelector={true}
        event={editingEvent}
      />
    </div>
  );
};

export default CreateBookings;
