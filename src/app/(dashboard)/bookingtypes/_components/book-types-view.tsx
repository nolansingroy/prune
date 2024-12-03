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
import { useForm } from "react-hook-form";
import {
  bookingtypeFormSchema,
  TBookingtypeForm,
} from "@/lib/validations/bookingtypes-form-validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import useConfirmationStore from "@/lib/store/confirmationStore";

const initialBookingData: BookingTypes = {
  docId: "",
  name: "",
  fee: undefined,
  color: "#000000",
};

export default function BookTypesView() {
  const { openConfirmation } = useConfirmationStore();
  const { user } = useAuth();
  const [bookingTypes, setBookingTypes] = useState<BookingTypes[]>([]);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  let actionType = editingBookingId ? "edit" : "add";

  const {
    register,
    setValue,
    reset,
    trigger,
    clearErrors,
    // getValues responsable for getting the form values
    getValues,
    control,
    watch,
    formState: { isSubmitting, errors },
    handleSubmit,
  } = useForm<TBookingtypeForm>({
    resolver: zodResolver(bookingtypeFormSchema),
    defaultValues: initialBookingData,
  });

  const fetchTypes = useCallback(async () => {
    if (user) {
      // Fetching booking types from Firestore
      const types = await fetchBookingTypes(user.uid);
      setBookingTypes(types);
      setLoading(false);
      // console.log("Booking types from firebase:", types);
    }
  }, [user]);

  useEffect(() => {
    fetchTypes();
    return () => {
      setBookingTypes([]);
    };
  }, [fetchTypes]);

  const handleSaveBookingType = async (data: TBookingtypeForm) => {
    // console.log("actionType:", actionType);
    if (user) {
      const bookingData = { ...data, docId: editingBookingId || "" };

      if (actionType === "add") {
        await addBookingType(user.uid, bookingData);
      } else {
        await updateBookingType(user.uid, bookingData);
        setEditingBookingId(null);
      }
      fetchTypes();
      reset();
    }
  };

  const handleEditBookingType = (type: BookingTypes) => {
    setEditingBookingId(type.docId!);
    setValue("name", type.name);
    setValue("fee", type.fee!);
    setValue("color", type.color);
    clearErrors();
  };

  const handleDeleteBookingType = async (id: string) => {
    if (user) {
      // Deleteing booking type from Firestore

      const bookingType = bookingTypes.find((type) => type.docId === id);
      const typeName = bookingType?.name || "this booking type";

      openConfirmation({
        title: "Delete Confirmation",
        description: `Are you sure you want to delete ${typeName}?`,
        cancelLabel: "Cancel",
        actionLabel: "Delete",
        onAction: async () => {
          await deleteBookingType(user.uid, id);
          toast.success("Booking type deleted successfully");
          fetchTypes();
        },
        onCancel: () => {},
      });
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
          <form
            className="space-y-4"
            onSubmit={handleSubmit(handleSaveBookingType, (errors) => {
              // console.log("Validation Errors:", errors);
              // console.log("Form Values:", getValues());
            })}
          >
            <Label
              className="block text-lg font-medium text-gray-700"
              htmlFor="name"
            >
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              {...register("name")}
              placeholder="e.g. On Ice Training"
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}

            <Label
              className="block text-lg font-medium text-gray-700"
              htmlFor="fee"
            >
              Default Fee (USD) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fee"
              type="number"
              {...register("fee", { valueAsNumber: true })}
              placeholder="you will be able to override on individual bookings"
            />
            {errors.fee && (
              <p className="text-destructive text-sm">{errors.fee.message}</p>
            )}

            <div className="flex gap-6 items-center">
              <Label className="block text-lg font-medium text-gray-700">
                Color
              </Label>
              <div className="relative inline-block">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 relative">
                  <Input
                    type="color"
                    {...register("color")}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="absolute inset-0 w-full h-full rounded-full pointer-events-none"
                    style={{ backgroundColor: watch("color") }}
                  ></div>
                </div>
              </div>
            </div>
            {errors.color && (
              <p className="text-destructive text-sm">{errors.color.message}</p>
            )}

            <div className="flex space-x-4">
              <Button type="submit" variant={"rebusPro"} className="mt-4">
                {editingBookingId ? "Update Booking Type" : "Add Booking Type"}
              </Button>

              {editingBookingId && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => {
                    setEditingBookingId(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

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
                            </div>
                          </TableCell>
                          <TableCell>{type.name}</TableCell>
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
