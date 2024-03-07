import { TallyForm, tallyFormSchema } from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { ValidatedConventionNps } from "../entities/ValidatedConventionNps";

export class AddValidatedConventionNps extends TransactionalUseCase<TallyForm> {
  inputSchema = tallyFormSchema;
  async _execute(tallyForm: TallyForm, uow: UnitOfWork): Promise<void> {
    const scoreTallyKey = "question_mKqNyA";
    const commentsTallyKey = "question_XxOKKg";
    const wouldHaveDoneWithoutIfTallyKey = "question_aQZbg9";
    const conventionIdTallyKey =
      "question_mBPV55_9b77fd90-08be-440e-b919-a66e1ba38935";
    const roleTallyKey = "question_wkVQx1_38f2b6f7-f22b-4bfe-a67e-fa8f3db52f88";

    const { data } = tallyForm;
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
      rawResult: tallyForm,
    };

    await uow.npsRepository.save(nps);
  }
}
