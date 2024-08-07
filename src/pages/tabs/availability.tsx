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
} from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { EventInput } from "../../interfaces/types";
import { Timestamp } from "firebase/firestore";

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

          const start =
            data.start instanceof Timestamp
              ? data.start.toDate()
              : new Date(data.start);
          const end =
            data.end instanceof Timestamp
              ? data.end.toDate()
              : new Date(data.end);

          return {
            id: doc.id,
            title: data.title,
            start: start,
            end: end,
            description: data.description || "",
            display: data.display,
            className: data.className,
            isBackgroundEvent: data.isBackgroundEvent,
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
      await updateDoc(docRef, { [field]: editedValue });
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === id ? { ...event, [field]: editedValue } : event
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
            <TableHead>ID</TableHead>
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
              <TableCell>{event.id}</TableCell>
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
                        event.start?.toLocaleString() ?? ""
                      )
                    }
                  >
                    {event.start?.toLocaleString() ?? ""}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {editingCell?.id === event.id &&
                editingCell?.field === "end" ? (
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
                        event.end?.toLocaleString() ?? ""
                      )
                    }
                  >
                    {event.end?.toLocaleString() ?? ""}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
