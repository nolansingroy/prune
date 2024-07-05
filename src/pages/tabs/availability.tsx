import Image from "next/image";
import * as React from "react";
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
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
  {
    accessorKey: "clientName",
    header: "Client",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("clientName")}</div>
    ),
  },
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

  return (
    <div className="w-full">
      <div>
        <h1>My Available Times</h1>
      </div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Search Bookings"
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
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
      {isModalOpen && selectedRow && (
        <Dialog open={isModalOpen} onOpenChange={closeModal}>
          <DialogOverlay className="fixed inset-0 bg-black bg-opacity-30" />
          <DialogContent className="fixed inset-x-0 bottom-0 max-w-lg mx-auto bg-white p-4 rounded-t-lg shadow-lg max-h-150 overflow-y-auto">
            <DialogTitle>Row Details</DialogTitle>
            <div className="grid grid-cols-1 gap-4">
              <label>
                Date:
                <Input
                  value={selectedRow.date}
                  onChange={(e) => handleChange(e, "date")}
                />
              </label>
              <label>
                Day:
                <Input
                  value={selectedRow.day}
                  onChange={(e) => handleChange(e, "day")}
                />
              </label>
              <label>
                Start Time:
                <Input
                  value={selectedRow.startTime}
                  onChange={(e) => handleChange(e, "startTime")}
                />
              </label>
              <label>
                End Time:
                <Input
                  value={selectedRow.endTime}
                  onChange={(e) => handleChange(e, "endTime")}
                />
              </label>
              <label>
                Duration:
                <Input
                  value={selectedRow.duration}
                  onChange={(e) => handleChange(e, "duration")}
                />
              </label>
              <label>
                Location:
                <Input
                  value={selectedRow.location}
                  onChange={(e) => handleChange(e, "location")}
                />
              </label>
              <label>
                Re-occuring:
                <Input
                  value={selectedRow.reoccuring ? "Yes" : "No"}
                  onChange={(e) => handleChange(e, "reoccuring")}
                />
              </label>
              <label>
                Client:
                <Input
                  value={selectedRow.clientName}
                  onChange={(e) => handleChange(e, "clientName")}
                />
              </label>
              <label>
                Email:
                <Input
                  value={selectedRow.email}
                  // onChange={(e) => handleChange(e, "email")}
                />
              </label>
              {/* <label>
                Status:
                <Input
                  value={selectedRow.status}
                  onChange={(e) => handleChange(e, "status")}
                />
              </label> */}
              {/* <label>
                Amount:
                <Input
                  value={selectedRow.amount}
                  onChange={(e) => handleChange(e, "amount")}
                />
              </label> */}
            </div>
            <div className="flex justify-between mt-4">
              <Button onClick={closeModal}>Save</Button>
              <Button onClick={closeModal}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
