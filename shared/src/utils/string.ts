import { values } from "ramda";

export const capitalize = (str: string): string =>
  str[0].toUpperCase() + str.slice(1);

export const cleanStringToHTMLAttribute = (
  string: string,
  prefix: string | number | null = null,
  suffix: string | number | null = null,
) => {
  const cleanedString = string
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^\w .-]/g, "")
    .replace(/\s\s+/g, " ")
    .trim()
    .replaceAll(/[ .]/g, "-");
  let result = cleanedString;
  if (prefix) {
    result = `${prefix}-${cleanedString}`;
  }
  if (suffix) {
    result += `-${suffix}`;
  }
  return result.replaceAll(":", "");
};

export const removeDiacritics = (str: string) =>
  str.normalize("NFD").replace(/\p{Diacritic}/gu, "");

export const toLowerCaseWithoutDiacritics = (str: string): string =>
  removeDiacritics(str).toLowerCase();

export const slugify = (str: string) =>
  toLowerCaseWithoutDiacritics(str)
    .trim()
    .replace(/[()]/g, "")
    .replace(/\W/g, "-");

export const looksLikeSiret = (input: string) => {
  const cleanedInput = removeSpaces(input);
  const siretRegex = /^\d{14}$/;
  return siretRegex.test(cleanedInput);
};

export const removeSpaces = (str: string) => str.replace(/\s/g, "");

export const isStringEmpty = (str: string) =>
  str !== "" && str.trim().length === 0;

export const doesStringContainsHTML = (possiblyHtmlString: string): boolean => {
  const htmlRegex =
    /(?:<[!]?(?:(?:[a-z][a-z0-9-]{0,1000})|(?:!--[\s\S]{0,1000}?--))(?:\s{0,1000}[^>]{0,1000})?>\s{0,1000})|(?:<!--)/i;
  return htmlRegex.test(possiblyHtmlString);
};

export const doesObjectContainsHTML = (obj: object): boolean => {
  const browseObjectProps = (hasHtml: boolean, value: unknown): boolean => {
    if (hasHtml) return true;
    if (typeof value === "string") return doesStringContainsHTML(value);
    if (typeof value === "object" && value !== null) {
      return values(value).reduce(browseObjectProps, false);
    }
    return false;
  };
  return values(obj).reduce(browseObjectProps, false);
};
