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

export default function Availability() {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
  } | null>(null);
  const [editedValue, setEditedValue] = useState<string>("");

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

  const handleCheckboxChange = (
    e: React.FormEvent<HTMLButtonElement>,
    id: string | undefined
  ) => {
    e.stopPropagation(); // Prevent the event from bubbling
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={selectedRows.size === events.length}
                onChange={(e) => {
                  e.stopPropagation(); // Correctly stop propagation
                  const allSelected = selectedRows.size === events.length;
                  if (allSelected) {
                    setSelectedRows(new Set());
                  } else {
                    const newSelectedRows = new Set<string>();
                    events.forEach((event) => {
                      if (event.id) newSelectedRows.add(event.id);
                    });
                    setSelectedRows(newSelectedRows);
                  }
                }}
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id || ""}>
              <TableCell>
                <Checkbox
                  checked={selectedRows.has(event.id || "")}
                  onChange={(e) => handleCheckboxChange(e, event.id)}
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
