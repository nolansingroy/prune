import { Timestamp } from "firebase/firestore";

export type BookingTypes = {
  id?: string; // Make id optional
  name: string;
  duration: number;
  fee: number;
  color: string;
  created_at?: Timestamp; // Firestore timestamp
  updated_at?: Timestamp; // Firestore timestamp
};
