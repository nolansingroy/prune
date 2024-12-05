// types/client.ts (or interfaces/client.ts)

import { Timestamp } from "firebase/firestore";

// Define the Client interface
export interface Signups {
  uid: string;
  firstName: string;
  lastName: string;
  email: string; // Optional email
  createdAt: Timestamp; // Firestore timestamp
}
