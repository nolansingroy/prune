import { z } from "zod";

export const bookingtypeFormSchema = z.object({
  name: z.string().optional(),
  fee: z.number().optional(),
  color: z.string().optional(),
});

export type TBookingtypeForm = z.infer<typeof bookingtypeFormSchema>;
