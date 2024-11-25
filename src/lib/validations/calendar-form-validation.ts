import { z } from "zod";

export const calendarFormSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date wrong format")
      .optional(),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Start time wrong format")
      .optional(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "End time wrong format")
      .optional(),
    startRecur: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start recurrence is required")
      .optional(),
    endRecur: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End recurrence wrong format")
      .optional(),
    type: z.string().optional(),
    typeId: z.string().optional(),
    clientName: z.string().optional(),
    clientId: z.string().optional(),
    paid: z.boolean(),
    isBackgroundEvent: z.boolean(),
    isRecurring: z.boolean(),
    daysOfWeek: z.array(z.number()).optional(),
    fee: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isRecurring && !data.endRecur) {
        return false;
      }
      return true;
    },
    {
      message: "End recurrence is required when the event is recurring",
      path: ["endRecur"],
    }
  );

export type TCalendarForm = z.infer<typeof calendarFormSchema>;

// .superRefine((data, ctx) => {
//   if (!data.isBackgroundEvent) {
//     if (!data.clientName) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         message: "Client is required",
//         path: ["client"],
//       });
//     }
//   }
// });
