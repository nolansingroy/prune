"use client";

import { useAuth } from "@/context/AuthContext";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import parsePhoneNumberFromString, {
  parsePhoneNumberWithError,
} from "libphonenumber-js";
import React, { ChangeEvent, useEffect, useState } from "react";
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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PhoneInput } from "@/components/ui/phone-input";

interface Client {
  docId: string;
  stripeId: string;
  status: string;
  active: boolean;
  email: string;
  phoneNumber: string;
  deprecated: boolean;
  // defaultRate?: number | null;
  firstName: string;
  lastName: string;
  created_at?: Timestamp; // Firestore timestamp
  updated_at?: Timestamp; // Firestore timestamp
}

const initialClientData: Omit<Client, "docId"> = {
  stripeId: "",
  status: "active", // Default status to "active"
  active: true,
  deprecated: false,
  // defaultRate: null,
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
};

export default function ClientsView() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);

  const [newClientData, setNewClientData] = useState(initialClientData); // Form data state
  const [editingClientId, setEditingClientId] = useState<string | null>(null); // Track if editing a client
  const [loading, setLoading] = useState(true); // Loading state to show while fetching

  // Handle form input changes
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewClientData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fetch clients from the Firestore subcollection
  const fetchClients = async () => {
    if (user) {
      const clientsCollectionRef = collection(db, "users", user.uid, "clients");
      const clientSnapshot = await getDocs(clientsCollectionRef);
      const clientList = clientSnapshot.docs.map((doc) => ({
        docId: doc.id,
        ...doc.data(),
      })) as Client[];

      setClients(clientList);
      setLoading(false);
      console.log("Clients fetched:", clientList); // Set loading to false after fetching
    }
  };

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, [user]);

  // Save or update client in the 'clients' subcollection
  const handleSaveClient = async () => {
    if (user) {
      const clientsCollectionRef = collection(db, "users", user.uid, "clients");
      const clientDocRef = editingClientId
        ? doc(clientsCollectionRef, editingClientId)
        : doc(clientsCollectionRef);

      const formattedPhoneNumber = newClientData.phoneNumber
        ? parsePhoneNumberWithError(
            newClientData.phoneNumber,
            "US"
          ).formatNational()
        : "";

      const newClient = {
        ...newClientData,
        phoneNumber: formattedPhoneNumber,
        status: newClientData.status || "active", // Default to "active" if status is not selected
        created_at: editingClientId
          ? newClientData.created_at
          : serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      await setDoc(clientDocRef, newClient);

      // Refresh client list
      fetchClients();
      setNewClientData(initialClientData); // Reset form data
      setEditingClientId(null); // Exit edit mode
    }
  };

  // Set client for editing
  const handleEditClient = (client: Client) => {
    const parsedPhoneNumber = parsePhoneNumberFromString(
      client.phoneNumber,
      "US"
    );
    const formattedPhoneNumber = parsedPhoneNumber
      ? parsedPhoneNumber.number
      : client.phoneNumber;

    setEditingClientId(client.docId);
    setNewClientData({
      ...client,
      phoneNumber: formattedPhoneNumber,
    });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-10 h-10" />
      </div>
    ); // Display a loading message while fetching
  }

  return (
    <div className="space-y-6 bg-white dark:bg-primary-foreground p-6 rounded-lg shadow-sm border">
      <h2 className="text-2xl font-semibold">
        {editingClientId ? "Edit Client" : "Add Client"}
      </h2>

      <div className="space-y-4">
        {/* Form to add/edit client */}
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input
            name="firstName"
            value={newClientData.firstName}
            onChange={handleInputChange}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input
            name="lastName"
            value={newClientData.lastName}
            onChange={handleInputChange}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <select
            name="status"
            value={newClientData.status}
            onChange={handleInputChange}
            className="border border-gray-300 rounded-lg p-2 w-full"
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            name="email"
            value={newClientData.email}
            onChange={handleInputChange}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Phone</Label>
          <PhoneInput
            defaultCountry="US"
            name="phoneNumber"
            value={newClientData.phoneNumber}
            onChange={(value) =>
              setNewClientData((prev) => ({ ...prev, phoneNumber: value }))
            }
            className="w-full"
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-4">
          <Button
            variant={"rebusPro"}
            className="mt-4"
            onClick={handleSaveClient}
          >
            {editingClientId ? "Update Client" : "Add Client"}
          </Button>

          {editingClientId && (
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => {
                setEditingClientId(null);
                setNewClientData(initialClientData);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Clients List */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Clients</h2>
        {clients.length > 0 ? (
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
                      onClick={() => handleDeleteClient(client.docId)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p>No clients available.</p>
        )}
      </div>
    </div>
  );
}
