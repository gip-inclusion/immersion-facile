import { KeysOfUnion, ValueOf } from "../utils";
import { Email } from "./email.dto";
import { emailTemplatesByName } from "./emailTemplatesByName";

export type GenericTemplatedEmail<
  K extends string,
  P extends Record<string, unknown>,
> = {
  kind: K;
  params: P;
  recipients: string[];
  cc?: string[];
  replyTo?: { name: string; email: Email };
  attachments?: { content: string; name: string }[];
};

export type EmailType = TemplatedEmail["kind"];

export type EmailVariables = KeysOfUnion<TemplatedEmail["params"]>;

export type EmailTemplatesByName = typeof emailTemplatesByName;

export type TemplatedEmail = ValueOf<{
  [TemplateName in keyof EmailTemplatesByName]: GenericTemplatedEmail<
    TemplateName,
    Parameters<EmailTemplatesByName[TemplateName]["createEmailVariables"]>[0]
  >;
}>;
