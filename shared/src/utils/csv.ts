import type { EstablishmentFormOffer } from "../formEstablishment/FormEstablishment.dto";

export const establishmentOffersFromCSVToDto = (
  offersRow: string,
): EstablishmentFormOffer[] =>
  offersRow
    .replaceAll(" ", "")
    .split(",")
    .map((appellationCode) => ({
      remoteWorkMode: "NO_REMOTE",
      appellationCode,
      appellationLabel: "Should be mapped by backend", // to refacto with Rome 4
      romeCode: "A1101", // to refacto with Rome 4
      romeLabel: "Should be mapped by backend", // to refacto with Rome 4
    }));

export const establishmentCopyEmailsFromCSVToDto = (
  copyEmailsRow: string,
): string[] => copyEmailsRow.replaceAll(" ", "").split(",");

export const csvBooleanToBoolean = (value: string) => {
  if (value === undefined)
    throw new Error(
      "Boolean: value is undefined, please provide 1 or 0 or 'true'...",
    );
  return Boolean(Number.parseInt(value)) || value.toLowerCase() === "true";
};

export const isCSVCellEmptyString = (value: string) => value.trim() === "";
