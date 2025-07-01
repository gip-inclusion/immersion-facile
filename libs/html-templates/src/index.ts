import { configureGenerateHtmlFromTemplate } from "./configureGenerateHtmlFromTemplate";
import { createTemplatesByName } from "./createTemplatesByName";
import { ignoreTabs } from "./helpers/formatters";

export { configureGenerateHtmlFromTemplate, createTemplatesByName, ignoreTabs };

export type { EmailButtonProps } from "./components/email/button";
export { defaultEmailFooter } from "./components/email/footer";
export { cciCustomHtmlHeader } from "./components/email/header";
export type { GenerateHtmlOptions } from "./configureGenerateHtmlFromTemplate";
