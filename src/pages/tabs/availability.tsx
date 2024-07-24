import Image from "next/image";
import * as React from "react";
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
import { auth } from "../../../firebase";
import { createEvent, updateEvent } from "../../services/userService";
import EventFormDialog from "../EventFormModal";
import { Timestamp } from "firebase/firestore";

const data: Payment[] = [
  {
    id: "m5gr84i9",
    amount: 316,
    status: "success",
    email: "ken99@yahoo.com",
    date: "2021-10-01",
    day: "Friday",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    duration: "1 hour",
    location: "San Francisco, CA",
    reoccuring: true,
    clientName: "Ken",
  },
  {
    id: "3u1reuv4",
    amount: 242,
    status: "success",
    email: "Abe45@gmail.com",
    date: "2021-10-01",
    day: "Friday",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    duration: "1 hour",
    location: "San Francisco, CA",
    reoccuring: true,
    clientName: "Abe",
  },
  {
    id: "derv1ws0",
    amount: 837,
    status: "processing",
    email: "Monserrat44@gmail.com",
    date: "2021-10-01",
    day: "Friday",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    duration: "1 hour",
    location: "San Francisco, CA",
    reoccuring: true,
    clientName: "Monserrat",
  },
  {
    id: "5kma53ae",
    amount: 874,
    status: "success",
    email: "Silas22@gmail.com",
    date: "2021-10-01",
    day: "Friday",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    duration: "1 hour",
    location: "San Francisco, CA",
    reoccuring: true,
    clientName: "Silas",
  },
  {
    id: "bhqecj4p",
    amount: 721,
    status: "failed",
    email: "carmella@hotmail.com",
    date: "2021-10-01",
    day: "Friday",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    duration: "1 hour",
    location: "San Francisco, CA",
    reoccuring: true,
    clientName: "Carmella",
  },
];

export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  duration: string;
  location: string;
  reoccuring: boolean;
  clientName?: string;
};

export const columns: ColumnDef<Payment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <div className="capitalize">{row.getValue("date")}</div>,
  },
  {
    accessorKey: "day",
    header: "Day",
    cell: ({ row }) => <div className="capitalize">{row.getValue("day")}</div>,
  },
  {
    accessorKey: "startTime",
    header: "Start Time",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("startTime")}</div>
    ),
  },
  {
    accessorKey: "endTime",
    header: "End Time",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("endTime")}</div>
    ),
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("duration")}</div>
    ),
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("location")}</div>
    ),
  },
  {
    accessorKey: "reoccuring",
    header: "Re-occuring",
    cell: ({ row }) => (
      <div className="capitalize">
        {row.getValue("reoccuring") ? "Yes" : "No"}
      </div>
    ),
  },
  // {
  //   accessorKey: "clientName",
  //   header: "Client",
  //   cell: ({ row }) => (
  //     <div className="capitalize">{row.getValue("clientName")}</div>
  //   ),
  // },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Clone</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function Availability() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedRow, setSelectedRow] = React.useState<Payment | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isNewEvent, setIsNewEvent] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleRowClick = (row: Payment) => {
    setSelectedRow(row);
    setIsNewEvent(false);
    setIsModalOpen(true);
  };

  const openNewEventModal = () => {
    setSelectedRow(null);
    setIsNewEvent(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRow(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Payment
  ) => {
    if (selectedRow) {
      setSelectedRow({ ...selectedRow, [field]: e.target.value });
    }
  };

  const handleSave = async (eventData: {
    title: string;
    isBackgroundEvent: boolean;
    startTime: string;
    endTime: string;
  }) => {
    const user = auth.currentUser;
    if (user) {
      console.log(`Current user UID: ${user.uid}`);
      const event = {
        title: eventData.title,
        start: Timestamp.fromDate(new Date(eventData.startTime)),
        end: Timestamp.fromDate(new Date(eventData.endTime)),
        description: selectedRow?.location || "", // Customize as needed
        isBackgroundEvent: eventData.isBackgroundEvent,
      };
      console.log(` ${user.uid} Event data to be saved:, ${event}`);
      try {
        if (isNewEvent) {
          // await createEvent(user.uid, event);
          console.log("Availability created in Firestore");
        } else if (selectedRow) {
          // await updateEvent(user.uid, selectedRow.id, event);
          console.log("Availability updated in Firestore");
        }
      } catch (error) {
        console.error("Error saving availability in Firestore:", error);
      }
    } else {
      console.error("No authenticated user found.");
    }
    closeModal();
  };

  return (
    <div className="w-full relative">
      <h1 className="text-xl font-bold mb-4">My Available Times</h1>
      <div className="flex items-center py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => handleRowClick(row.original)}
                  style={{ cursor: "pointer" }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 rounded-full p-4 shadow-lg bg-white"
        onClick={openNewEventModal}
      >
        <PlusCircledIcon className="h-6 w-6" />
      </Button>
      <EventFormDialog
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
      />
    </div>
  );
}
