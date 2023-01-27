import { AppellationDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";

export const establishmentAppellationsFromCSVToDto = (
  appellationsRow: string,
): AppellationDto[] =>
  appellationsRow
    .replaceAll(" ", "")
    .split(",")
    .map((appellationCode) => ({
      appellationCode,
      appellationLabel: "Should be mapped by backend",
      romeCode: "A9999",
      romeLabel: "Should be mapped by backend",
    }));

export const establishmentCopyEmailsFromCSVToDto = (
  copyEmailsRow: string,
): string[] => copyEmailsRow.replaceAll(" ", "").split(",");

export const csvBooleanToBoolean = (value: string) => Boolean(parseInt(value));
