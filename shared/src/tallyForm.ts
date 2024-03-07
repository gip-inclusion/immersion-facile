import { z } from "zod";

export type TallyForm = z.infer<typeof tallyFormSchema>;

export const tallyFormSchema = z
  .object({
    eventId: z.string(),
    eventType: z.string(),
    createdAt: z.string(),
    data: z.object({
      responseId: z.string(),
      submissionId: z.string(),
      respondentId: z.string(),
      formId: z.string(),
      formName: z.string(),
      createdAt: z.string(),
      fields: z.array(
        z.object({
          key: z.string(),
          label: z.string().nullable(),
          type: z.string(),
          value: z.any().nullable(),
          options: z
            .array(
              z.object({
                id: z.string(),
                text: z.string(),
              }),
            )
            .optional(),
        }),
      ),
    }),
  })
  .passthrough();
