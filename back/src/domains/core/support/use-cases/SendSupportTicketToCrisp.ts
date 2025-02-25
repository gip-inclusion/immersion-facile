import { TallyForm, tallyFormSchema } from "shared";
import { createTransactionalUseCase } from "../../UseCase";
import { CrispGateway } from "../ports/CrispGateway";

const segmentKey = "question_818ZDA_5439773a-d891-4197-871f-bd50a6bb7c86";
const emailKey = "question_MeYNZk";
const messageKey = "question_lbWeGv";
const conventionIdKey = "question_RGYMNj";
const bestMatchingKey = "question_PdYMgd";
const otherSelectKey = "question_YjKMyJ";
const youAreKey = "question_PpRzBx";
const yourWriteForKey = "question_Oa4Y87";
const whatIsYourRequestAboutKey = "question_44v0QA"

const getValueFromMultipleChoiceField =
  (fields: TallyForm["data"]["fields"]) =>
  (key: string): { label: string | null; value: string } | undefined => {
    const field = fields.find((question) => question.key === key);

    if (!field || !field.value || !field.options) return;
    if (!["MULTIPLE_CHOICE", "DROPDOWN"].includes(field.type))
      throw new Error(`Not a multiple choice field, was ${field.type}`);

    const matchingOptions = field.options.filter((option) =>
      field.value?.includes(option.id),
    );
    return {
      label: field.label,
      value: matchingOptions.map((option) => option.text).join(", "),
    };
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
  async ({ inputParams, deps: { crispApi } }) => {
    const { fields } = inputParams.data;
    const segmentValue: string | undefined = fields.find(
      (question) => question.key === segmentKey,
    )?.value;
    const segments = segmentValue?.split(",") ?? [];

    const email: string = fields.find(
      (question) => question.key === emailKey,
    )?.value;
    if (!email || !email.includes("@"))
      throw new Error(
        `Invalid email : ${email} in support. Check in tally for eventId: ${inputParams.eventId}.`,
      );

    const message: string = fields.find(
      (question) => question.key === messageKey,
    )?.value;
    if (!message)
      throw new Error(
        `Invalid message : ${message} in support. Check in tally for eventId: ${inputParams.eventId}.`,
      );

    const conventionId: string | undefined = fields.find(
      (question) => question.key === conventionIdKey,
    )?.value;

    const multipleChoiceQuestions = [
      bestMatchingKey,
      otherSelectKey,
      youAreKey,
      yourWriteForKey,
      whatIsYourRequestAboutKey,
    ];

    const multipleChoiceProcessedQuestions = multipleChoiceQuestions
      .map(getValueFromMultipleChoiceField(fields))
      .flatMap((q) => {
        if (q) return [`${q.label}:\n${q.value}\n`];
        return [];
      });

    await crispApi.initiateConversation({
      message,
      metadata: {
        segments,
        email,
      },
      helperNote: [
        ...multipleChoiceProcessedQuestions,
        ...(conventionId ? [`Convention ID: ${conventionId}`] : []),
      ].join("\n"),
    });
  },
);
