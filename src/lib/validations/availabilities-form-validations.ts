import { z } from "zod";

export const availabilitiesFormSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    startRecur: z.string().optional(),
    endRecur: z.string().optional(), // No regex here
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

      if (!data.startRecur) {
        ctx.addIssue({
          code: "custom",
          path: ["startRecur"],
          message: "Start recurrence is required",
        });
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.startRecur!)) {
        ctx.addIssue({
          code: "custom",
          path: ["startRecur"],
          message: "Start recurrence wrong format",
        });
      }
    }

    //-------- date validations --------//
    if (!data.date) {
      ctx.addIssue({
        code: "custom",
        path: ["date"],
        message: "Date is required",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date!)) {
      ctx.addIssue({
        code: "custom",
        path: ["date"],
        message: "Date wrong format",
      });
    }

    //-------- startTime validations --------//
    if (!data.startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Start time is required",
      });
    }

    if (!/^\d{2}:\d{2}$/.test(data.startTime!)) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Start time wrong format",
      });
    }

    //-------- endTime validations --------//

    if (!data.endTime) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time is required",
      });
    }

    if (!/^\d{2}:\d{2}$/.test(data.endTime!)) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time wrong format",
      });
    }
  });

export type TAvailabilitiesForm = z.infer<typeof availabilitiesFormSchema>;
