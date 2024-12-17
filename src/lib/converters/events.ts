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
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { EventInput } from "@/interfaces/event";
import { fetchBookingType } from "./bookingTypes";

// Event converter
const eventConverter: FirestoreDataConverter<EventInput> = {
  toFirestore(event: Omit<EventInput, "id">): DocumentData {
    const firestoreEvent: DocumentData = {
      title: event.title || "",
      coachId: event.coachId || "",
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
      created_at: event.created_at
        ? Timestamp.fromDate(new Date(event.created_at))
        : null,
      updated_at: event.updated_at
        ? Timestamp.fromDate(new Date(event.updated_at))
        : null,
    };

    if (!event.isBackgroundEvent) {
      firestoreEvent.type = event.type || "";
      firestoreEvent.typeId = event.typeId || "";
      firestoreEvent.fee = event.fee || 0;
      firestoreEvent.clientId = event.clientId || "";
      firestoreEvent.clientName = event.clientName || "";
      firestoreEvent.paid = event.paid || false;
      firestoreEvent.client = event.client || {};

      if (event.start) {
        const startDate = new Date(event.start);
        startDate.setDate(startDate.getDate() - 1); // Set to the day before
        startDate.setHours(8, 0, 0, 0); // Set time to 8:00 AM
        firestoreEvent.reminderDateTime = Timestamp.fromDate(startDate);
        firestoreEvent.reminderSent = false;
      } else {
        firestoreEvent.reminderDateTime = null;
      }
    }

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
      client: data.client || undefined,
      clientId: data.clientId || "",
      clientName: data.clientName || "",
      coachId: data.coachId || "",
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
      reminderDateTime: data.reminderDateTime
        ? (data.reminderDateTime as Timestamp)?.toDate()
        : undefined,
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
    // console.warn("No authenticated user UID provided.");
    return [];
  }

  // console.log("Fetching events...");
  const q = query(eventRef(userUid.uid));
  const querySnapshot = await getDocs(q);
  // console.log(
  //   `Retrieved ${querySnapshot.docs.length} documents from Firestore.`
  // );

  const checktimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // console.log("Timezone: ", checktimezone);

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

  // console.log("Events fetched:", eventsData);
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

  // console.log("Updating Firestore with:", { userId, eventId, event });

  await updateDoc(eventDocRef, updatedEvent);
}

