import { z } from "zod/v4";

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

export const getTallyFormValueOf = (
  tallyForm: TallyForm,
  label: string,
): string | undefined => {
  const field = tallyForm.data.fields.find((field) => field.label === label);
  if (field && field.type === "MULTIPLE_CHOICE") {
    return field.options?.find((option) => option.id === field.value[0])?.text;
  }
  return field?.value;
};
