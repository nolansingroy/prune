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
  startDate: Date; // Use JavaScript Date object as UTC
  startDay: string; // Day of the week derived from startDate
  endDate: Date; // Use JavaScript Date object as UTC
  endDay: string; // Day of the week derived from endDate
  recurrence?: {
    daysOfWeek?: number[];
    startTime?: string;
    endTime?: string;
    startRecur?: string;
    endRecur?: string;
    exdate?: string[];
    rrule?: any;
  };
  exceptions?: string[];
}
