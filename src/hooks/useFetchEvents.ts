import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../../firebase";
import { collection, query, getDocs, Timestamp } from "firebase/firestore";
import { EventInput } from "../interfaces/types";

const useFetchEvents = () => {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    const user = auth.currentUser;

    if (!user) {
      console.warn("No authenticated user found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("Fetching events...");
    const q = query(collection(db, "users", user.uid, "events"));
    const querySnapshot = await getDocs(q);
    console.log(
      `Retrieved ${querySnapshot.docs.length} documents from Firestore.`
    );
    const eventsData = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      // Convert Firestore Timestamps back to JS Dates
      const startDate =
        data.start instanceof Timestamp
          ? data.start.toDate()
          : new Date(data.start);
      const endDate =
        data.end instanceof Timestamp ? data.end.toDate() : new Date(data.end);

      // Derive the day of the week in UTC
      const startDay = startDate.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      });
      const endDay = endDate.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      });

      // Handle recurrence data only if it exists (RRULE commented out)
      // const recurrence = data.recurrence
      //   ? {
      //       daysOfWeek: data.recurrence.daysOfWeek || [],
      //       startTime: data.recurrence.startTime || "",
      //       endTime: data.recurrence.endTime || "",
      //       startRecur: data.recurrence.startRecur || "",
      //       endRecur: data.recurrence.endRecur || "",
      //       exdate: data.exceptions || [], // Convert exceptions to exdate
      //       rrule: data.recurrence.rrule || null,
      //     }
      //   : undefined;

      const event: EventInput = {
        id: doc.id,
        title: data.title || "No title", // Ensure a title is always present
        location: data.location || "", // Include location or an empty string
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
        recurrence: undefined, // Use undefined instead of null to match the expected type
        exdate: data.exceptions || [], // Convert exceptions to exdate
      };

      console.log("Processed event data:", event);

      return event;
    });

    // Update the event state with the processed data
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
