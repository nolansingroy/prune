import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { EventInput } from "../interfaces/types";

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

          // Assuming start and end are stored as UTC Date objects
          const startDate = new Date(data.start); // This will be UTC
          const endDate = new Date(data.end); // This will be UTC

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

          // Handle recurrence
          if (data.recurrence) {
            let recurrenceStartDate = new Date(data.recurrence.startRecur);
            let recurrenceEndDate = new Date(data.recurrence.endRecur);

            // Check if the dates are valid
            if (isNaN(recurrenceStartDate.getTime())) {
              recurrenceStartDate = new Date(); // Fallback to current date or handle appropriately
            }
            if (isNaN(recurrenceEndDate.getTime())) {
              recurrenceEndDate = recurrenceStartDate; // Fallback to startDate or handle appropriately
            }

            let startHour = 0,
              startMinute = 0,
              endHour = 0,
              endMinute = 0;

            // Check if startTime and endTime exist before splitting
            if (data.recurrence.startTime && data.recurrence.endTime) {
              [startHour, startMinute] = data.recurrence.startTime
                .split(":")
                .map(Number);
              [endHour, endMinute] = data.recurrence.endTime
                .split(":")
                .map(Number);
            }

            recurrenceStartDate.setUTCHours(startHour, startMinute, 0, 0);
            recurrenceEndDate.setUTCHours(endHour, endMinute, 0, 0);

            event.recurrence = {
              daysOfWeek: data.recurrence.daysOfWeek,
              startTime: data.recurrence.startTime,
              endTime: data.recurrence.endTime,
              startRecur: recurrenceStartDate.toISOString(),
              endRecur: recurrenceEndDate.toISOString(),
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
