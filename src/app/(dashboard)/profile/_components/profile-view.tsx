"use client";

// import { useFirebaseAuth } from "@/services/authService";
import React, { useTransition, useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../../firebase";
import { Label } from "@/components/ui/label";
import { timezones } from "@/constants/data";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { TimePicker12Demo } from "@/components/inputs/time-picker-12h-demo"; // Import the TimePicker12Demo component
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Period } from "@/components/inputs/time-picker-utils"; // Import the Period type
import { useAuth } from "@/context/AuthContext";

function convertTo24HourFormat(
  hours: number,
  minutes: number,
  period: string
): string {
  if (period === "PM" && hours < 12) {
    hours += 12;
  }
  if (period === "AM" && hours === 12) {
    hours = 0;
  }
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:00`;
}

function convertTo12HourFormat(time24h: string): {
  hours: number;
  minutes: number;
  period: string;
} {
  let [hours, minutes] = time24h.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  return { hours, minutes, period };
}

export default function ProfileView() {
  const { user } = useAuth();
  const [loading, startTransition] = useTransition();
  // const { authUser } = useFirebaseAuth();
  const [userTimezone, setUserTimezone] = useState("");
  const [calendarStartTime, setCalendarStartTime] = useState("07:00:00");
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [isLoading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [period, setPeriod] = useState<Period>("AM"); // State for period

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserTimezone(userData.timezone || "");
          const startTime = userData.calendarStartTime || "07:00:00";
          setCalendarStartTime(startTime);
          setProfileData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || "",
          });
          const { hours, minutes, period } = convertTo12HourFormat(startTime);
          const date = new Date();
          date.setHours(hours);
          date.setMinutes(minutes);
          setSelectedDate(date);
          setPeriod(period as Period); // Set the period state
        }
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleSaveProfile = () => {
    try {
      if (user && selectedDate) {
        const hours = selectedDate.getHours();
        const minutes = selectedDate.getMinutes();
        const period = hours >= 12 ? "PM" : "AM";
        const time24h = convertTo24HourFormat(
          hours % 12 || 12,
          minutes,
          period
        );
        const userDocRef = doc(db, "users", user.uid);

        startTransition(async () => {
          await updateDoc(userDocRef, {
            timezone: userTimezone,
            calendarStartTime: time24h,
          });
          setCalendarStartTime(time24h);
          toast.success("Profile updated successfully");
        });
      }
    } catch (error) {
      toast.error("An error occurred while updating profile");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-10 h-10" />
      </div>
    ); // Display a loading message while fetching
  }

  return (
    <div className="max-w-4xl p-6 space-y-6 bg-white dark:bg-primary-foreground rounded-lg shadow-sm border">
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
          onChange={(e) => setUserTimezone(e.target.value)}
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

      <div className="mt-6">
        <Label className="block text-lg font-medium text-gray-700">
          Calendar Display Start Time
        </Label>
        <TimePicker12Demo
          date={selectedDate}
          setDate={setSelectedDate}
          period={period}
          setPeriod={setPeriod}
        />
        <Button
          variant={"rebusPro"}
          onClick={handleSaveProfile}
          className="mt-8 w-full sm:w-auto"
          disabled={loading}
        >
          Save profile
        </Button>
        {/* <p className="text-gray-500 mt-2">
          Current start time: {calendarStartTime}
        </p> */}
      </div>
    </div>
  );
}
