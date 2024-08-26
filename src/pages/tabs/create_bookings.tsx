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
// import { useState, useEffect } from "react";

type SortableKeys = "start" | "end" | "title";

const CreateBookings: React.FC = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<{
    key: SortableKeys;
    direction: "asc" | "desc";
  }>({ key: "start", direction: "asc" });

  // Pagination states
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(5); // Adjust page size as needed

  useEffect(() => {
    const fetchEvents = async () => {
      if (auth.currentUser) {
        const eventsRef = collection(
          db,
          "users",
          auth.currentUser.uid,
          "events"
        );
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

    fetchEvents();
  }, []);

  const handleSort = (key: SortableKeys) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setEvents((prevEvents: any) =>
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

  const totalEvents = filteredEvents.length;
  const startItemIndex = pageIndex * pageSize + 1;
  const endItemIndex = Math.min(startItemIndex + pageSize - 1, totalEvents);

  return (
    <div className="w-full relative">
      <h1 className="text-xl font-bold mb-4">Create Bookings</h1>
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedEvents.map((event) => (
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
              <TableCell>
                {event.title || (
                  <span className="text-gray-500">Enter title</span>
                )}
              </TableCell>
              <TableCell>
                {event.description || (
                  <span className="text-gray-500">Enter description</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Row Selection and Pagination Controls */}
      <div className="flex justify-between mt-4">
        <span>{`${selectedRows.size} of ${filteredEvents.length} row(s) selected`}</span>

        {/* Pagination Controls */}
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
    </div>
  );
};

export default CreateBookings;
