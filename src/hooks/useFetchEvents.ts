import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { EventInput } from "../pages/types"; // Ensure correct import path

const useFetchEvents = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const user = auth.currentUser;
      if (user) {
        console.log("Fetching events...");
        const q = query(collection(db, "users", user.uid, "events"));
        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "No title", // Ensure a title is always present
            start: data.start.toDate(), // Convert Firestore Timestamp to Date
            end: data.end?.toDate() || data.start.toDate(), // Provide a default or use the start date
            description: data.description || "", // Include description or a default
            display: data.isBackgroundEvent ? "background" : "auto", // Display as background if specified
            isBackgroundEvent: !!data.isBackgroundEvent, // Ensure this is a boolean
            className: data.isBackgroundEvent ? "fc-bg-event" : "", // Additional class based on condition
          };
        });
        setEvents(eventsData); // Set the events
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  return { events, loading };
};

export default useFetchEvents;
