import {
  conventionDraftIdSchema,
  type WithConventionDraftId,
  type ZodSchemaWithInputMatchingOutput,
} from "shared";
import z from "zod";
import { useCaseBuilder } from "../../core/useCaseBuilder";

const partialWithConventionDraftIdSchema: ZodSchemaWithInputMatchingOutput<
  Partial<WithConventionDraftId>
> = z.object({
  conventionDraftId: conventionDraftIdSchema.optional(),
});

export type DeleteConventionDraft = ReturnType<
  typeof makeDeleteConventionDraft
>;
export const makeDeleteConventionDraft = useCaseBuilder("DeleteConventionDraft")
  .withInput<Partial<WithConventionDraftId>>(partialWithConventionDraftIdSchema)
  .withOutput<void>()
  .build(async ({ inputParams, uow }) => {
    if (!inputParams.conventionDraftId) return;
    await uow.conventionDraftRepository.delete([inputParams.conventionDraftId]);
  });
