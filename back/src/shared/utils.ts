// TODO: find the standard for gouv.fr phone verification
export const phoneRegExp = /\+?[0-9]*/;

export const sleep = (ms: number) => {
  if (ms <= 0) {
    return;
  }
  return new Promise((r) => setTimeout(r, ms));
};
