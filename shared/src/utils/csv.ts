import { AppellationDto } from "../romeAndAppellationDtos/romeAndAppellation.dto";

export const establishmentAppellationsFromCSVToDto = (
  appellationsRow: string,
): AppellationDto[] =>
  appellationsRow
    .replaceAll(" ", "")
    .split(",")
    .map((appellationCode) => ({
      appellationCode,
      appellationLabel: "Todo",
      romeCode: "A8754",
      romeLabel: "Todo",
    }));

export const establishmentCopyEmailsFromCSVToDto = (
  copyEmailsRow: string,
): string[] => copyEmailsRow.replaceAll(" ", "").split(",");

export const csvBooleanToBoolean = (value: string) => Boolean(parseInt(value));
