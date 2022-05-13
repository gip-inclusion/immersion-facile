import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import {
  calculateTotalImmersionHoursBetweenDate,
  calculateWeeklyHoursFromSchedule,
  prettyPrintDayFromSchedule,
} from "shared/src/ScheduleUtils";
import type { ImmersionApplicationReadyForExportVO } from "./ImmersionApplicationReadyForExportVO";
import slugify from "slugify";
import { format } from "date-fns";

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
  | "emergencyContact"
  | "emergencyContactPhone"
  | "mentor"
  | "mentorPhone"
  | "mentorEmail"
  | "immersionObjective"
  | "beneficiaryAccepted"
  | "enterpriseAccepted"
  | "schedule"
  | "siret"
  | "workConditions";

export type ImmersionApplicationRawBeforeExportProps = Pick<
  ImmersionApplicationDto,
  KeysForExport
> & { agencyName: string; immersionProfession: string };

export class ImmersionApplicationRawBeforeExportVO {
  constructor(
    public readonly _props: ImmersionApplicationRawBeforeExportProps,
  ) {}

  public toImmersionApplicationReadyForExportVO =
    (): ImmersionApplicationReadyForExportVO => ({
      ...this.toTranslatedImmersionApplication(),
      weeklyHours: calculateWeeklyHoursFromSchedule(this._props.schedule),
      totalHours: calculateTotalImmersionHoursBetweenDate({
        dateStart: this._props.dateStart,
        dateEnd: this._props.dateEnd,
        schedule: this._props.schedule,
      }),
      ...this.splitSchedulePerDay(),
      formatedDateEnd: format(new Date(this._props.dateEnd), "yyyy-MM-dd"),
      formatedDateStart: format(new Date(this._props.dateStart), "yyyy-MM-dd"),
      formatedDateSubmission: format(
        new Date(this._props.dateSubmission),
        "yyyy-MM-dd",
      ),
    });

  private splitSchedulePerDay(): PrettySchedule {
    return {
      monday: prettyPrintDayFromSchedule(this._props.schedule, 0),
      tuesday: prettyPrintDayFromSchedule(this._props.schedule, 1),
      wednesday: prettyPrintDayFromSchedule(this._props.schedule, 2),
      thursday: prettyPrintDayFromSchedule(this._props.schedule, 3),
      friday: prettyPrintDayFromSchedule(this._props.schedule, 4),
      saturday: prettyPrintDayFromSchedule(this._props.schedule, 5),
      sunday: prettyPrintDayFromSchedule(this._props.schedule, 6),
    };
  }

  private toTranslatedImmersionApplication = () => ({
    ...this._props,
    agencyName: slugify(this._props.agencyName),
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
  ["CANCELLED"]: "Annulée",
};

type PrettySchedule = {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
};
