import { type AddConventionInput, addConventionInputSchema } from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type DeleteConventionDraft = ReturnType<
  typeof makeDeleteConventionDraft
>;
export const makeDeleteConventionDraft = useCaseBuilder("DeleteConventionDraft")
  .withInput<AddConventionInput>(addConventionInputSchema)
  .withOutput<void>()
  .build(async ({ inputParams, uow }) => {
    if (!inputParams.fromConventionDraftId) return;
    await uow.conventionDraftRepository.delete([
      inputParams.fromConventionDraftId,
    ]);
  });
