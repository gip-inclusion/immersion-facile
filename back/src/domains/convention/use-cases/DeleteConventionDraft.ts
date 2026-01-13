import {
  type ConventionDraftId,
  type WithConventionDto,
  withConventionSchema,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type DeleteConventionDraft = ReturnType<
  typeof makeDeleteConventionDraft
>;
export const makeDeleteConventionDraft = useCaseBuilder("DeleteConventionDraft")
  .withInput<WithConventionDto>(withConventionSchema)
  .withOutput<void>()
  .build(async ({ inputParams, uow }) => {
    await uow.conventionDraftRepository.delete([
      inputParams.convention.id as ConventionDraftId,
    ]);
  });
