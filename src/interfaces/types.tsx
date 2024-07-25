export interface EventInput {
  id?: string;
  title: string;
  start: Date; // FullCalendar uses JavaScript Date objects.
  end: Date;
  description?: string;
  display?: string;
  className?: string;
  isBackgroundEvent: boolean;
}
