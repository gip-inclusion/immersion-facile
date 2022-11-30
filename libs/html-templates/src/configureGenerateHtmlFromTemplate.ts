import { HtmlTemplateEmailData } from "./createTemplatesByName";
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

export const configureGenerateHtmlFromTemplate =
  <TemplateByName extends Record<string, HtmlTemplateEmailData<any>>>(
    templateByName: TemplateByName,
    config: { contactEmail: string },
  ) =>
  <N extends keyof TemplateByName>(
    templateName: N,
    params: Parameters<TemplateByName[N]["createEmailVariables"]>[0],
    options: GenerateHtmlOptions = {},
  ): {
    subject: string;
    htmlContent: string;
    tags?: string[];
    attachment?: { url: string }[];
  } => {
    const { createEmailVariables, tags, attachmentUrls } =
      templateByName[templateName];
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

    return {
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
                renderFooter(config.contactEmail),
              ]
                .map(renderHTMLRow)
                .join("")}       
            </table>
          </body>
        </html>
      `),
      ...(tags ? { tags } : {}),
      ...(attachmentUrls
        ? {
            attachment: attachmentUrls.map((attachmentUrl) => ({
              url: attachmentUrl,
            })),
          }
        : {}),
    };
  };
