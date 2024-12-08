import { z } from "zod";
import { isValidPhoneNumber } from "react-phone-number-input";

export const clientsFormSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "First name must be at least 1 character long" }),
  lastName: z
    .string()
    .min(1, { message: "Last name must be at least 1 character long" }),
  email: z.string().email({ message: "Invalid email address" }),
  status: z.enum(["active", "pending", "deactivated"]),
  phoneNumber: z
    .string()
    .min(1, { message: "Phone number is required" })
    .refine(isValidPhoneNumber, { message: "Invalid phone number" }),
  sms: z.boolean(),
});

export type TClientsForm = z.infer<typeof clientsFormSchema>;
