"use client";
import React, { useEffect, useState, ChangeEvent, MouseEvent } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useFirebaseAuth } from "../services/authService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableRow,
  TableCell,
  TableBody,
  TableHeader,
  //   TableHeaderCell,
} from "@/components/ui/table";

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
];

const ProfilePage = () => {
  const { authUser } = useFirebaseAuth();
  const [userTimezone, setUserTimezone] = useState("");
  const [bookingTypes, setBookingTypes] = useState<
    { name: string; duration: number }[]
  >([]);
  const [bookingName, setBookingName] = useState("");
  const [bookingDuration, setBookingDuration] = useState(30);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (authUser) {
        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserTimezone(userData.timezone || "");
          setBookingTypes(userData.bookingTypes || []);
          setProfileData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || "",
          });
          setClients(userData.clients || []);
        }
      }
    };

    fetchUserData();
  }, [authUser]);

  const handleTimezoneChange = async (newTimezone: string) => {
    if (authUser) {
      const userDocRef = doc(db, "users", authUser.uid);
      await updateDoc(userDocRef, { timezone: newTimezone });
      setUserTimezone(newTimezone);
    }
  };

  const handleAddBookingType = async () => {
    if (authUser && bookingName) {
      const newBookingType = { name: bookingName, duration: bookingDuration };
      const updatedBookingTypes = [...bookingTypes, newBookingType];
      const userDocRef = doc(db, "users", authUser.uid);
      await updateDoc(userDocRef, { bookingTypes: updatedBookingTypes });
      setBookingTypes(updatedBookingTypes);
      setBookingName("");
      setBookingDuration(30);
    }
  };

  const handleAddClient = async (newClientName: string) => {
    if (authUser && newClientName) {
      const newClient = { id: Date.now().toString(), name: newClientName };
      const updatedClients = [...clients, newClient];
      const userDocRef = doc(db, "users", authUser.uid);
      await updateDoc(userDocRef, { clients: updatedClients });
      setClients(updatedClients);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (authUser) {
      const updatedClients = clients.filter((client) => client.id !== clientId);
      const userDocRef = doc(db, "users", authUser.uid);
      await updateDoc(userDocRef, { clients: updatedClients });
      setClients(updatedClients);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Profile Settings</h1>
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="text-lg font-medium">
            Profile
          </TabsTrigger>
          <TabsTrigger value="bookings" className="text-lg font-medium">
            Create Booking Types
          </TabsTrigger>
          <TabsTrigger value="clients" className="text-lg font-medium">
            Clients
          </TabsTrigger>
        </TabsList>

        {/* Profile + Timezone Section */}
        <TabsContent value="profile">
          <div className="space-y-6 bg-gray-100 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold">Profile Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <p>
                <strong>First Name:</strong> {profileData.firstName}
              </p>
              <p>
                <strong>Last Name:</strong> {profileData.lastName}
              </p>
              <p>
                <strong>Email:</strong> {profileData.email}
              </p>
            </div>

            {/* Timezone Section */}
            <div className="mt-6">
              <Label className="block text-lg font-medium text-gray-700">
                Timezone
              </Label>
              <Select value={userTimezone} onValueChange={handleTimezoneChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-gray-500 mt-2">
                Current timezone: {userTimezone}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Booking Types Section */}
        <TabsContent value="bookings">
          <div className="space-y-6 bg-gray-100 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold">Create Booking Types</h2>
            <div className="space-y-4">
              <Label className="block text-lg font-medium text-gray-700">
                Booking Name
              </Label>
              <Input
                value={bookingName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setBookingName(e.target.value)
                }
                placeholder="Enter booking type name"
              />
              <Label className="block text-lg font-medium text-gray-700">
                Duration (minutes)
              </Label>
              <Input
                type="number"
                value={bookingDuration}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setBookingDuration(Number(e.target.value))
                }
                placeholder="Enter duration (e.g., 30, 60)"
              />
              <Button className="mt-4" onClick={handleAddBookingType}>
                Add Booking Type
              </Button>

              <div className="mt-6">
                <h2 className="text-xl font-semibold">Booking Types</h2>
                <ul className="list-disc list-inside">
                  {bookingTypes.map((booking, index) => (
                    <li key={index} className="mt-2">
                      {booking.name} - {booking.duration} min
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Clients Section */}
        <TabsContent value="clients">
          <div className="space-y-6 bg-gray-100 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold">Manage Clients</h2>
            <Label className="block text-lg font-medium text-gray-700">
              Add Client
            </Label>
            <Input
              placeholder="Client Name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddClient(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />

            <div className="mt-6">
              <h2 className="text-xl font-semibold">Clients</h2>
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHeader>Client Name</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
