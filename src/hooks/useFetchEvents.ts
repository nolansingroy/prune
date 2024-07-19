// hooks/useFetchEvents.ts

import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { collection, query, getDocs } from "firebase/firestore";
import type { EventInput } from "@fullcalendar/core"; // or from "@fullcalendar/react"

const useFetchEvents = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const user = auth.currentUser;
      if (user) {
        const q = query(collection(db, "users", user.uid, "events"));
        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            start: data.start.toDate(), // Convert Firestore Timestamp to Date
            end: data.end.toDate(), // Convert Firestore Timestamp to Date
            description: data.description,
            display: data.isBackgroundEvent ? "background" : "auto",
            className: data.isBackgroundEvent ? "fc-bg-event" : "",
          };
        });
        setEvents(eventsData);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  return { events, loading };
};

export default useFetchEvents;
