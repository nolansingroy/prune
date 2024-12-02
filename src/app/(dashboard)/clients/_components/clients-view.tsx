"use client";

import { useAuth } from "@/context/AuthContext";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import parsePhoneNumberFromString, {
  parsePhoneNumberWithError,
} from "libphonenumber-js";
import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { db } from "../../../../../firebase";
import { Input } from "@/components/ui/input"; // Input component
import { Button } from "@/components/ui/button"; // Button component
import { Label } from "@/components/ui/label"; // Label component
import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHeader,
} from "@/components/ui/table";
import {
  clientsFormSchema,
  TClientsForm,
} from "@/lib/validations/clients-form-validations";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PhoneInput } from "@/components/ui/phone-input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import useConfirmationStore from "@/lib/store/confirmationStore";
import { Client } from "@/interfaces/clients";
import { useForm, Controller } from "react-hook-form";

// interface Client {
//   docId: string;
//   stripeId: string;
//   status: string;
//   active: boolean;
//   email: string;
//   phoneNumber: string;
//   deprecated: boolean;
//   // defaultRate?: number | null;
//   firstName: string;
//   lastName: string;
//   created_at?: Timestamp; // Firestore timestamp
//   updated_at?: Timestamp; // Firestore timestamp
// }

const initialClientData: Client = {
  docId: "",
  // stripeId: "",
  status: "active",
  // active: true,
  // deprecated: false,
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
};

export default function ClientsView() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);

  // const [newClientData, setNewClientData] = useState(initialClientData); // Form data state
  const [editingClientId, setEditingClientId] = useState<string | null>(null); // Track if editing a client
  const [loading, setLoading] = useState(true); // Loading state to show while fetching

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
  } = useForm<TClientsForm>({
    resolver: zodResolver(clientsFormSchema),
    defaultValues: {
      ...initialClientData,
      status: "active",
    },
  });

  // Fetch clients from the Firestore subcollection
  const fetchClients = useCallback(async () => {
    if (user) {
      const clientsCollectionRef = collection(db, "users", user.uid, "clients");
      const clientsQuery = query(
        clientsCollectionRef,
        orderBy("created_at", "desc")
      );
      const clientSnapshot = await getDocs(clientsQuery);
      const clientList = clientSnapshot.docs.map((doc) => ({
        docId: doc.id,
        ...doc.data(),
      })) as Client[];

      setClients(clientList);
      setLoading(false);
      console.log("Clients fetched:", clientList); // Set loading to false after fetching
    }
  }, [user]);

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
    return () => {
      setClients([]);
    };
  }, [fetchClients]);

  // Save or update client in the 'clients' subcollection
  const handleSaveClient = async (data: TClientsForm) => {
    if (user) {
      const clientsCollectionRef = collection(db, "users", user.uid, "clients");
      const clientDocRef = editingClientId
        ? doc(clientsCollectionRef, editingClientId)
        : doc(clientsCollectionRef);

      const formattedPhoneNumber = data.phoneNumber
        ? parsePhoneNumberWithError(data.phoneNumber, "US").formatNational()
        : "";

      console.log("Phone Number:", data.phoneNumber);
      console.log("Formatted Phone Number:", formattedPhoneNumber);

      const newClient = {
        ...data,
        phoneNumber: formattedPhoneNumber,
        status: data.status || "active", // Default to "active" if status is not selected
        updated_at: serverTimestamp(),
        ...(editingClientId ? {} : { created_at: serverTimestamp() }), // Add created_at only for new clients
      };

      await setDoc(clientDocRef, newClient);

      // Refresh client list
      fetchClients();
      reset({ ...initialClientData, status: "active" });
      setEditingClientId(null);
    }
  };

  // Set client for editing
  const handleEditClient = (client: Client) => {
    const parsedPhoneNumber = parsePhoneNumberFromString(
      client.phoneNumber!,
      "US"
    );
    const formattedPhoneNumber = parsedPhoneNumber
      ? parsedPhoneNumber.number
      : client.phoneNumber;

    setEditingClientId(client.docId!);
    setValue("firstName", client.firstName);
    setValue("lastName", client.lastName);
    setValue("email", client.email!);
    setValue("status", client.status as any);
    setValue("phoneNumber", formattedPhoneNumber!);
    clearErrors();
  };

  // Delete a client from the 'clients' subcollection
  const handleDeleteClient = async (clientId: string) => {
    if (user) {
      const clientDocRef = doc(db, "users", user.uid, "clients", clientId);
      await deleteDoc(clientDocRef);

      // Refresh client list after deletion
      fetchClients();
    }
  };

  // // Handle form input changes
  // const handleInputChange = (
  //   e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>
  // ) => {
  //   const { name, value } = e.target;
  //   setNewClientData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

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
        <h2 className="text-2xl font-semibold">
          {editingClientId ? "Edit Client" : "Add Client"}
        </h2>
        <div className="space-y-4">
          {/* Form to add/edit client */}
          <form
            className="space-y-4"
            onSubmit={handleSubmit(handleSaveClient, (errors) => {
              console.log("Validation Errors:", errors);
              console.log("Form Values:", getValues());
            })}
          >
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                {...register("firstName")}
                className="w-full"
              />
              {errors.firstName && (
                <p className="text-destructive text-sm">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                type="text"
                {...register("lastName")}
                className="w-full"
              />
              {errors.lastName && (
                <p className="text-destructive text-sm">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <select
                id="status"
                {...register("status")}
                className="border border-gray-300 rounded-lg p-2 w-full"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="deactivated">Deactivated</option>
              </select>
              {errors.status && (
                <p className="text-destructive text-sm">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                className="w-full"
              />
              {errors.email && (
                <p className="text-destructive text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                Phone <span className="text-destructive">*</span>
              </Label>

              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    defaultCountry="US"
                    id="phoneNumber"
                    {...field}
                    onChange={(value) => field.onChange(value)}
                    className="w-full"
                  />
                )}
              />

              {errors.phoneNumber && (
                <p className="text-destructive text-sm">
                  {errors.phoneNumber.message}
                </p>
              )}
              {/* <PhoneInput
                defaultCountry="US"
                id="phoneNumber"
                {...register("phoneNumber")}
                onChange={(value) =>
                  setValue("phoneNumber", value, { shouldValidate: true })
                }
                className="w-full"
              /> */}
            </div>

            {/* Buttons */}
            <div className="flex space-x-4">
              <Button
                type="submit"
                variant={"rebusPro"}
                className="mt-4"
                // onClick={handleSaveClient}
              >
                {editingClientId ? "Update Client" : "Add Client"}
              </Button>

              {editingClientId && (
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => {
                    setEditingClientId(null);
                    reset({ ...initialClientData, status: "active" });
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Clients List */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Clients</h2>
          {clients.length > 0 ? (
            <ScrollArea className="h-[calc(80vh-220px)] rounded-md border md:h-full md:max-h-full grid">
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
                    {/* <TableCell>Rate</TableCell> */}
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.docId}>
                      <TableCell>{client.firstName}</TableCell>
                      <TableCell>{client.lastName}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phoneNumber}</TableCell>
                      <TableCell>{client.status}</TableCell>
                      {/* <TableCell>{client.defaultRate || "N/A"}</TableCell> */}
                      <TableCell>
                        <Button
                          className="mr-2"
                          onClick={() => handleEditClient(client)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteClient(client.docId!)}
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
          ) : (
            <p>No clients available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
