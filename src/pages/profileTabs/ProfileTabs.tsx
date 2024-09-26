"use client";
import React, { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientsTab from "./ClientsTab"; // Ensure you have the correct path to ClientsTab component

// List of major timezones
const timezones = [
  "Pacific/Midway",
  "America/Adak",
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Atlantic/Azores",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

interface Client {
  docId: string;
  stripeId: string;
  status: string;
  active: boolean;
  deprecated: boolean;
  defaultRate?: number | null;
  firstName: string;
  lastName: string;
}

interface ProfileTabsProps {
  userTimezone: string;
  handleTimezoneChange: (newTimezone: string) => void;
  profileData: { firstName: string; lastName: string; email: string };
  bookingTypes: { name: string; duration: number }[];
  bookingName: string;
  setBookingName: (value: string) => void;
  bookingDuration: number;
  setBookingDuration: (value: number) => void;
  handleAddBookingType: () => void;
  clients: Client[];
  authUser: { uid: string } | null; // Nullable authUser to prevent issues
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  userTimezone,
  handleTimezoneChange,
  profileData,
  bookingTypes = [], // Provide default value as an empty array
  bookingName,
  setBookingName,
  bookingDuration,
  setBookingDuration,
  handleAddBookingType,
  clients = [], // Provide default value as an empty array
  authUser,
  setClients,
}) => {
  return (
    <Tabs defaultValue="profile">
      <TabsList className="mb-6">
        <TabsTrigger value="profile" className="text-lg font-medium">
          Profile
        </TabsTrigger>
        <TabsTrigger value="bookings" className="text-lg font-medium">
          Booking Types
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
              <strong>First Name:</strong> {profileData?.firstName || "N/A"}
            </p>
            <p>
              <strong>Last Name:</strong> {profileData?.lastName || "N/A"}
            </p>
            <p>
              <strong>Email:</strong> {profileData?.email || "N/A"}
            </p>
          </div>

          <div className="mt-6">
            <Label className="block text-lg font-medium text-gray-700">
              Timezone
            </Label>
            <select
              value={userTimezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 w-full"
            >
              <option value="">Select Timezone</option>
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="text-gray-500 mt-2">
              Current timezone: {userTimezone || "N/A"}
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
        {authUser ? (
          <ClientsTab
            clients={clients}
            authUser={authUser}
            setClients={setClients}
          />
        ) : (
          <p>Loading clients...</p>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs;
