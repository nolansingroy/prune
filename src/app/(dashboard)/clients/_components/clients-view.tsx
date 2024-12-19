"use client";

import { useAuth } from "@/context/AuthContext";
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
import {
  addClient,
  deleteClient,
  fetchClients,
  updateClient,
} from "@/lib/converters/clients";
import { Switch } from "@headlessui/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrashIcon,
  DotsHorizontalIcon,
  Pencil1Icon,
} from "@radix-ui/react-icons";
import { Badge } from "@/components/ui/badge";

const initialClientData: Client = {
  docId: "",
  status: "active",
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  intPhoneNumber: "",
  fullName: "",
  sms: false,
  clientOptOff: false,
  userSMSLink: "",
  generateLink: false, // Add generateLink to initialClientData
};

export default function ClientsView() {
  const { openConfirmation } = useConfirmationStore();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [editingClientId, setEditingClientId] = useState<string | null>(null); // Track if editing a client
  const [loading, setLoading] = useState(true);

  let actionType = editingClientId ? "edit" : "add";

  const {
    register,
    setValue,
    reset,
    trigger,
    clearErrors,
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

  const generateLink = watch("generateLink", false) ?? false; // Ensure generateLink is always a boolean

  // Fetch clients from the Firestore subcollection
  const fetchAllClients = useCallback(async () => {
    if (user) {
      const clients = await fetchClients(user.uid);
      setClients(clients);
      setLoading(false);
    }
  }, [user]);

  // Fetch clients on component mount
  useEffect(() => {
    fetchAllClients();
    return () => {
      setClients([]);
    };
  }, [fetchAllClients]);

  // Save or update client in the 'clients' subcollection
  const handleSaveClient = async (data: TClientsForm) => {
    if (user) {
      const formattedPhoneNumber = data.phoneNumber
        ? parsePhoneNumberWithError(data.phoneNumber, "US").formatNational()
        : "";

      let clientData = {
        ...data,
        fullName: `${data.firstName} ${data.lastName}`,
        intPhoneNumber: data.phoneNumber,
        docId: editingClientId || "",
        phoneNumber: formattedPhoneNumber,
        status: data.status || "active",
        clientOptOff: false,
        sms: false, // Always set sms to false
      };

      if (actionType === "add") {
        await addClient(user.uid, clientData, generateLink);
        toast.success("Client added successfully");
      } else {
        await updateClient(user.uid, clientData, generateLink);
        toast.success("Client updated successfully");
        setEditingClientId(null);
      }

      fetchAllClients();
      reset({ ...initialClientData, status: "active" });
    }
  };

  // Set client for editing
  const handleEditClient = (client: Client) => {
    const phoneNumber = client.phoneNumber || "";
    const parsedPhoneNumber = parsePhoneNumberFromString(phoneNumber, "US");
    const formattedPhoneNumber = parsedPhoneNumber
      ? parsedPhoneNumber.number
      : phoneNumber;

    setEditingClientId(client.docId!);
    setValue("firstName", client.firstName);
    setValue("lastName", client.lastName);
    setValue("email", client.email!);
    setValue("status", client.status as any);
    setValue("phoneNumber", formattedPhoneNumber!);
    setValue("generateLink", client.userSMSLink ? true : false); // Set generateLink based on existing link
    clearErrors();
  };

  // Delete a client from the 'clients' subcollection
  const handleDeleteClient = async (clientId: string) => {
    const clientName = clients.find((client) => client.docId === clientId);
    const clientReference = `${clientName?.firstName} ${clientName?.lastName}`;
    const clientFullName = clientReference || "this client";

    if (user) {
      openConfirmation({
        title: "Delete Confirmation",
        description: `Are you sure you want to delete ${clientFullName}?`,
        cancelLabel: "Cancel",
        actionLabel: "Delete",
        onAction: async () => {
          await deleteClient(user.uid, clientId);
          toast.success("Client deleted successfully");
          fetchAllClients();
        },
        onCancel: () => {},
      });
    }
  };

  // Copy link to clipboard
  const handleCopyLink = (link: string, clientName: string) => {
    navigator.clipboard.writeText(link).then(() => {
      toast.success(`${clientName} Link copied to clipboard`);
    });
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
            </div>

            <div className="space-y-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="generateLink">Generate SMS Opt-In Link</Label>
                <span className="text-sm text-muted-foreground">
                  Generate a unique link for this client to opt-in and receive
                  SMS notifications for bookings reminders.
                </span>
                <span className="text-sm text-muted-foreground">
                  If client accepted , sms reminders will be sent to this client
                  at 8:00 AM the day before their appointment
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  {generateLink ? "Enabled" : "Disabled"}
                </span>
                <Switch
                  id="generateLink"
                  checked={generateLink}
                  onChange={() => setValue("generateLink", !generateLink)}
                  className={`${
                    generateLink ? "bg-rebus-green" : "bg-gray-200"
                  } relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none`}
                >
                  <span
                    className={`${
                      generateLink ? "translate-x-8" : "translate-x-1"
                    } inline-block h-6 w-6 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-4">
              <Button type="submit" variant={"rebusPro"} className="mt-4">
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
                    <TableCell>sms</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Link</TableCell>
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
                      <TableCell>
                        {" "}
                        <TableCell>
                          <Badge
                            variant={client.sms ? "success" : "destructive"}
                          >
                            {client.sms ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                      </TableCell>
                      <TableCell>{client.status}</TableCell>
                      <TableCell>
                        {client.userSMSLink ? (
                          <Button
                            size="xs"
                            onClick={() =>
                              handleCopyLink(
                                `${window.location.origin}${client.userSMSLink}` ||
                                  "",
                                client.fullName || ""
                              )
                            }
                          >
                            Copy Link
                          </Button>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost">
                              <DotsHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleEditClient(client)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClient(client.docId!)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
