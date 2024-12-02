import { Timestamp } from "firebase/firestore";

export type BookingTypes = {
  docId?: string; // Make docId optional
  name: string;
  // duration: number;
  fee: number | undefined;
  color: string;
  created_at?: Timestamp; // Firestore timestamp
  updated_at?: Timestamp; // Firestore timestamp
};
