export const getJwtPayload = (jwt: string) => {
  try {
    return JSON.parse(atob(jwt.split(".")[1]));
  } catch (_e) {
    return null;
  }
};
