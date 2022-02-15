import { OmitFromExistingKeys } from "../../../shared/utils";
import { ImmersionApplicationRawBeforeExportProps } from "./ImmersionApplicationRawBeforeExportVO";

type TranslatedFields = "status" | "beneficiaryAccepted" | "enterpriseAccepted";

export type ImmersionApplicationReadyForExportVO = OmitFromExistingKeys<
  ImmersionApplicationRawBeforeExportProps,
  TranslatedFields
> & {
  status: string;
  beneficiaryAccepted: string;
  enterpriseAccepted: string;
  weeklyHours: number;
};
