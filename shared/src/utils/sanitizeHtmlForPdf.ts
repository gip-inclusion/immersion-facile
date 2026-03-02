const scriptTagRegex =
  /<script\b[^<]*(?:(?!<\/script[^>]*>)<[^<]*)*<\/script[^>]*>/gi;
const linkTagRegex = /<link\b[^>]*>/gi;
const hrefRegex = /\bhref=["']([^"']*)["']/i;
const chromeAnnotationRegex =
  /<chrome_annotation\b[^>]*>([\s\S]*?)<\/chrome_annotation>/gi;

const isAllowedLinkHref = (href: string, allowedDomain: string): boolean => {
  try {
    const hostname = new URL(href).hostname;
    return hostname === allowedDomain || hostname.endsWith(`.${allowedDomain}`);
  } catch {
    return false;
  }
};

const replaceUntilStable = (input: string, regex: RegExp): string => {
  const next = input.replace(regex, "");
  return next === input ? next : replaceUntilStable(next, regex);
};

export const stripUnsafeHtmlForPdf = (htmlContent: string): string =>
  replaceUntilStable(htmlContent, scriptTagRegex).replace(
    chromeAnnotationRegex,
    "$1",
  );

const crossoriginRegex = /\s+crossorigin(?:=["'][^"']*["'])?/gi;

export const sanitizeHtmlForPdf = (
  htmlContent: string,
  allowedDomain: string,
): string =>
  stripUnsafeHtmlForPdf(htmlContent)
    .replace(linkTagRegex, (fullMatch) => {
      const hrefMatch = hrefRegex.exec(fullMatch);
      if (!hrefMatch) return fullMatch;
      return isAllowedLinkHref(hrefMatch[1], allowedDomain) ? fullMatch : "";
    })
    .replace(crossoriginRegex, "");
