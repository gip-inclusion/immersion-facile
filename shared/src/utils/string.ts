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
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
