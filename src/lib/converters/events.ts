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
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { EventInput } from "@/interfaces/types";
import { fetchBookingType } from "./bookingTypes";

// Event converter
const eventConverter: FirestoreDataConverter<EventInput> = {
  toFirestore(event: Omit<EventInput, "id">): DocumentData {
    const firestoreEvent: DocumentData = {
      title: event.title || "",
      type: event.type || "",
      typeId: event.typeId || "",
      location: event.location || "",
      fee: event.fee || 0,
      clientId: event.clientId || "",
      clientName: event.clientName || "",
      start: event.start ? Timestamp.fromDate(new Date(event.start)) : null,
      end: event.end ? Timestamp.fromDate(new Date(event.end)) : null,
      description: event.description || "",
      display: event.display || "",
      className: event.className || "",
      isBackgroundEvent: event.isBackgroundEvent,
      startDate: event.startDate
        ? Timestamp.fromDate(new Date(event.startDate))
        : null,
      startDay: event.startDay,
      endDate: event.endDate
        ? Timestamp.fromDate(new Date(event.endDate))
        : null,
      endDay: event.endDay,
      exceptions: event.exceptions || [],
      exdate: event.exdate || [],
      originalEventId: event.originalEventId || "",
      isInstance: event.isInstance || false,
      instanceMap: event.instanceMap || {},
      paid: event.paid || false,
      created_at: event.created_at
        ? Timestamp.fromDate(new Date(event.created_at))
        : null,
      updated_at: event.updated_at
        ? Timestamp.fromDate(new Date(event.updated_at))
        : null,
    };

    if (event.recurrence) {
      firestoreEvent.recurrence = event.recurrence;
    }

    return firestoreEvent;
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
      start: (data.start as Timestamp)?.toDate(),
      end: (data.end as Timestamp)?.toDate(),
      startDate: (data.start as Timestamp)?.toDate(),
      startDay: (data.start as Timestamp)
        ?.toDate()
        .toLocaleDateString("en-US", {
          weekday: "long",
        }),
      endDate: (data.end as Timestamp)?.toDate(),
      endDay: (data.end as Timestamp)?.toDate().toLocaleDateString("en-US", {
        weekday: "long",
      }),
      description: data.description || "",
      display: data.isBackgroundEvent ? "inverse-background" : "auto",
      isBackgroundEvent: !!data.isBackgroundEvent,
      className: data.isBackgroundEvent ? "" : "",
      recurrence: data.recurrence || undefined, // in nolan's code it was undefined
      exdate: data.exceptions || [],
      paid: data.paid,
      originalEventId: data.originalEventId || "",
      created_at: (data.created_at as Timestamp)?.toDate(),
      updated_at: (data.updated_at as Timestamp)?.toDate(),
      // exceptions: data.exceptions,

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
export async function fetchFirestoreEvents(
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

/// Function to create an event
export async function createFireStoreEvent(userId: string, event: EventInput) {
  const newEvent = {
    ...event,
    created_at: Timestamp.now().toDate(),
    updated_at: Timestamp.now().toDate(),
  };

  const newEventRef = await addDoc(eventRef(userId), newEvent);
  const eventId = newEventRef.id;
  await updateDoc(newEventRef, {
    id: eventId,
    updated_at: Timestamp.now().toDate(),
  });
  return { ...newEvent, id: eventId };
}

// Function to update an event by ID
export async function updateFireStoreEvent(
  userId: string,
  eventId: string,
  event: Partial<EventInput>
) {
  const eventDocRef = doc(db, "users", userId, "events", eventId).withConverter(
    eventConverter
  );
  const updatedEvent = {
    ...event,
    updated_at: Timestamp.now().toDate(),
  };

  await updateDoc(eventDocRef, updatedEvent);
}
