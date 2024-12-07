import { db } from "../../../firebase";
import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData,
  serverTimestamp,
  addDoc,
  collection,
} from "firebase/firestore";
import { Signups } from "@/interfaces/signups"; // Adjust the import path as needed

// Signups converter
const signupsConverter: FirestoreDataConverter<Signups> = {
  toFirestore(signup: Signups): DocumentData {
    return {
      uid: signup.uid,
      firstName: signup.firstName,
      lastName: signup.lastName,
      email: signup.email,
      createdAt: signup.createdAt || serverTimestamp(),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options: SnapshotOptions
  ): Signups {
    const data = snapshot.data(options);
    return {
      uid: data.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      createdAt: data.createdAt,
    };
  },
};

// Function to add a signup document
export async function addToSignups(
  uid: string,
  firstName: string,
  lastName: string,
  email: string
): Promise<void> {
  const newSignup = {
    uid,
    firstName,
    lastName,
    email,
    createdAt: serverTimestamp(),
  };
  const d = await addDoc(
    collection(db, "signups").withConverter(signupsConverter),
    newSignup
  );
  console.log("Document written with ID: ", d.id);
}
