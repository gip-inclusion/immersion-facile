export const isStringJson = (string: string) => {
  try {
    JSON.parse(string);
    return true;
  } catch (_error) {
    return false;
  }
};

export const safeParseJson = (string: string) =>
  isStringJson(string) ? JSON.parse(string) : null;
