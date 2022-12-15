import { EmailButtonProps } from "./components/email";

type CreateEmailVariable<P> = (params: P) => {
  subject: string;
  greetings?: string;
  content?: string;
  highlight?: string;
  subContent?: string;
  legals?: string;
  agencyLogoUrl?: string;
  buttons?: EmailButtonProps[];
};

export type HtmlTemplateEmailData<P> = {
  niceName: string;
  createEmailVariables: CreateEmailVariable<P>;
  tags?: string[];
  attachmentUrls?: string[];
};

export const createTemplatesByName = <
  ParamsByEmailType extends { [K in string]: unknown } = never,
>(templatesByName: {
  [K in keyof ParamsByEmailType]: HtmlTemplateEmailData<ParamsByEmailType[K]>;
}) => templatesByName;
