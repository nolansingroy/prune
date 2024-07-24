import {
  db,
  Timestamp,
  doc,
  updateDoc,
  serverTimestamp,
  collection, // Importing the collection function
  addDoc, // Importing the addDoc function
} from "../../firebase";

import {
  getDoc,
  setDoc,
  deleteDoc,
  DocumentReference,
} from "firebase/firestore";

interface Event {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  isBackgroundEvent: boolean;
}

interface User {
  uid: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  phoneNumber?: number;
  photoURL?: string;
  role: string;
  loginType: string;
  contactPreference: string;
  creationTime: Timestamp;
  updated_at: Timestamp;
}

// Utility function to convert Date to Firestore Timestamp
const toFirestoreTimestamp = (date?: Date): Timestamp | undefined =>
  date ? Timestamp.fromDate(date) : undefined;

const usersCollection = collection(db, "users");

const getUserDocRef = (uid: string): DocumentReference =>
  doc(usersCollection, uid);

export const getUser = async (uid: string): Promise<User | null> => {
  const userDoc = await getDoc(getUserDocRef(uid));
  return userDoc.exists() ? (userDoc.data() as User) : null;
};

// Create a new user document in the database
export const createUser = async (user: User): Promise<void> => {
  await setDoc(getUserDocRef(user.uid), {
    ...user,
    creationTime: serverTimestamp() as unknown as Timestamp, // Set the creation time of the user document to the current server timestamp
    updated_at: serverTimestamp() as unknown as Timestamp, // Set the updated_at field of the user document to the current server timestamp
  });
};

export const updateUser = async (
  uid: string,
  data: Partial<User>
): Promise<void> => {
  await updateDoc(getUserDocRef(uid), data);
};

export const deleteUser = async (uid: string): Promise<void> => {
  await deleteDoc(getUserDocRef(uid));
};

// Update an existing event document in Firestore
export const updateEvent = async (
  uid: string,
  eventId: string,
  event: Partial<Event>
): Promise<void> => {
  const eventDataToUpdate = {
    ...event,
    start: toFirestoreTimestamp(event.start),
    end: toFirestoreTimestamp(event.end),
    updated_at: serverTimestamp(),
  };

  await updateDoc(doc(db, "users", uid, "events", eventId), eventDataToUpdate);
};

// Function to create a new event document in the database
export const createEvent = async (uid: string, event: Event): Promise<void> => {
  const eventsCollection = collection(db, "users", uid, "events");
  const eventWithTimestamp = {
    ...event,
    start: toFirestoreTimestamp(event.start), // Convert start date
    end: toFirestoreTimestamp(event.end), // Convert end date
    creationTime: serverTimestamp(), // Use server timestamp for creation time
    updated_at: serverTimestamp(), // Use server timestamp for updated time
  };

  await addDoc(eventsCollection, eventWithTimestamp);
  console.log("Event created in Firestore with ID:", eventWithTimestamp);
};
