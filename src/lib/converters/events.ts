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
import { title } from "process";
import { fetchBookingType } from "./bookingTypes";

// Event converter
const eventConverter: FirestoreDataConverter<EventInput> = {
  toFirestore(event: Omit<EventInput, "id">): DocumentData {
    return {
      title: event.title,
      type: event.type,
      typeId: event.typeId,
      location: event.location,
      fee: event.fee,
      clientId: event.clientId,
      clientName: event.clientName,
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
      title: data.title || "",
      id: snapshot.id,
      type: data.type || "",
      typeId: data.typeId || "",
      fee: data.fee || 0,
      clientId: data.clientId || "",
      clientName: data.clientName || "",
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
      paid: data.paid,
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

// Function to fetch events
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

  const eventsData = await Promise.all(
    querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      let color = "";

      if (data.typeId) {
        const bookingType = await fetchBookingType(userUid.uid, data.typeId);
        if (bookingType) {
          color = bookingType.color;
        }
      }

      return {
        ...data,
        color,
      };
    })
  );

  console.log("Events fetched:", eventsData);
  return eventsData;
}
