import { db, User } from "../../../firebase";
import {
  collection,
  query,
  getDocs,
  Timestamp,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData,
} from "firebase/firestore";
import { EventInput } from "@/interfaces/types";

// Event converter
const eventConverter: FirestoreDataConverter<EventInput> = {
  toFirestore(event: Omit<EventInput, "id">): DocumentData {
    return {
      title: event.title,
      location: event.location,
      start: event.start, // Store as Timestamp
      end: event.end, // Store as Timestamp
      description: event.description,
      display: event.display,
      className: event.className,
      isBackgroundEvent: event.isBackgroundEvent,
      startDate: event.startDate, // Store as Timestamp
      startDay: event.startDay,
      endDate: event.endDate, // Store as Timestamp
      endDay: event.endDay,
      recurrence: event.recurrence,
      exceptions: event.exceptions,
      exdate: event.exdate,
      originalEventId: event.originalEventId,
      isInstance: event.isInstance,
      instanceMap: event.instanceMap,
      paid: event.paid,
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options: SnapshotOptions
  ): EventInput {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      title: data.title || "No title",
      location: data.location || "",
      start: (data.start as Timestamp).toDate(),
      end: (data.end as Timestamp).toDate(),
      startDate: (data.start as Timestamp).toDate(),
      startDay: (data.start as Timestamp).toDate().toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      }),
      endDate: (data.end as Timestamp).toDate(),
      endDay: (data.end as Timestamp).toDate().toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
      }),
      description: data.description || "",
      display: data.isBackgroundEvent ? "background" : "auto",
      isBackgroundEvent: !!data.isBackgroundEvent,
      className: data.isBackgroundEvent ? "fc-bg-event" : "",
      recurrence: data.recurrence, // in nolan's code it was undefined
      exdate: data.exceptions || [],
      // exceptions: data.exceptions,
      // originalEventId: data.originalEventId,
      // isInstance: data.isInstance,
      // instanceMap: data.instanceMap,
      // paid: data.paid,
    };
  },
};

// Reference to the user's event collection
export const eventRef = (userId: string) =>
  collection(db, "users", userId, "events").withConverter(eventConverter);

// Server-side function to fetch events
export async function converterFetchEvents(
  userUid: User | null
): Promise<EventInput[]> {
  if (!userUid) {
    console.warn("No authenticated user UID provided.");
    return [];
  }

  console.log("Fetching events...");
  const q = query(eventRef(userUid.uid));
  const querySnapshot = await getDocs(q);
  console.log(
    `Retrieved ${querySnapshot.docs.length} documents from Firestore.`
  );

  const eventsData = querySnapshot.docs.map((doc) => doc.data());

  console.log("Events fetched:", eventsData);
  return eventsData;
}