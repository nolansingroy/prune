"use client";

import { BookingTypes } from "@/interfaces/bookingTypes";
import {
  addBookingType,
  deleteBookingType,
  fetchBookingTypes,
  updateBookingType,
} from "@/lib/converters/bookingTypes";
import { useFirebaseAuth } from "@/services/authService";
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

const initialBookingData: BookingTypes = {
  docId: "",
  name: "",
  duration: 0,
  fee: 0,
  color: "#000000",
};

export default function BookTypesView() {
  const { authUser } = useFirebaseAuth();
  const [bookingTypes, setBookingTypes] = useState<BookingTypes[]>([]);
  const [newBookingData, setNewBookingData] =
    useState<BookingTypes>(initialBookingData);

  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  let actionType = editingBookingId ? "edit" : "add";

  const fetchTypes = useCallback(async () => {
    if (authUser) {
      // Fetching booking types from Firestore
      const types = await fetchBookingTypes(authUser.uid);
      setBookingTypes(types);
      setLoading(false);
      console.log("Booking types from firebase:", types);
    }
  }, [authUser]);

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
    if (authUser) {
      const { docId, ...bookingDataWithoutId } = newBookingData;

      if (actionType === "add") {
        await addBookingType(authUser.uid, bookingDataWithoutId);
        fetchTypes();
        setNewBookingData(initialBookingData);
      }

      if (actionType === "edit") {
        // Update booking type in Firestore
        await updateBookingType(authUser.uid, newBookingData);
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
    if (authUser) {
      // Deleteing booking type from Firestore
      await deleteBookingType(authUser.uid, id);
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
    <div className="space-y-6 bg-gray-50 dark:bg-primary-foreground p-6 rounded-lg shadow-sm border">
      <h2 className="text-2xl font-semibold">
        {editingBookingId ? "Edit Booking type" : "Create Booking type"}
      </h2>
      <div className="space-y-4">
        <Label className="block text-lg font-medium text-gray-700">Name</Label>
        <Input
          value={newBookingData.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setNewBookingData({ ...newBookingData, name: e.target.value })
          }
          placeholder="Enter booking type name"
        />
        <Label className="block text-lg font-medium text-gray-700">
          Default Duration (minutes)
        </Label>
        <Input
          type="number"
          value={newBookingData.duration || ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setNewBookingData({
              ...newBookingData,
              duration: Number(e.target.value),
            })
          }
          placeholder="Enter duration (e.g., 30, 60)"
        />

        <Label className="block text-lg font-medium text-gray-700">
          Fee (USD)
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
          placeholder="Enter fee (e.g., 100)"
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
          <Button className="mt-4" onClick={handleSaveBookingType}>
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
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableCell>Color</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Duration</TableCell>
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
                    <TableCell>{`${type.duration} minutes`}</TableCell>
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
                        onClick={() => handleDeleteBookingType(type.docId!)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No Booking Types available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
