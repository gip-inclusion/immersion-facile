import { OmitFromExistingKeys } from "shared/src/utils";
import { EstablishmentRawBeforeExportProps } from "./EstablishmentRawBeforeExportVO";

type TranslatedFields = "isCommited";

export type EstablishmentReadyForExportVO = OmitFromExistingKeys<
  EstablishmentRawBeforeExportProps,
  TranslatedFields
> & {
  numberEmployeesRange: string;
  isCommited: string;
  department: string;
  region: string;
};
