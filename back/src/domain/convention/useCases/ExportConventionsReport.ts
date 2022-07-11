import { format } from "date-fns";
import { groupBy, map, prop } from "ramda";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { FederatedIdentity } from "shared/src/federatedIdentities/federatedIdentity.dto";
import { pipeWithValue } from "shared/src/pipeWithValue";
import {
  calculateTotalImmersionHoursBetweenDate,
  calculateWeeklyHoursFromSchedule,
  prettyPrintComplexScheduleSummary,
} from "shared/src/schedule/ScheduleUtils";
import { OmitFromExistingKeys } from "shared/src/utils";
import slugify from "slugify";
import { z } from "zod";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class ExportConventionsReport extends TransactionalUseCase<string> {
  inputSchema = z.string();

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    archivePath: string,
    uow: UnitOfWork,
  ): Promise<void> {
    const report = pipeWithValue(
      await uow.conventionQueries.getAllConventionsForExport(),
      map(toImmersionApplicationReadyForExport),
      groupBy(prop("agencyName")),
    );
    await uow.reportingGateway.exportConventions({
      report,
      archivePath,
    });
  }
}

export const toImmersionApplicationReadyForExport = (
  conventionRaw: ConventionRawBeforeExport,
): ConventionReadyForExport => ({
  ...toTranslatedConvention(conventionRaw),
  weeklyHours: calculateWeeklyHoursFromSchedule(conventionRaw.schedule),
  totalHours: calculateTotalImmersionHoursBetweenDate({
    dateStart: conventionRaw.dateStart,
    dateEnd: conventionRaw.dateEnd,
    schedule: conventionRaw.schedule,
  }),
  formatedDateEnd: format(new Date(conventionRaw.dateEnd), "dd/MM/yyyy"),
  formatedDateStart: format(new Date(conventionRaw.dateStart), "dd/MM/yyyy"),
  formatedDateSubmission: format(
    new Date(conventionRaw.dateSubmission),
    "dd/MM/yyyy",
  ),
  formatedDateValidation: conventionRaw.dateValidation
    ? format(new Date(conventionRaw.dateValidation), "dd/MM/yyyy")
    : "",
  planning: prettyPrintComplexScheduleSummary(
    conventionRaw.schedule.complexSchedule,
  ),
  formatedFederatedIdentity: toFormatedFederatedIdentity(
    conventionRaw.federatedIdentity,
  ),
});

type TranslatedFields =
  | "status"
  | "beneficiaryAccepted"
  | "enterpriseAccepted"
  | "federatedIdentity"
  | "schedule";

export type ConventionReadyForExport = OmitFromExistingKeys<
  ConventionRawBeforeExport,
  TranslatedFields
> & {
  formatedDateSubmission: string;
  formatedDateStart: string;
  formatedDateEnd: string;
  formatedDateValidation: string;
  formatedFederatedIdentity: string;
  status: string;
  beneficiaryAccepted: string;
  enterpriseAccepted: string;
  totalHours: number;
  weeklyHours: number[];
  planning: string;
};

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
  | "dateValidation"
  | "businessName"
  | "emergencyContact"
  | "emergencyContactPhone"
  | "mentor"
  | "mentorPhone"
  | "mentorEmail"
  | "immersionObjective"
  | "beneficiaryAccepted"
  | "enterpriseAccepted"
  | "siret"
  | "workConditions"
  | "federatedIdentity"
  | "schedule";

export type ConventionRawBeforeExport = Pick<ConventionDto, KeysForExport> & {
  agencyName: string;
  immersionProfession: string;
};

const toFormatedFederatedIdentity = (
  federatedIdentity: FederatedIdentity | undefined,
): string =>
  federatedIdentity
    ? `${federatedIdentity.replace("peConnect", "peExternalId")}`
    : "Pas d'identité fédéré";

const toTranslatedConvention = (props: ConventionRawBeforeExport) => {
  const { schedule, federatedIdentity, ...filteredProps } = props;

  return {
    ...filteredProps,
    agencyName: slugify(props.agencyName),
    status: translateStatus[props.status],
    beneficiaryAccepted: translateBoolean(props.beneficiaryAccepted),
    enterpriseAccepted: translateBoolean(props.enterpriseAccepted),
  };
};

const translateBoolean = (value: boolean): string => (value ? "OUI" : "NON");

const translateStatus: Record<string, string> = {
  ["DRAFT"]: "Brouillon",
  ["READY_TO_SIGN"]: "Prêt à signer",
  ["PARTIALLY_SIGNED"]: "Signé partiellement",
  ["IN_REVIEW"]: "Demande à étudier",
  ["ACCEPTED_BY_COUNSELLOR"]: "Éligible",
  ["ACCEPTED_BY_VALIDATOR"]: "Validé par la structure",
  ["REJECTED"]: "Refusée",
  ["CANCELLED"]: "Annulée",
};
