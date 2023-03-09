import { EmailButtonProps } from "./components/email";

type CreateEmailVariable<P> = (params: P) => {
  subject: string;
  greetings?: string;
  content?: string;
  highlight?: {
    kind?: "success" | "error" | "warning" | "info";
    content?: string;
  };
  subContent?: string;
  legals?: string;
  agencyLogoUrl?: string;
  buttons?: EmailButtonProps[];
  attachmentUrls?: string[];
};

export type HtmlTemplateEmailData<P> = {
  niceName: string;
  createEmailVariables: CreateEmailVariable<P>;
  tags?: string[];
};

export const createTemplatesByName = <
  ParamsByEmailType extends { [K in string]: unknown } = never,
>(templatesByName: {
  [K in keyof ParamsByEmailType]: HtmlTemplateEmailData<ParamsByEmailType[K]>;
}) => templatesByName;
