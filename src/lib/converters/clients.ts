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
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Client } from "@/interfaces/clients"; // Adjust the import path as needed

// Client converter
const clientConverter: FirestoreDataConverter<Client> = {
  toFirestore(client: Client): DocumentData {
    const { docId, ...data } = client;
    return {
      ...data,
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
      status: data.status,
      fullName: data.fullName,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      created_at: data.created_at,
      updated_at: data.updated_at,
      sms: data.sms,
      clientOptOff: data.clientOptOff || false,
      intPhoneNumber: data.intPhoneNumber,
      userSMSLink: data.userSMSLink || "",
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
    return clientsData;
  } catch (error) {
    return [];
  }
}

// fetch a single booking type
export async function fetchClient(
  uid: string,
  id: string
): Promise<Client | undefined> {
  const clientRef = doc(clientsRef(uid), id);
  const clientSnapshot = await getDoc(clientRef);
  if (clientSnapshot.exists()) {
    return clientSnapshot.data();
  }
}

// Function to add a client to Firestore
export async function addClient(
  uid: string,
  client: Client,
  generateLink: boolean
) {
  const newClient = {
    ...client,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    sms: false,
    clientOptOff: false,
  };
  const newClientRef = await addDoc(clientsRef(uid), newClient);
  const clientId = newClientRef.id;
  const userSMSLink = generateLink
    ? `${window.location.origin}/sms?user=${uid}&&client=${clientId}`
    : "";
  await updateDoc(newClientRef, {
    docId: clientId,
    userSMSLink,
    updated_at: Timestamp.now().toDate(),
  });
  return { ...newClient, docId: clientId, userSMSLink };
}

// Function to update a client in Firestore
export async function updateClient(
  uid: string,
  client: Client,
  generateLink: boolean
): Promise<void> {
  const clientRef = doc(clientsRef(uid), client.docId);
  const userSMSLink = generateLink
    ? `${window.location.origin}/sms?user=${uid}&&client=${client.docId}`
    : "";
  const updatedClient = {
    ...client,
    updated_at: serverTimestamp(),
    userSMSLink,
  };
  await updateDoc(clientRef, updatedClient);
}

// Function to delete a client from Firestore
export async function deleteClient(uid: string, id: string): Promise<void> {
  const clientRef = doc(clientsRef(uid), id);
  await deleteDoc(clientRef);
}
