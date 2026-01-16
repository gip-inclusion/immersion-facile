import {
  type ConventionDraftDto,
  type ConventionDraftId,
  conventionDraftIdSchema,
  errors,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export const makeGetConventionDraftById = useCaseBuilder(
  "GetConventionDraftById",
)
  .withInput<ConventionDraftId>(conventionDraftIdSchema)
  .withOutput<ConventionDraftDto>()
  .build(async ({ inputParams, uow }) => {
    const draft = await uow.conventionDraftRepository.getById(inputParams);
    if (!draft)
      throw errors.conventionDraft.notFound({ conventionDraftId: inputParams });
    return draft;
  });
