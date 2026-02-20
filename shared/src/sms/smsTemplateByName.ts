import type { AbsoluteUrl } from "../AbsoluteUrl";
import type { PhoneNumber } from "../phone/phone.dto";
import type { KeysOfUnion, ValueOf } from "../utils";

type GenericTemplatedSms<
  T extends string,
  P extends Record<string, unknown>,
> = {
  kind: T;
  params: P;
  recipientPhone: PhoneNumber;
};

type WithShortLink = { shortLink: AbsoluteUrl };

type SmsParamsBySmsType = {
  ReminderForSignatories: WithShortLink;
  ReminderForAssessment: WithShortLink;
  HelloWorld: {
    testMessage: string;
  };
};

export type TemplatedSms = ValueOf<{
  [K in keyof SmsTemplateByName]: GenericTemplatedSms<K, SmsParamsBySmsType[K]>;
}>;

export type SmsVariables = KeysOfUnion<TemplatedSms["params"]>;

const createSmsTemplates = (
  templatesByName: {
    [K in keyof SmsParamsBySmsType]: {
      createContent: (params: SmsParamsBySmsType[K]) => string;
    };
  },
) => templatesByName;

export type SmsTemplateByName = typeof smsTemplatesByName;
export type SmsTemplateKind = keyof SmsParamsBySmsType;
export const smsTemplatesByName = createSmsTemplates({
  ReminderForSignatories: {
    createContent: ({ shortLink }) =>
      `Urgent Immersion Facilitée, veuillez signer la convention ${shortLink}`,
  },
  ReminderForAssessment: {
    createContent: ({ shortLink }) =>
      `Urgent Immersion Facilitée, veuillez compléter le bilan ${shortLink}`,
  },
  HelloWorld: {
    createContent: ({ testMessage }) =>
      `Immersion Facilitée - Test SMS - ${testMessage}`,
  },
});
