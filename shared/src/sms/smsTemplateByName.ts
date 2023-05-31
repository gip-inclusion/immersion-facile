import type { AbsoluteUrl } from "../AbsoluteUrl";
import type { Flavor } from "../typeFlavors";
import type { ValueOf } from "../utils";

export type Phone = Flavor<string, "Phone">;

type GenericTemplatedSms<
  T extends string,
  P extends Record<string, unknown>,
> = {
  kind: T;
  params: P;
  recipientPhone: Phone;
};

type WithShortLink = { shortLink: AbsoluteUrl };

type SmsParamsBySmsType = {
  FirstReminderForSignatories: WithShortLink;
  LastReminderForSignatories: WithShortLink;
  HelloWorld: {
    testMessage: string;
  };
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
  HelloWorld: {
    createContent: ({ testMessage }) =>
      `Immersion Facilitée - Test SMS - ${testMessage}`,
  },
});
