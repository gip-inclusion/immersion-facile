import {
  partialWithConventionDraftIdSchema,
  type WithConventionDraftId,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";

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
