import { Timestamp } from "firebase/firestore";

export interface EventInput {
  id?: string;
  title: string;
  location?: string;
  start: Date; // Use JavaScript Date object
  end: Date; // Use JavaScript Date object
  description?: string;
  display?: string;
  className?: string;
  isBackgroundEvent: boolean;
  startDate: Timestamp; // Firestore Timestamp
  startDay: string; // Day of the week derived from startDate
  endDate: Timestamp; // Firestore Timestamp
  endDay: string; // Day of the week derived from endDate
  recurrence?: {
    daysOfWeek?: number[];
    startTime?: string;
    endTime?: string;
    startRecur?: string;
    endRecur?: string;
    rrule?: any;
  };
}
