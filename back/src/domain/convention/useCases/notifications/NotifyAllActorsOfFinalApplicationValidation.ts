import { parseISO } from "date-fns";
import { AgencyDto } from "shared/src/agency/agency.dto";
import {
  calculateTotalImmersionHoursBetweenDate,
  prettyPrintLegacySchedule,
  prettyPrintSchedule,
} from "shared/src/schedule/ScheduleUtils";
import { TransactionalUseCase } from "../../../core/UseCase";
import {
  EmailGateway,
  ValidatedConventionFinalConfirmationParams,
} from "../../ports/EmailGateway";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";

import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { ConventionPoleEmploiUserAdvisorEntity } from "../../../peConnect/dto/PeConnect.dto";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";

export class NotifyAllActorsOfFinalApplicationValidation extends TransactionalUseCase<ConventionDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailGateway: EmailGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionSchema;

  public async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepo.getById(convention.agencyId);

    if (!agency)
      throw new NotFoundError(
        `Unable to send mail. No agency config found for ${convention.agencyId}`,
      );

    const peUserAdvisorOrUndefined =
      await uow.conventionPoleEmploiAdvisorRepo.getByConventionId(
        convention.id,
      );

    const recipients = [
      convention.email,
      convention.mentorEmail,
      ...agency.counsellorEmails,
      ...agency.validatorEmails,
      ...getPeAdvisorEmailIfExist(peUserAdvisorOrUndefined),
    ];

    await this.emailGateway.sendValidatedConventionFinalConfirmation(
      recipients,
      getValidatedApplicationFinalConfirmationParams(agency, convention),
    );
  }
}

// Visible for testing.
export const getValidatedApplicationFinalConfirmationParams = (
  agency: AgencyDto,
  dto: ConventionDto,
): ValidatedConventionFinalConfirmationParams => ({
  totalHours: calculateTotalImmersionHoursBetweenDate({
    dateStart: dto.dateStart,
    dateEnd: dto.dateEnd,
    schedule: dto.schedule,
  }),
  beneficiaryFirstName: dto.firstName,
  beneficiaryLastName: dto.lastName,
  emergencyContact: dto.emergencyContact,
  emergencyContactPhone: dto.emergencyContactPhone,
  dateStart: parseISO(dto.dateStart).toLocaleDateString("fr"),
  dateEnd: parseISO(dto.dateEnd).toLocaleDateString("fr"),
  mentorName: dto.mentor,
  scheduleText: dto.legacySchedule?.description
    ? prettyPrintLegacySchedule(dto.legacySchedule)
    : prettyPrintSchedule(dto.schedule),
  businessName: dto.businessName,
  immersionAddress: dto.immersionAddress || "",
  immersionAppellationLabel: dto.immersionAppellation.appellationLabel,
  immersionActivities: dto.immersionActivities,
  immersionSkills: dto.immersionSkills ?? "Non renseigné",
  sanitaryPrevention:
    dto.sanitaryPrevention && dto.sanitaryPreventionDescription
      ? dto.sanitaryPreventionDescription
      : "non",
  individualProtection: dto.individualProtection ? "oui" : "non",
  questionnaireUrl: agency.questionnaireUrl,
  signature: agency.signature,
  workConditions: dto.workConditions,
});

const getPeAdvisorEmailIfExist = (
  advisor: ConventionPoleEmploiUserAdvisorEntity | undefined,
): [string] | [] => (advisor?.email ? [advisor.email] : []);
