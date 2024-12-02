import { z } from "zod";

export const bookingtypeFormSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name must be at least 1 character long" }),
  fee: z
    .number({ invalid_type_error: "Number required" })
    .positive({ message: "Fee must be a positive number" }),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, {
    message: "Color must be a valid hex value",
  }),
});

export type TBookingtypeForm = z.infer<typeof bookingtypeFormSchema>;
