import {
  type AbsoluteUrl,
  type ConnectedUserDomainJwtPayload,
  type ConventionJwtPayload,
  errors,
  type HtmlToPdfRequest,
  htmlToPdfRequestSchema,
} from "shared";
import { useCaseBuilder } from "../../useCaseBuilder";
import type { PdfGeneratorGateway } from "../ports/PdfGeneratorGateway";

const scriptTagRegex =
  /<script\b[^<]*(?:(?!<\/script[^>]*>)<[^<]*)*<\/script[^>]*>/gi;
const linkTagRegex = /<link\b[^>]*>/gi;
const hrefRegex = /\bhref=["']([^"']*)["']/i;
const chromeAnnotationRegex =
  /<chrome_annotation\b[^>]*>([\s\S]*?)<\/chrome_annotation>/gi;

const isAllowedLinkHref = (href: string, allowedOrigin: string): boolean =>
  href.startsWith("/") || href.startsWith(allowedOrigin);

const replaceUntilStable = (input: string, regex: RegExp): string => {
  const next = input.replace(regex, "");
  return next === input ? next : replaceUntilStable(next, regex);
};

const sanitizeHtmlForPdf = (
  htmlContent: string,
  allowedOrigin: string,
): string =>
  replaceUntilStable(htmlContent, scriptTagRegex)
    .replace(linkTagRegex, (fullMatch) => {
      const hrefMatch = hrefRegex.exec(fullMatch);
      if (!hrefMatch) return fullMatch;
      return isAllowedLinkHref(hrefMatch[1], allowedOrigin) ? fullMatch : "";
    })
    .replace(chromeAnnotationRegex, "$1");

export type HtmlToPdf = ReturnType<typeof makeHtmlToPdf>;

export const makeHtmlToPdf = useCaseBuilder("HtmlToPdf")
  .notTransactional()
  .withInput<HtmlToPdfRequest>(htmlToPdfRequestSchema)
  .withOutput<string>()
  .withCurrentUser<ConventionJwtPayload | ConnectedUserDomainJwtPayload>()
  .withDeps<{
    pdfGeneratorGateway: PdfGeneratorGateway;
    immersionFacileBaseUrl: AbsoluteUrl;
  }>()
  .build(async ({ inputParams, deps, currentUser }) => {
    if (!currentUser) throw errors.user.unauthorized();
    const sanitizedHtmlContent = sanitizeHtmlForPdf(
      inputParams.htmlContent,
      deps.immersionFacileBaseUrl,
    );
    return deps.pdfGeneratorGateway.make({
      ...inputParams,
      htmlContent: sanitizedHtmlContent,
    });
  });
