// ProfilePage.tsx
"use client";
import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useFirebaseAuth } from "../services/authService";
import ProfileTabs from "./profileTabs/ProfileTabs"; // Import ProfileTabs
import { Client } from "@/interfaces/clients"; // Import the Client interface

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
  const [clients, setClients] = useState<Client[]>([]);

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

  if (!authUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Profile Settings</h1>
      <ProfileTabs
        userTimezone={userTimezone}
        handleTimezoneChange={handleTimezoneChange}
        profileData={profileData}
        bookingTypes={bookingTypes}
        bookingName={bookingName}
        setBookingName={setBookingName}
        bookingDuration={bookingDuration}
        setBookingDuration={setBookingDuration}
        handleAddBookingType={handleAddBookingType}
        clients={clients}
        authUser={authUser}
        setClients={setClients}
      />
    </div>
  );
};

export default ProfilePage;
