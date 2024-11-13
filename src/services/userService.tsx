// import {
//   db,
//   Timestamp,
//   doc,
//   updateDoc,
//   serverTimestamp,
//   collection, // Importing the collection function
//   addDoc, // Importing the addDoc function
// } from "../../firebase";

// import {
//   getDoc,
//   setDoc,
//   deleteDoc,
//   DocumentReference,
// } from "firebase/firestore";

// interface EventInput {
//   id?: string;
//   title: string;
//   location?: string;
//   start: Date; // Use JavaScript Date object
//   end: Date; // Use JavaScript Date object
//   description?: string;
//   display?: string;
//   className?: string;
//   isBackgroundEvent: boolean;
//   startDate: Date; // Use JavaScript Date object as UTC
//   startDay: string; // Day of the week derived from startDate
//   endDate: Date; // Use JavaScript Date object as UTC
//   endDay: string; // Day of the week derived from endDate
//   recurrence?: {
//     daysOfWeek?: number[];
//     startTime?: string;
//     endTime?: string;
//     startRecur?: string;
//     endRecur?: string;
//     rrule?: any;
//   };
// }

// interface User {
//   uid: string;
//   displayName: string;
//   email: string;
//   emailVerified: boolean;
//   firstName: string;
//   lastName: string;
//   phoneNumber?: number;
//   photoURL?: string;
//   role: string;
//   loginType: string;
//   contactPreference: string;
//   creationTime: Timestamp;
//   updated_at: Timestamp;
// }

// // Utility function to convert Date to Firestore Timestamp
// const toFirestoreTimestamp = (date?: Date): Timestamp | undefined =>
//   date ? Timestamp.fromDate(date) : undefined;

// const usersCollection = collection(db, "users");

// const getUserDocRef = (uid: string): DocumentReference =>
//   doc(usersCollection, uid);

// export const getUser = async (uid: string): Promise<User | null> => {
//   const userDoc = await getDoc(getUserDocRef(uid));
//   return userDoc.exists() ? (userDoc.data() as User) : null;
// };

// // Create a new user document in the database
// export const createUser = async (user: User): Promise<void> => {
//   const userDocRef = getUserDocRef(user.uid);

//   await setDoc(userDocRef, {
//     ...user,
//     creationTime: serverTimestamp() as unknown as Timestamp,
//     updated_at: serverTimestamp() as unknown as Timestamp,
//   });

//   const eventsCollection = collection(userDocRef, "events");
//   await addDoc(eventsCollection, {}); // Create an empty document in the "events" subcollection
// };

// export const updateUser = async (
//   uid: string,
//   data: Partial<User>
// ): Promise<void> => {
//   await updateDoc(getUserDocRef(uid), data);
// };

// export const deleteUser = async (uid: string): Promise<void> => {
//   await deleteDoc(getUserDocRef(uid));
// };
// // TODO: Fix this function and update calendar and avialability to use it.
// // Update an existing event document in Firestore
// // export const updateEvent = async (
// //   uid: string,
// //   eventId: string,
// //   event: Partial<Event>
// // ): Promise<void> => {
// //   // Destructure and provide default values of undefined for start and end
// //   const { start, end, ...otherFields } = event;

// //   const eventDataToUpdate = {
// //     ...otherFields,
// //     start: start ? toFirestoreTimestamp(start) : undefined,
// //     end: end ? toFirestoreTimestamp(end) : undefined,
// //     updated_at: serverTimestamp(),
// //   };

// //   // Only include start and end if they exist
// //   if (!start) delete eventDataToUpdate.start;
// //   if (!end) delete eventDataToUpdate.end;

// //   await updateDoc(doc(db, "users", uid, "events", eventId), eventDataToUpdate);
// // };

// // Function to create a new event document in the database
// // Function to create a new event document in the database
// export const createEvent = async (
//   uid: string,
//   event: EventInput
// ): Promise<DocumentReference> => {
//   const eventsCollection = collection(db, "users", uid, "events");

//   const eventWithTimestamp = {
//     ...event,
//     start: toFirestoreTimestamp(event.start), // Convert start date
//     end: toFirestoreTimestamp(event.end), // Convert end date
//     startDate: toFirestoreTimestamp(event.startDate),
//     endDate: toFirestoreTimestamp(event.endDate),
//     creationTime: serverTimestamp(), // Use server timestamp for creation time
//     updated_at: serverTimestamp(), // Use server timestamp for updated time
//   };

//   // Return the DocumentReference to the newly created document
//   const docRef = await addDoc(eventsCollection, eventWithTimestamp);
//   console.log("Event created in Firestore with ID:", docRef.id);
//   return docRef;
// };
