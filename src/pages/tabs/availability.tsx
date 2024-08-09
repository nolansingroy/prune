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
} from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { EventInput } from "../../interfaces/types";
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
import { createEvent, updateEvent } from "../../services/userService";
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
        const fetchedEvents = querySnapshot.docs.map((doc) => {
          const data = doc.data();

          // Convert Firestore Timestamps to JavaScript Date objects
          const start =
            data.start instanceof Timestamp
              ? data.start.toDate()
              : new Date(data.start);
          const end =
            data.end instanceof Timestamp
              ? data.end.toDate()
              : new Date(data.end);
          const startDate =
            data.startDate instanceof Timestamp
              ? data.startDate.toDate()
              : new Date(data.startDate);
          const endDate =
            data.endDate instanceof Timestamp
              ? data.endDate.toDate()
              : new Date(data.endDate);

          // Derive startDay and endDay from startDate and endDate
          const startDay = startDate.toLocaleDateString("en-US", {
            weekday: "long",
            timeZone: "UTC",
          });
          const endDay = endDate.toLocaleDateString("en-US", {
            weekday: "long",
            timeZone: "UTC",
          });

          return {
            id: doc.id,
            title: data.title,
            start: start,
            end: end,
            description: data.description || "",
            display: data.display,
            className: data.className,
            isBackgroundEvent: data.isBackgroundEvent,
            startDate: startDate, // Use the UTC Date object
            startDay: startDay, // Day of the week derived from startDate
            endDate: endDate, // Use the UTC Date object
            endDay: endDay, // Day of the week derived from endDate
          };
        });
        setEvents(fetchedEvents);
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

      if (field === "startDate") {
        const newDate = new Date(editedValue);

        // Get the current event's start time
        const currentEvent = events.find((event) => event.id === id);
        if (currentEvent) {
          // Set the start date to the date selected in the date picker,
          // but keep the original start time (hours, minutes, etc.)
          const updatedStart = new Date(currentEvent.start);
          updatedStart.setUTCFullYear(
            newDate.getUTCFullYear(),
            newDate.getUTCMonth(),
            newDate.getUTCDate()
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
          // Adjust the end date based on the new start date (e.g., for the same duration)
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
        // Handle endDate similarly if necessary
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
            <TableHead>ID</TableHead> {/* Moved ID to the last column */}
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
                        "start",
                        event.start?.toLocaleString("en-US", {
                          timeZone: "UTC",
                        }) ?? ""
                      )
                    }
                  >
                    {event.start?.toLocaleString("en-US", {
                      timeZone: "UTC",
                    }) ?? ""}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {editingCell?.id === event.id &&
                editingCell?.field === "endDate" ? (
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
                        "end",
                        event.end?.toLocaleString("en-US", {
                          timeZone: "UTC",
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        }) ?? ""
                      )
                    }
                  >
                    {event.end?.toLocaleString("en-US", {
                      timeZone: "UTC",
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }) ?? ""}
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
              <TableCell>{event.id}</TableCell> {/* ID column moved here */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
