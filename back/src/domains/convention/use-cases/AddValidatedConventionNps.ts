import { type TallyForm, tallyFormSchema } from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { ValidatedConventionNps } from "../entities/ValidatedConventionNps";

export type AddValidatedConventionNps = ReturnType<
  typeof makeAddValidatedConventionNps
>;

export const makeAddValidatedConventionNps = useCaseBuilder(
  "AddValidatedConventionNps",
)
  .withInput<TallyForm>(tallyFormSchema)
  .build(async ({ inputParams, uow }) => {
    const scoreTallyKey = "question_mKqNyA";
    const commentsTallyKey = "question_XxOKKg";
    const wouldHaveDoneWithoutIfTallyKey = "question_aQZbg9";
    const conventionIdTallyKey =
      "question_mBPV55_9b77fd90-08be-440e-b919-a66e1ba38935";
    const roleTallyKey = "question_wkVQx1_38f2b6f7-f22b-4bfe-a67e-fa8f3db52f88";

    const { data } = inputParams;
    const { fields } = data;

    const nps: ValidatedConventionNps = {
      conventionId: fields.find(({ key }) => key === conventionIdTallyKey)
        ?.value,
      role: fields.find(({ key }) => key === roleTallyKey)?.value,
      score: fields.find(({ key }) => key === scoreTallyKey)?.value,
      comments: fields.find(({ key }) => key === commentsTallyKey)?.value,
      wouldHaveDoneWithoutIF:
        fields.find(({ key }) => key === wouldHaveDoneWithoutIfTallyKey)
          ?.value === "Oui",
      respondentId: data.respondentId,
      responseId: data.responseId,
      rawResult: inputParams,
    };

    await uow.npsRepository.save(nps);
  });
