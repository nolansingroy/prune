import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../../firebase";
import { collection, query, getDocs, Timestamp } from "firebase/firestore";
import { EventInput } from "../interfaces/types";
import { fetchFirestoreEvents } from "@/lib/converters/events";

const useFetchEvents = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    const user = auth.currentUser;

    setLoading(true);
    const eventsData = await fetchFirestoreEvents(user);

    setEvents(eventsData);
    console.log("Events set to state:", eventsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchEvents();
      } else {
        console.warn("No authenticated user found.");
        setLoading(false);
      }
    });

    // Cleanup the subscription on component unmount
    return () => unsubscribe();
  }, [fetchEvents]);

  return { events, loading, fetchEvents };
};

export default useFetchEvents;
