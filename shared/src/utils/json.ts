export const safeTryJsonParse = (toJsonParse: string) => {
  try {
    return { payload: JSON.parse(toJsonParse) };
  } catch (e) {
    console.error(e);
    return toJsonParse;
  }
};
