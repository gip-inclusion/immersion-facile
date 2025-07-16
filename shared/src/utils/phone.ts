export type PhoneDto = { codeCountry: string; phoneNumber: string };

export const phoneDtoToString = (phone: PhoneDto): string =>
  `${phone.codeCountry}:${phone.phoneNumber}`;

export const phoneStringToDto = (
  phone: string | undefined | null,
): PhoneDto => {
  if (!phone) return { codeCountry: "fr", phoneNumber: "" };
  const [codeCountry, ...rest] = phone.split(":");
  return {
    codeCountry: codeCountry || "fr",
    phoneNumber: rest.join(":") || "",
  };
};
