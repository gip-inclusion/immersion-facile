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

export const toLowerCaseWithoutDiacritics = (str: string): string =>
  str
    .normalize("NFD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "");
