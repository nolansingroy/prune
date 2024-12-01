"use client";

import { BookingTypes } from "@/interfaces/bookingTypes";
import {
  addBookingType,
  deleteBookingType,
  fetchBookingTypes,
  updateBookingType,
} from "@/lib/converters/bookingTypes";
import { useAuth } from "@/context/AuthContext";
import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHeader,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const initialBookingData: BookingTypes = {
  docId: "",
  name: "",
  // duration: 0,
  fee: 0,
  color: "#000000",
};

export default function BookTypesView() {
  const { user } = useAuth();
  const [bookingTypes, setBookingTypes] = useState<BookingTypes[]>([]);
  const [newBookingData, setNewBookingData] =
    useState<BookingTypes>(initialBookingData);

  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  let actionType = editingBookingId ? "edit" : "add";

  const fetchTypes = useCallback(async () => {
    if (user) {
      // Fetching booking types from Firestore
      const types = await fetchBookingTypes(user.uid);
      setBookingTypes(types);
      setLoading(false);
      console.log("Booking types from firebase:", types);
    }
  }, [user]);

  useEffect(() => {
    console.log("Component mounted or authUser.uid changed");
    fetchTypes();

    return () => {
      console.log("Component unmounted");
      setBookingTypes([]);
    };
  }, [fetchTypes]);

  const handleSaveBookingType = async () => {
    console.log("actionType:", actionType);
    if (user) {
      const { docId, ...bookingDataWithoutId } = newBookingData;

      if (actionType === "add") {
        await addBookingType(user.uid, bookingDataWithoutId);
        fetchTypes();
        setNewBookingData(initialBookingData);
      }

      if (actionType === "edit") {
        await updateBookingType(user.uid, newBookingData);
        fetchTypes();
        setNewBookingData(initialBookingData);
        setEditingBookingId(null);
      }
    }
  };

  const handleEditBookingType = (type: BookingTypes) => {
    console.log("Editing booking type:", type);
    setNewBookingData(type);
    setEditingBookingId(type.docId!);
  };

  const handleDeleteBookingType = async (id: string) => {
    if (user) {
      // Deleteing booking type from Firestore
      await deleteBookingType(user.uid, id);
      fetchTypes();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-10 h-10" />
      </div>
    ); // Display a loading message while fetching
  }

  return (
    <div className="space-y-4">
      <div className="space-y-6 bg-white dark:bg-primary-foreground p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-semibold tracking-tight">
          {editingBookingId ? `Edit Booking type` : `Create Booking type`}
        </h2>
        {!editingBookingId && (
          <span className="text-sm text-muted-foreground">
            you will need to create at least one booking type
          </span>
        )}
        <div className="space-y-4">
          <Label className="block text-lg font-medium text-gray-700">
            Name
          </Label>
          <Input
            value={newBookingData.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewBookingData({ ...newBookingData, name: e.target.value })
            }
            placeholder="e.g. On Ice Training"
          />
          <Label className="block text-lg font-medium text-gray-700">
            Default Fee (USD)
          </Label>
          <Input
            type="number"
            value={newBookingData.fee || ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewBookingData({
                ...newBookingData,
                fee: Number(e.target.value),
              })
            }
            placeholder="e.g. 100"
          />

          <div className="flex gap-6 items-center">
            <Label className="block text-lg font-medium text-gray-700">
              Color
            </Label>
            <div className="relative inline-block">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 relative">
                <Input
                  type="color"
                  value={newBookingData.color}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setNewBookingData({
                      ...newBookingData,
                      color: e.target.value,
                    })
                  }
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="absolute inset-0 w-full h-full rounded-full pointer-events-none"
                  style={{ backgroundColor: newBookingData.color }}
                ></div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <Button
              variant={"rebusPro"}
              className="mt-4"
              onClick={handleSaveBookingType}
            >
              {editingBookingId ? "Update Booking Type" : "Add Booking Type"}
            </Button>

            {editingBookingId && (
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => {
                  setEditingBookingId(null);
                  setNewBookingData(initialBookingData);
                }}
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Clients List */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold">Booking Types</h2>
            {bookingTypes.length > 0 ? (
              <div className="mt-4">
                <ScrollArea className="h-[calc(80vh-220px)] rounded-md border md:h-full md:max-h-full grid">
                  <Table className="mt-4">
                    <TableHeader>
                      <TableRow>
                        <TableCell>Color</TableCell>
                        <TableCell>Name</TableCell>
                        {/* <TableCell>Duration</TableCell> */}
                        <TableCell>Fee</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookingTypes.map((type) => (
                        <TableRow key={type.docId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: type.color }}
                              ></div>
                              {/* <span>{type.color}</span> */}
                            </div>
                          </TableCell>
                          <TableCell>{type.name}</TableCell>
                          {/* <TableCell>{`${type.duration} minutes`}</TableCell> */}
                          <TableCell>
                            {type.fee !== undefined && type.fee !== null
                              ? new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }).format(type.fee)
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Button
                              className="mr-2"
                              onClick={() => handleEditBookingType(type)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() =>
                                handleDeleteBookingType(type.docId!)
                              }
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            ) : (
              <p>No Booking Types available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
