import { OmitFromExistingKeys } from "shared/src/utils";
import { ImmersionApplicationRawBeforeExportProps } from "./ImmersionApplicationRawBeforeExportVO";

type TranslatedFields = "status" | "beneficiaryAccepted" | "enterpriseAccepted";

export type ImmersionApplicationReadyForExportVO = OmitFromExistingKeys<
  ImmersionApplicationRawBeforeExportProps,
  TranslatedFields
> & {
  formatedDateSubmission: string;
  formatedDateStart: string;
  formatedDateEnd: string;
  status: string;
  beneficiaryAccepted: string;
  enterpriseAccepted: string;
  totalHours: number;
  weeklyHours: number;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
};
