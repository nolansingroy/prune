// services/userService.ts
import { firestore, Timestamp } from "../../firebase";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  DocumentReference,
  serverTimestamp,
} from "firebase/firestore";

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

interface Event {
  title: string;
  start: Timestamp;
  end: Timestamp;
  description?: string;
  isBackgroundEvent: boolean;
}

const usersCollection = collection(firestore, "users");

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

// Create a new event document in the database

const getEventsCollection = (uid: string) =>
  collection(doc(usersCollection, uid), "events");

export const createEvent = async (uid: string, event: Event): Promise<void> => {
  await addDoc(getEventsCollection(uid), {
    ...event,
    creationTime: serverTimestamp() as unknown as Timestamp,
    updated_at: serverTimestamp() as unknown as Timestamp,
  });
};

export const updateEvent = async (
  uid: string,
  eventId: string,
  event: Partial<Event>
): Promise<void> => {
  console.log(
    `Updating event ${eventId} for user ${uid} in document path users/${uid}/events/${eventId}`
  );
  await updateDoc(doc(getEventsCollection(uid), eventId), {
    ...event,
    updated_at: serverTimestamp(),
  });
};
