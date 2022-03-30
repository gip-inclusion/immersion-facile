import { OmitFromExistingKeys } from "../../../shared/utils";
import { EstablishmentRawBeforeExportProps } from "./EstablishmentRawBeforeExportVO";

type TranslatedFields = "isCommited" | "numberEmployees";

export type EstablishmentReadyForExportVO = OmitFromExistingKeys<
  EstablishmentRawBeforeExportProps,
  TranslatedFields
> & {
  numberEmployees: string;
  isCommited: string;
  department: string;
  region: string;
};
