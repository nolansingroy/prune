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
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { EventInput } from "@/interfaces/types";
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
      start: event.start ? Timestamp.fromDate(new Date(event.start)) : null, // Convert to Timestamp
      end: event.end ? Timestamp.fromDate(new Date(event.end)) : null, // Convert to Timestamp
      description: event.description,
      display: event.display,
      className: event.className,
      isBackgroundEvent: event.isBackgroundEvent,
      startDate: event.startDate
        ? Timestamp.fromDate(new Date(event.startDate))
        : null, // Convert to Timestamp
      startDay: event.startDay,
      endDate: event.endDate
        ? Timestamp.fromDate(new Date(event.endDate))
        : null, // Convert to Timestamp
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
    const startUTC = (data.start as Timestamp)?.toDate();
    const endUTC = (data.end as Timestamp)?.toDate();

    // Convert UTC dates to local dates
    const startLocal = new Date(
      startUTC.getTime() + startUTC.getTimezoneOffset() * 60000
    );
    const endLocal = new Date(
      endUTC.getTime() + endUTC.getTimezoneOffset() * 60000
    );
    return {
      title: data.title || "",
      id: snapshot.id,
      type: data.type || "",
      typeId: data.typeId || "",
      fee: data.fee || 0,
      clientId: data.clientId || "",
      clientName: data.clientName || "",
      location: data.location || "",
      start: startLocal,
      end: endLocal,
      startDate: startLocal,
      startDay: startLocal.toLocaleDateString("en-US", {
        weekday: "long",
      }),
      endDate: endLocal,
      endDay: endLocal.toLocaleDateString("en-US", {
        weekday: "long",
      }),
      description: data.description || "",
      display: data.isBackgroundEvent ? "background" : "auto",
      isBackgroundEvent: !!data.isBackgroundEvent,
      className: data.isBackgroundEvent ? "fc-bg-event" : "",
      recurrence: data.recurrence,
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

/// Function to create an event
export async function createEvent(userId: string, event: EventInput) {
  const newEventRef = await addDoc(eventRef(userId), event);
  const eventId = newEventRef.id;
  await updateDoc(newEventRef, { id: eventId });
  return { ...event, id: eventId };
}

// Function to update an event
export async function updateEvent(
  userId: string,
  eventId: string,
  event: Partial<EventInput>
) {
  const eventDocRef = doc(db, "users", userId, "events", eventId).withConverter(
    eventConverter
  );
  await updateDoc(eventDocRef, event);
}
