import { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import { calculateWeeklyHoursFromSchedule } from "../../../shared/ScheduleUtils";
import type { ImmersionApplicationReadyForExportVO } from "./ImmersionApplicationReadyForExportVO";

type KeysForExport =
  | "status"
  | "postalCode"
  | "email"
  | "phone"
  | "firstName"
  | "lastName"
  | "dateSubmission"
  | "dateStart"
  | "dateEnd"
  | "businessName"
  | "mentor"
  | "mentorPhone"
  | "mentorEmail"
  | "immersionObjective"
  | "immersionProfession"
  | "beneficiaryAccepted"
  | "enterpriseAccepted"
  | "schedule"
  | "siret";

export type ImmersionApplicationRawBeforeExportProps = Pick<
  ImmersionApplicationDto,
  KeysForExport
> & { agencyName: string };

export class ImmersionApplicationRawBeforeExportVO {
  constructor(
    public readonly _props: ImmersionApplicationRawBeforeExportProps,
  ) {}

  public toImmersionApplicationReadyForExportVO =
    (): ImmersionApplicationReadyForExportVO => ({
      ...this.toTranslatedImmersionApplication(),
      weeklyHours: calculateWeeklyHoursFromSchedule(this._props.schedule),
    });

  private toTranslatedImmersionApplication = () => ({
    ...this._props,
    status: translateStatus[this._props.status],
    beneficiaryAccepted: this.translateBoolean(this._props.beneficiaryAccepted),
    enterpriseAccepted: this.translateBoolean(this._props.enterpriseAccepted),
  });

  private translateBoolean = (value: boolean): string =>
    value ? "OUI" : "NON";
}

const translateStatus: Record<string, string> = {
  ["DRAFT"]: "Brouillon",
  ["READY_TO_SIGN"]: "Prêt à signer",
  ["PARTIALLY_SIGNED"]: "Signé partiellement",
  ["IN_REVIEW"]: "Demande à étudier",
  ["ACCEPTED_BY_COUNSELLOR"]: "Éligible",
  ["ACCEPTED_BY_VALIDATOR"]: "Validé par la structure",
  ["VALIDATED"]: "Convention envoyée",
  ["REJECTED"]: "Refusée",
};
