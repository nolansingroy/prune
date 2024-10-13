import { db } from "../../../firebase";
import {
  collection,
  query,
  getDocs,
  Timestamp,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { Client } from "@/interfaces/clients"; // Adjust the import path as needed

// Client converter
const clientConverter: FirestoreDataConverter<Client> = {
  toFirestore(client: Client): DocumentData {
    return {
      docId: client.docId,
      stripeId: client.stripeId,
      status: client.status,
      active: client.active,
      deprecated: client.deprecated,
      defaultRate: client.defaultRate,
      firstName: client.firstName,
      lastName: client.lastName,
      phoneNumber: client.phoneNumber,
      email: client.email,
      created_at: client.created_at || serverTimestamp(),
      updated_at: serverTimestamp(),
    };
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData>,
    options: SnapshotOptions
  ): Client {
    const data = snapshot.data(options);
    return {
      docId: snapshot.id,
      stripeId: data.stripeId,
      status: data.status,
      active: data.active,
      deprecated: data.deprecated,
      defaultRate: data.defaultRate,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },
};

// Reference to the user's clients collection
const clientsRef = (uid: string) =>
  collection(db, `users/${uid}/clients`).withConverter(clientConverter);

// Function to fetch clients
export async function fetchClients(uid: string): Promise<Client[]> {
  try {
    const q = query(clientsRef(uid), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);

    const clientsData = querySnapshot.docs.map((doc) => doc.data());

    console.log("Clients from firebase:", clientsData);

    return clientsData;
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}
