import { GetSiretResponseDto } from "src/shared/siret";

export const validSiret = "12345678901234";
export const existingOpenSireneResponse: GetSiretResponseDto = {
  siret: validSiret,
  businessName: "Existing open business on Sirene Corp.",
  businessAddress: "",
  isOpen: true,
};
export const existingClosedSireneResponse: GetSiretResponseDto = {
  siret: validSiret,
  businessName: "Existing closed business on Sirene Corp.",
  businessAddress: "",
  isOpen: false,
};
export const emptySiret = "";
export const badSiretTooShort = "12";
export const badSiretOneWithLetter = "1234567890123a";
export const badSiretTooLong = "123456789012345";
