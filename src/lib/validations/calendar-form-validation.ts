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
    endRecur: z.string().optional(), // No regex here
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
  .superRefine((data, ctx) => {
    if (data.isRecurring) {
      // Validate `endRecur` only when `isRecurring` is true
      if (!data.endRecur || !/^\d{4}-\d{2}-\d{2}$/.test(data.endRecur)) {
        ctx.addIssue({
          code: "custom", // Required to specify the type of error
          path: ["endRecur"],
          message: "End recurrence is required",
        });
      }
    }
  });

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
