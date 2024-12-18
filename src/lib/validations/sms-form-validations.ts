import { z } from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";

export const smsDataSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "First name must be at least 1 character long" }),
  lastName: z
    .string()
    .min(1, { message: "Last name must be at least 1 character long" }),
  email: z.string().email({ message: "Invalid email address" }),
  phoneNumber: z
    .string()
    .min(1, { message: "Phone number is required" })
    .refine(isValidPhoneNumber, { message: "Invalid phone number" }),
  acceptSmsNotifications: z.boolean().refine((val) => val === true, {
    message: "You must accept SMS notifications",
  }), // Add acceptSmsNotifications field
});

export type TSMSForm = z.infer<typeof smsDataSchema>;
