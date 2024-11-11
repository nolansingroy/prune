"use client";

import { useFirebaseAuth } from "@/services/authService";
import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../../firebase";
import { Label } from "@/components/ui/label";
import { timezones } from "@/constants/data";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { TimePicker12Demo } from "@/components/inputs/time-picker-12h-demo"; // Import the TimePicker12Demo component
import { Button } from "@/components/ui/button";

function convertTo24HourFormat(
  hours: number,
  minutes: number,
  seconds: number,
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
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function ProfileView() {
  const { authUser } = useFirebaseAuth();
  const [userTimezone, setUserTimezone] = useState("");
  const [calendarStartTime, setCalendarStartTime] = useState("07:00:00");
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  useEffect(() => {
    const fetchUserData = async () => {
      if (authUser) {
        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserTimezone(userData.timezone || "");
          setCalendarStartTime(userData.calendarStartTime || "07:00:00");
          setProfileData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || "",
          });
          if (userData.calendarStartTime) {
            const [hours, minutes, seconds] = userData.calendarStartTime
              .split(":")
              .map(Number);
            const date = new Date();
            date.setHours(hours);
            date.setMinutes(minutes);
            date.setSeconds(seconds);
            setSelectedDate(date);
          }
        }
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authUser]);

  const handleSaveProfile = async () => {
    if (authUser && selectedDate) {
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      const seconds = selectedDate.getSeconds();
      const period = hours >= 12 ? "PM" : "AM";
      const time24h = convertTo24HourFormat(
        hours % 12 || 12,
        minutes,
        seconds,
        period
      );
      const userDocRef = doc(db, "users", authUser.uid);
      await updateDoc(userDocRef, {
        timezone: userTimezone,
        calendarStartTime: time24h,
      });
      setCalendarStartTime(time24h);
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
        <TimePicker12Demo date={selectedDate} setDate={setSelectedDate} />
        <Button
          variant={"rebusPro"}
          onClick={handleSaveProfile}
          className="mt-4"
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
