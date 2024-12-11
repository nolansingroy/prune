// types/client.ts (or interfaces/client.ts)

import { Timestamp } from "firebase/firestore";

// Define the Client interface
export interface Client {
  docId?: string;
  // stripeId: string;
  status: string;
  // active: boolean;
  // deprecated: boolean;
  // defaultRate?: number | null;
  firstName: string;
  lastName: string;
  phoneNumber: string; // Optional phone number
  intPhoneNumber: string;
  email: string; // Optional email
  clientOptOff?: boolean;
  sms: boolean;
  created_at?: Timestamp; // Firestore timestamp
  updated_at?: Timestamp; // Firestore timestamp
}
