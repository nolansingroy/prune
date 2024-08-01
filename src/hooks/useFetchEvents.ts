import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { EventInput } from "../interfaces/types"; // Ensure correct import path

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
          const event: EventInput = {
            id: doc.id,
            title: data.title || "No title", // Ensure a title is always present
            start: data.start.toDate(), // Convert Firestore Timestamp to Date
            end: data.end?.toDate() || data.start.toDate(), // Provide a default or use the start date
            description: data.description || "", // Include description or a default
            display: data.isBackgroundEvent ? "background" : "auto", // Display as background if specified
            isBackgroundEvent: !!data.isBackgroundEvent, // Ensure this is a boolean
            className: data.isBackgroundEvent ? "fc-bg-event" : "", // Additional class based on condition
          };

          // Handle recurrence
          if (data.recurrence) {
            const startDate = new Date(data.recurrence.startRecur);
            const endDate = new Date(data.recurrence.endRecur);

            const [startHour, startMinute] = data.recurrence.startTime
              .split(":")
              .map(Number);
            const [endHour, endMinute] = data.recurrence.endTime
              .split(":")
              .map(Number);

            startDate.setHours(startHour, startMinute, 0, 0);
            endDate.setHours(endHour, endMinute, 0, 0);

            event.recurrence = {
              daysOfWeek: data.recurrence.daysOfWeek,
              startTime: data.recurrence.startTime,
              endTime: data.recurrence.endTime,
              startRecur: startDate.toISOString(),
              endRecur: endDate.toISOString(),
              rrule: data.recurrence.rrule,
            };
          }

          return event;
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
