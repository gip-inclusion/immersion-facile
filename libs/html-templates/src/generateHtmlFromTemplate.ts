import { templateByName } from "./templatesByName";
import {
  renderHeader,
  renderButton,
  renderContent,
  renderGreetings,
  renderHighlight,
  renderFooter,
  renderHead,
  renderLegals,
} from "./components/email";

import { ignoreTabs } from "./helpers/formatters";

type TemplateByName = typeof templateByName;

export type GenerateHtmlOptions = { skipHead?: boolean };

const renderHTMLRow = (html: string | undefined) =>
  html && html !== ""
    ? `
    <tr>
      <td>
        ${html}
      </td>
    </tr>
  `
    : "";

export const generateHtmlFromTemplate = <N extends keyof TemplateByName>(
  templateName: N,
  params: Parameters<TemplateByName[N]["createEmailVariables"]>[0],
  options: GenerateHtmlOptions = {},
): { subject: string; htmlContent: string; tags?: string[] } => {
  const { createEmailVariables, tags } = templateByName[templateName];
  const emailRecipient = "test@test.com";
  const {
    subject,
    agencyLogoUrl,
    greetings,
    content,
    button,
    highlight,
    subContent,
    legals,
  } = createEmailVariables(params as any);

  const doctype =
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">';
  const templateData: {
    subject: string;
    htmlContent: string;
    tags?: string[];
  } = {
    subject,
    htmlContent: ignoreTabs(`${options.skipHead ? "" : doctype}
        <html lang="fr">${options.skipHead ? "" : renderHead(subject)}
          <body>
            <table width="600" align="center" style="margin-top: 20px">
              ${[
                renderHeader(agencyLogoUrl),
                renderGreetings(greetings),
                renderContent(content),
                renderButton(button),
                renderHighlight(highlight),
                renderContent(subContent),
                renderLegals(legals),
                renderFooter(emailRecipient),
              ]
                .map((chunk) => renderHTMLRow(chunk))
                .join("")}       
            </table>
          </body>
        </html>
      `),
  };
  if (tags) {
    templateData.tags = tags;
  }
  return templateData;
};
