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
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { BookingTypes } from "@/interfaces/bookingTypes";

// BookingTypes converter

const bookingTypesConverter: FirestoreDataConverter<BookingTypes> = {
  toFirestore(bookingType: Omit<BookingTypes, "id">): DocumentData {
    return {
      name: bookingType.name,
      duration: bookingType.duration,
      fee: bookingType.fee,
      color: bookingType.color,
      created_at: bookingType.created_at || Timestamp.now(),
      updated_at: Timestamp.now(), // Always update the updated_at field
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options: SnapshotOptions
  ): BookingTypes {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      name: data.name || "No name",
      duration: data.duration || 30,
      fee: data.fee || 0,
      color: data.color || "#000000",
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },
};

// Reference to the user's booking types collection
const bookingTypesRef = (uid: string) =>
  collection(db, `users/${uid}/bookingTypes`).withConverter(
    bookingTypesConverter
  );

// Function to fetch booking types
export async function fetchBookingTypes(user: string): Promise<BookingTypes[]> {
  const q = query(bookingTypesRef(user));
  const querySnapshot = await getDocs(q);

  const bookingTypesData = querySnapshot.docs.map((doc) => doc.data());

  console.log("Booking types from firebase:", bookingTypesData);

  return bookingTypesData;
}

// Function to add a booking type to Firestore
export async function addBookingType(
  uid: string,
  bookingType: Omit<BookingTypes, "id">
): Promise<void> {
  const newBookingType = {
    ...bookingType,
    created_at: serverTimestamp(), // Add a timestamp field
    updated_at: serverTimestamp(), // Add a timestamp field
  };
  await addDoc(bookingTypesRef(uid), newBookingType);
}

// Function to update a booking type in Firestore
export async function updateBookingType(
  uid: string,
  bookingType: BookingTypes
): Promise<void> {
  const bookingTypeRef = doc(bookingTypesRef(uid), bookingType.id);
  await updateDoc(bookingTypeRef, bookingType);
}

// Function to delete a booking type from Firestore
export async function deleteBookingType(
  uid: string,
  id: string
): Promise<void> {
  const bookingTypeRef = doc(bookingTypesRef(uid), id);
  await deleteDoc(bookingTypeRef);
}
