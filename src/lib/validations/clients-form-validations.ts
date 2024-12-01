import { z } from "zod";

export const clientsFormSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "Name must be at least 1 character long" }),
  lastName: z
    .string()
    .min(1, { message: "Name must be at least 1 character long" }),
  email: z.string().email({ message: "Invalid email address" }),
  status: z.enum(["active", "pending", "deactivated"]),
});

export type TClientsForm = z.infer<typeof clientsFormSchema>;
