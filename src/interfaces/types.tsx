// export interface EventInput {
//   id?: string;
//   title: string;
//   start: Date; // FullCalendar uses JavaScript Date objects.
//   end: Date;
//   description?: string;
//   display?: string;
//   className?: string;
//   isBackgroundEvent: boolean;
// }

export interface EventInput {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  display?: string;
  className?: string;
  isBackgroundEvent: boolean;
  recurrence?: {
    daysOfWeek?: number[];
    startTime?: string;
    endTime?: string;
    startRecur?: string;
    endRecur?: string;
    rrule?: any;
  };
}