// Function to fetch events from today onwards
export const fetchBookingsListviewEvents = async (
  userId: string
): Promise<EventInput[]> => {
  if (!userId) {
    // console.warn("No user ID provided.");
    return [];
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight to match the start of the day

  // Fetch events by "start" field where the date is from today onwards
  const q = query(
    eventRef(userId),
    where("isBackgroundEvent", "==", false),
    // where("start", ">=", today), // Fetch events starting from today onwards
    orderBy("start", "asc") // Ascending order
  );

  const querySnapshot = await getDocs(q);
  let eventsList: EventInput[] = [];

  querySnapshot.docs.forEach((doc) => {
    const data = doc.data();
    // console.log("Event data:", data);
    const start =
      data.start instanceof Timestamp
        ? data.start.toDate()
        : new Date(data.start);
    const end =
      data.end instanceof Timestamp ? data.end.toDate() : new Date(data.end);

    if (data.recurrence) {
      const dtstart = new Date(start);
      eventsList.push({
        id: doc.id,
        title: data.title,
        type: data.type,
        typeId: data.typeId,
        fee: data.fee,
        client: data.client,
        clientId: data.clientId,
        clientName: data.clientName,
        coachId: data.coachId || "",
        start: dtstart,
        end: new Date(dtstart.getTime() + (end.getTime() - start.getTime())), // Calculate end time based on duration
        description: data.description || "",
        isBackgroundEvent: data.isBackgroundEvent,
        startDate: dtstart,
        startDay: dtstart.toLocaleDateString("en-US", { weekday: "long" }),
        endDate: new Date(
          dtstart.getTime() + (end.getTime() - start.getTime())
        ),
        endDay: new Date(
          dtstart.getTime() + (end.getTime() - start.getTime())
        ).toLocaleDateString("en-US", { weekday: "long" }),
        paid: data.paid,
        recurrence: data.recurrence,
        exceptions: data.exceptions,
      });
    } else {
      eventsList.push({
        id: doc.id,
        title: data.title,
        type: data.type,
        typeId: data.typeId,
        fee: data.fee,
        client: data.client,
        clientId: data.clientId,
        clientName: data.clientName,
        coachId: data.coachId || "",
        start: start,
        end: end,
        description: data.description || "",
        isBackgroundEvent: data.isBackgroundEvent,
        startDate: start,
        startDay: start.toLocaleDateString("en-US", { weekday: "long" }),
        endDate: end,
        endDay: end.toLocaleDateString("en-US", { weekday: "long" }),
        paid: data.paid,
      });
    }
  });
  return eventsList;
};

// Function to fetch availabilities from today onwards
export const fetchAvailabilitiesListviewEvents = async (
  userId: string
): Promise<Omit<EventInput, "fee">[]> => {
  if (!userId) {
    // console.warn("No user ID provided.");
    return [];
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight to match the start of the day

  // Fetch events by "start" field where the date is from today onwards
  const q = query(
    eventRef(userId),
    where("isBackgroundEvent", "==", true),
    where("start", ">=", today), // Fetch events starting from today onwards
    orderBy("start", "asc") // Ascending order
  );

  const querySnapshot = await getDocs(q);
  let eventsList: Omit<EventInput, "fee">[] = [];

  querySnapshot.docs.forEach((doc) => {
    const data = doc.data();
    // console.log("Event data:", data);
    const start =
      data.start instanceof Timestamp
        ? data.start.toDate()
        : new Date(data.start);
    const end =
      data.end instanceof Timestamp ? data.end.toDate() : new Date(data.end);

    if (data.recurrence) {
      const dtstart = new Date(start);
      eventsList.push({
        id: doc.id,
        title: data.title,
        type: data.type || "",
        typeId: data.typeId || "",
        clientId: data.clientId || "",
        clientName: data.clientName || "",
        coachId: data.coachId || "",
        start: dtstart,
        end: new Date(dtstart.getTime() + (end.getTime() - start.getTime())), // Calculate end time based on duration
        description: data.description || "",
        isBackgroundEvent: data.isBackgroundEvent,
        startDate: dtstart,
        startDay: dtstart.toLocaleDateString("en-US", { weekday: "long" }),
        endDate: new Date(
          dtstart.getTime() + (end.getTime() - start.getTime())
        ),
        endDay: new Date(
          dtstart.getTime() + (end.getTime() - start.getTime())
        ).toLocaleDateString("en-US", { weekday: "long" }),
        recurrence: data.recurrence,
        exceptions: data.exceptions,
      });
    } else {
      eventsList.push({
        id: doc.id,
        title: data.title,
        type: data.type || "",
        typeId: data.typeId || "",
        clientId: data.clientId || "",
        clientName: data.clientName || "",
        coachId: data.coachId || "",
        start: start,
        end: end,
        description: data.description || "",
        isBackgroundEvent: data.isBackgroundEvent,
        startDate: start,
        startDay: start.toLocaleDateString("en-US", { weekday: "long" }),
        endDate: end,
        endDay: end.toLocaleDateString("en-US", { weekday: "long" }),
      });
    }
  });
  return eventsList;
};

// Function to delete batch events
export async function deleteEvents(userId: string, eventIds: string[]) {
  const batch = writeBatch(db);
  eventIds.forEach((eventId) => {
    const eventDocRef = doc(
      db,
      "users",
      userId,
      "events",
      eventId
    ).withConverter(eventConverter);
    batch.delete(eventDocRef);
  });
  await batch.commit();
}
