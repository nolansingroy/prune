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
    //-------- recurring validations --------//
    if (data.isRecurring) {
      // Validate `endRecur` only when `isRecurring` is true
      if (!data.endRecur) {
        ctx.addIssue({
          code: "custom", // Required to specify the type of error
          path: ["endRecur"],
          message: "End recurrence is required",
        });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.endRecur!)) {
        ctx.addIssue({
          code: "custom",
          path: ["endRecur"],
          message: "End recurrence wrong format",
        });
      }
    }

    //-------- is booking event checks --------//
    if (!data.isBackgroundEvent) {
      // Validate `clientName` only when `isBackgroundEvent` is false
      if (!data.clientName || data.clientName.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["clientName"],
          message: "Client name is required",
        });
      }
    }
  });

export type TCalendarForm = z.infer<typeof calendarFormSchema>;
