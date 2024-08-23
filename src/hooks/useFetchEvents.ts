import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../../firebase";
import { collection, query, getDocs, Timestamp } from "firebase/firestore";
import { EventInput } from "../interfaces/types";

const useFetchEvents = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (user) {
      console.log("Fetching events...");
      const q = query(collection(db, "users", user.uid, "events"));
      const querySnapshot = await getDocs(q);
      console.log(
        `Retrieved ${querySnapshot.docs.length} documents from Firestore.`
      );
      const eventsData = querySnapshot.docs.map((doc) => {
        const data = doc.data();

        // Check the type of startDate, endDate, start, and end
        console.log("startDate type:", typeof data.startDate, data.startDate);
        console.log("endDate type:", typeof data.endDate, data.endDate);
        console.log("start type:", typeof data.start, data.start);
        console.log("end type:", typeof data.end, data.end);

        // Convert Firestore Timestamps back to JS Dates
        const startDate =
          data.start instanceof Timestamp
            ? data.start.toDate()
            : new Date(data.start);
        const endDate =
          data.end instanceof Timestamp
            ? data.end.toDate()
            : new Date(data.end);

        // Validate dates
        if (isNaN(startDate.getTime())) {
          console.error("Invalid start date for event:", doc.id, data.start);
        }
        if (isNaN(endDate.getTime())) {
          console.error("Invalid end date for event:", doc.id, data.end);
        }

        // Derive the day of the week in UTC
        const startDay = startDate.toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "UTC",
        });
        const endDay = endDate.toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "UTC",
        });

        const event: EventInput = {
          id: doc.id,
          title: data.title || "No title", // Ensure a title is always present
          start: startDate, // Use the UTC Date
          end: endDate, // Use the UTC Date
          startDate: startDate, // Store as UTC Date
          startDay: startDay, // Day of the week derived from startDate
          endDate: endDate, // Store as UTC Date
          endDay: endDay, // Day of the week derived from endDate
          description: data.description || "", // Include description or a default
          display: data.isBackgroundEvent ? "background" : "auto", // Display as background if specified
          isBackgroundEvent: !!data.isBackgroundEvent, // Ensure this is a boolean
          className: data.isBackgroundEvent ? "fc-bg-event" : "", // Additional class based on condition
        };

        console.log("Processed event data:", event);

        return event;
      });
      setEvents(eventsData); // Set the events
      console.log("Events set to state:", eventsData);
    } else {
      console.warn("No authenticated user found.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, fetchEvents };
};

export default useFetchEvents;
