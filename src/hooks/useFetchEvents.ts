import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../../firebase";
import {
  collection,
  query,
  getDocs,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { EventInput } from "../interfaces/types";
import { fetchFirestoreEvents } from "@/lib/converters/events";

const useFetchEvents = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [userStartTime, setUserStartTime] = useState("07:00:00");
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    const user = auth.currentUser;

    setIsLoading(true);
    const eventsData = await fetchFirestoreEvents(user);

    setEvents(eventsData);
    console.log("Events set to state:", eventsData);
    setIsLoading(false);
  }, []);

  const fetchUserStartTime = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserStartTime(userData.calendarStartTime || "07:00:00");
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchEvents();
        fetchUserStartTime();
      } else {
        console.warn("No authenticated user found.");
        setIsLoading(false);
      }
    });

    // Cleanup the subscription on component unmount
    return () => unsubscribe();
  }, [fetchEvents, fetchUserStartTime]);

  return {
    events,
    userStartTime,
    isLoading,
    fetchEvents,
    fetchUserStartTime,
    setIsLoading,
  };
};

export default useFetchEvents;
