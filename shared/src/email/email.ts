import { ValueOf } from "../utils";
import { emailTemplatesByName } from "./emailTemplatesByName";

export type GenericTemplatedEmail<
  T extends string,
  P extends Record<string, unknown>,
> = {
  type: T;
  params: P;
  recipients: string[];
  cc?: string[];
};

export type EmailType = TemplatedEmail["type"];

type KeysOfUnion<T> = T extends T ? keyof T : never;
// https://stackoverflow.com/questions/49401866/all-possible-keys-of-an-union-type
export type EmailVariables = KeysOfUnion<TemplatedEmail["params"]>;

export type EmailTemplatesByName = typeof emailTemplatesByName;

export type TemplatedEmail = ValueOf<{
  [TemplateName in keyof EmailTemplatesByName]: GenericTemplatedEmail<
    TemplateName,
    Parameters<EmailTemplatesByName[TemplateName]["createEmailVariables"]>[0]
  >;
}>;
