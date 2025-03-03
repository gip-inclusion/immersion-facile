import { ConventionId, TallyForm, tallyFormSchema } from "shared";
import { createTransactionalUseCase } from "../../UseCase";
import { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import { CrispGateway } from "../ports/CrispGateway";

const segmentKey = "question_818ZDA_5439773a-d891-4197-871f-bd50a6bb7c86";
const emailKey = "question_MeYNZk";
const establishmentEmailKey = "question_gDZxKl";
const messageKey = "question_lbWeGv";
const conventionIdKey = "question_RGYMNj";
const siretKey = "question_yPEXQB";
const deleteReasonKey = "question_A7DYbl";
const whyStopToWelcomeImmersionKey = "question_eq2Jxo";
const youAreKey = "question_PpRzBx";
const youAre2Key = "question_VGQYoJ";
const youAre3Key = "question_vGEzzv";
const isTicketToSkipKey =
  "question_818ZDA_ebb6daf8-6141-4b37-a9c2-58af14389a59";

const makeGetValueFromMultipleChoiceField =
  (fields: TallyForm["data"]["fields"]) =>
  (key: string): { label: string | null; value: string } | undefined => {
    const field = fields.find((question) => question.key === key);

    if (!field || !field.value || !field.options) return;
    if (!["MULTIPLE_CHOICE", "DROPDOWN", "MULTI_SELECT"].includes(field.type))
      throw new Error(`Not a multiple choice field, was ${field.type}`);

    const matchingOptions = field.options.filter((option) =>
      field.value?.includes(option.id),
    );
    return {
      label: field.label,
      value: matchingOptions.map((option) => option.text).join(", "),
    };
  };

const makeGetInputValue =
  (fields: TallyForm["data"]["fields"]) =>
  (key: string): string | undefined => {
    const field = fields.find((field) => field.key === key);
    return field?.value;
  };

export type SendSupportTicketToCrisp = ReturnType<
  typeof makeSendSupportTicketToCrisp
>;
export const makeSendSupportTicketToCrisp = createTransactionalUseCase<
  TallyForm,
  void,
  void,
  { crispApi: CrispGateway }
>(
  { name: "SendSupportTicketToCrisp", inputSchema: tallyFormSchema },
  async ({ inputParams, deps: { crispApi }, uow }) => {
    const { fields } = inputParams.data;
    const getValueFromMultipleChoice =
      makeGetValueFromMultipleChoiceField(fields);
    const getInputValue = makeGetInputValue(fields);

    const isTicketToSkip = getInputValue(isTicketToSkipKey);
    if (isTicketToSkip?.toLowerCase() === "true") return;

    const segments = getInputValue(segmentKey)?.split(",") ?? [];

    const email = getEmail(fields, inputParams.eventId);
    const message = getMessage(getInputValue, inputParams.eventId);

    const conventionId = getInputValue(conventionIdKey)?.trim();

    const conventionRelatedData = conventionId
      ? await getConventionRelatedData({ uow, conventionId })
      : undefined;

    const multipleChoiceQuestions = [whyStopToWelcomeImmersionKey];

    const multipleChoiceProcessedQuestions = multipleChoiceQuestions
      .map(getValueFromMultipleChoice)
      .flatMap((q) => {
        if (q?.value === "Autre") return false;
        if (q) return `${q.label}:\n${q.value}\n`;
        return false;
      })
      .filter(Boolean)
      .join("\n");

    const isBeneficiary = [youAreKey, youAre2Key, youAre3Key].some(
      (k) => getValueFromMultipleChoice(k)?.value === "Le bénéficiaire",
    );

    const isEstablishment = [youAreKey, youAre2Key, youAre3Key].some(
      (k) => getValueFromMultipleChoice(k)?.value === "L'entreprise",
    );

    const siret = getInputValue(siretKey);

    await crispApi.initiateConversation({
      message,
      metadata: {
        segments: [
          ...new Set([
            ...segments,
            ...(conventionRelatedData?.extraSegment ?? []),
          ]),
        ],
        email,
      },
      helperNote: [
        `Liens magiques (de la personne écrivant au support):
https://metabase.immersion-facile.beta.gouv.fr/dashboard/102?filtrer_par_email=${email}
`,
        conventionRelatedData?.note,
        isBeneficiary &&
          `-----------
Retrouver la convention par Email de bénéficiaire:
https://metabase.immersion-facile.beta.gouv.fr/dashboard/5?email_b%25C3%25A9n%25C3%25A9ficiaire=${email}
`,
        siret &&
          `-----------
Siret fourni : ${siret}
Piloter l'entreprise (dont suppression): https://immersion-facile.beta.gouv.fr/pilotage-etablissement-admin?siret=${siret}
`,
        isEstablishment &&
          `-----------
Retrouver la convention par Email de l'entreprise:
https://metabase.immersion-facile.beta.gouv.fr/dashboard/5?email_repr%25C3%25A9sentant_de_l%27entreprise=${email}
`,
        multipleChoiceProcessedQuestions,
        `-----------
Logs Brevo:
https://app-smtp.brevo.com/log
`,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  },
);

const getEmail = (fields: TallyForm["data"]["fields"], eventId: string) => {
  const email: string = fields.find(
    (question) =>
      [emailKey, establishmentEmailKey].includes(question.key) &&
      !!question.value,
  )?.value;
  if (!email || !email.includes("@"))
    throw new Error(
      `Invalid email : ${email} in support. Check in tally for eventId: ${eventId}.`,
    );
  return email;
};

const getMessage = (
  getInputValue: (key: string) => string | undefined,
  eventId: string,
) => {
  const deleteReason = getInputValue(deleteReasonKey);
  const message =
    getInputValue(messageKey) ??
    `Demande de suppression d'entreprise${
      deleteReason ? ` pour la raison suivante: ${deleteReason}` : ""
    }`;
  if (!message)
    throw new Error(
      `Invalid message : ${message} in support. Check in tally for eventId: ${eventId}.`,
    );
  return message;
};

const getConventionRelatedData = async ({
  uow,
  conventionId,
}: { uow: UnitOfWork; conventionId: ConventionId }): Promise<{
  note: string;
  extraSegment: string[];
}> => {
  const convention = await uow.conventionRepository.getById(conventionId);
  if (!convention)
    return {
      note: `-----------
Convention ID: ${conventionId} - Non trouvée dans la base de données
`,
      extraSegment: [],
    };

  return {
    extraSegment: [convention.internshipKind],
    note: `-----------
Convention ID: ${conventionId}
Type de convention: immersion

Pilotage admin:
https://immersion-facile.beta.gouv.fr/admin/conventions/${conventionId}

Liste de conventions:
https://metabase.immersion-facile.beta.gouv.fr/dashboard/5?id_de_convention=${conventionId}

Liens magiques de cette convention:
https://metabase.immersion-facile.beta.gouv.fr/dashboard/102?filtrer_par_numero_de_convention=${conventionId}
`,
  };
};
