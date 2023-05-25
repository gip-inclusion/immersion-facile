import { ValueOf } from "../utils";
import { Phone } from "./sms.schema";

type GenericTemplatedSms<
  T extends string,
  P extends Record<string, unknown>,
> = {
  kind: T;
  params: P;
  recipient: Phone;
};

type WithShortLink = { shortLink: string };

type SmsParamsBySmsType = {
  FirstReminderForSignatories: WithShortLink;
  LastReminderForSignatories: WithShortLink;
};

export type TemplatedSms = ValueOf<{
  [K in keyof SmsTemplateByName]: GenericTemplatedSms<K, SmsParamsBySmsType[K]>;
}>;

const createSmsTemplates = (templatesByName: {
  [K in keyof SmsParamsBySmsType]: {
    createContent: (params: SmsParamsBySmsType[K]) => string;
  };
}) => templatesByName;

export type SmsTemplateByName = typeof smsTemplatesByName;
export const smsTemplatesByName = createSmsTemplates({
  FirstReminderForSignatories: {
    createContent: ({ shortLink }) =>
      `Immersion Facilitée, veuillez signer la convention ${shortLink}`,
  },
  LastReminderForSignatories: {
    createContent: ({ shortLink }) =>
      `Urgent Immersion Facilitée, veuillez signer la convention ${shortLink}`,
  },
});
