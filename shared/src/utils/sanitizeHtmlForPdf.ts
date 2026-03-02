const scriptTagRegex =
  /<script\b[^<]*(?:(?!<\/script[^>]*>)<[^<]*)*<\/script[^>]*>/gi;
const linkTagRegex = /<link\b[^>]*>/gi;
const hrefRegex = /\bhref=["']([^"']*)["']/i;
const chromeAnnotationRegex =
  /<chrome_annotation\b[^>]*>([\s\S]*?)<\/chrome_annotation>/gi;

const isAllowedLinkHref = (href: string, allowedOrigin: string): boolean =>
  href.startsWith(allowedOrigin);

const replaceUntilStable = (input: string, regex: RegExp): string => {
  const next = input.replace(regex, "");
  return next === input ? next : replaceUntilStable(next, regex);
};

export const stripUnsafeHtmlForPdf = (htmlContent: string): string =>
  replaceUntilStable(htmlContent, scriptTagRegex).replace(
    chromeAnnotationRegex,
    "$1",
  );

export const sanitizeHtmlForPdf = (
  htmlContent: string,
  allowedOrigin: string,
): string =>
  stripUnsafeHtmlForPdf(htmlContent).replace(linkTagRegex, (fullMatch) => {
    const hrefMatch = hrefRegex.exec(fullMatch);
    if (!hrefMatch) return fullMatch;
    return isAllowedLinkHref(hrefMatch[1], allowedOrigin) ? fullMatch : "";
  });
