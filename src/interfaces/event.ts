export interface EventInput {
  color?: any;
  id?: string;
  title: string;
  type?: string;
  typeId?: string;
  clientId?: string; // Add a clientId property to the event
  clientName?: string; // Add a clientName property to the event
  clientPhone?: string;
  coachId?: string;
  // location?: string;
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
  fee?: number; // Add a fee property to the event
  recurrence?: {
    daysOfWeek?: number[];
    startTime?: string;
    endTime?: string;
    startRecur?: string;
    endRecur?: string;
    exdate?: string[];
    rrule?: string; // Add the rrule property here
  };
  exceptions?: string[]; // used in availability logic to exclude dates from the list
  exdate?: string[]; // Convert exceptions to exdate for FullCalendar RRule to work

  originalEventId?: string; // Reference to the original recurring event
  isInstance?: boolean; // Flag to indicate if this is an instance of a recurring event
  _def?: {
    extendedProps?: {
      originalEventId?: string;
    };
  };
  reminderDateTime?: Date;
  reminderSent?: boolean;
  // New field: Map for tracking references of instance documents
  instanceMap?: { [instanceDate: string]: string }; // Maps instance date to document ID
  paid?: boolean; // Flag to indicate if the event is paid
  created_at?: Date; // Add the created_at field
  updated_at?: Date;
}
