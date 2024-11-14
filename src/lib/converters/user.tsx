import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { User } from "@/interfaces/user";

const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    const { uid, ...data } = user;
    return {
      ...data,
      creationTime: user.creationTime || new Date(),
      updated_at: new Date(),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): User {
    const data = snapshot.data(options)!;
    return {
      uid: snapshot.id,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      timezone: data.timezone || "",
      calendarStartTime: data.calendarStartTime || "07:00:00",
      contactPreference: data.contactPreference || "",
      creationTime: data.creationTime.toDate(),
      displayName: data.displayName || "",
      emailVerified: data.emailVerified || false,
      loginType: data.loginType || "",
      photoURL: data.photoURL || "",
      role: data.role || "",
      updated_at: data.updated_at.toDate(),
    };
  },
};

// Reference to the user document
const userRef = (uid: string) =>
  doc(db, `users/${uid}`).withConverter(userConverter);

export async function fetchUser(uid: string): Promise<User | undefined> {
  const userSnapshot = await getDoc(userRef(uid));
  if (userSnapshot.exists()) {
    return userSnapshot.data();
  }
  return undefined;
}

export async function updateUserData(
  uid: string,
  data: Partial<User>
): Promise<void> {
  const userDocRef = userRef(uid);
  await updateDoc(userDocRef, {
    ...data,
    updated_at: new Date(),
  });
}
