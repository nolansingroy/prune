import { Timestamp } from "firebase/firestore";
import { z } from "zod";

export const calendarFormValidationsSchema = z.object({
  title: z.string().nonempty(),
  location: z.string().nonempty(),
  start: z.instanceof(Timestamp),
  end: z.instanceof(Timestamp),
  description: z.string().nonempty(),
  display: z.string().nonempty(),
  className: z.string().nonempty(),
  isBackgroundEvent: z.boolean(),
  startDate: z.instanceof(Timestamp),
  startDay: z.string().nonempty(),
  endDate: z.instanceof(Timestamp),
  endDay: z.string().nonempty(),
  recurrence: z.string().nonempty(),
  exceptions: z.string().nonempty(),
  exdate: z.string().nonempty(),
  originalEventId: z.string().nonempty(),
  isInstance: z.boolean(),
  instanceMap: z.string().nonempty(),
  paid: z.boolean(),
  eventType: z.string().nonempty(),
});

export type TCalendarFormValidations = z.infer<
  typeof calendarFormValidationsSchema
>;
