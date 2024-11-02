"use client";

import { useFirebaseAuth } from "@/services/authService";
import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../../firebase";
import { Label } from "@/components/ui/label";
import { timezones } from "@/constants/data";

export default function ProfileView() {
  const { authUser } = useFirebaseAuth();
  const [userTimezone, setUserTimezone] = useState("");
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (authUser) {
        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserTimezone(userData.timezone || "");
          setProfileData({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || "",
          });
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

  return (
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
  );
}
