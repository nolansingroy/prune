// types/client.ts (or interfaces/client.ts)

import { Timestamp } from "firebase/firestore";

// Define the Client interface
export interface Client {
  // stripeId: string;
  // active: boolean;
  // deprecated: boolean;
  // defaultRate?: number | null;
  docId?: string;
  status: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  intPhoneNumber: string;
  email: string;
  clientOptOff?: boolean;
  sms: boolean;
  userSMSLink?: string;
  created_at?: Timestamp;
  updated_at?: Timestamp;
  generateLink?: boolean;
}
