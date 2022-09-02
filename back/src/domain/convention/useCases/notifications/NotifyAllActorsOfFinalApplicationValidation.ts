import { parseISO } from "date-fns";
import { AgencyDto } from "shared/src/agency/agency.dto";
import {
  Beneficiary,
  ConventionDto,
  Mentor,
} from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";
import {
  calculateTotalImmersionHoursBetweenDate,
  prettyPrintSchedule,
} from "shared/src/schedule/ScheduleUtils";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";

import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { ConventionPoleEmploiUserAdvisorEntity } from "../../../peConnect/dto/PeConnect.dto";
import { EmailGateway } from "../../ports/EmailGateway";

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
    const agency = await uow.agencyRepository.getById(convention.agencyId);

    if (!agency)
      throw new NotFoundError(
        `Unable to send mail. No agency config found for ${convention.agencyId}`,
      );

    const peUserAdvisorOrUndefined =
      await uow.conventionPoleEmploiAdvisorRepository.getByConventionId(
        convention.id,
      );

    const recipients = [
      convention.signatories.beneficiary.email,
      convention.signatories.mentor.email,
      ...agency.counsellorEmails,
      ...agency.validatorEmails,
      ...getPeAdvisorEmailIfExist(peUserAdvisorOrUndefined),
    ];

    await this.emailGateway.sendEmail({
      type: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      recipients,
      params: getValidatedApplicationFinalConfirmationParams(
        agency,
        convention,
      ),
    });
  }
}

// Visible for testing.
export const getValidatedApplicationFinalConfirmationParams = (
  agency: AgencyDto,
  dto: ConventionDto,
) => {
  const beneficiary: Beneficiary = dto.signatories.beneficiary;
  const mentor: Mentor = dto.signatories.mentor;

  return {
    totalHours: calculateTotalImmersionHoursBetweenDate({
      dateStart: dto.dateStart,
      dateEnd: dto.dateEnd,
      schedule: dto.schedule,
    }),
    beneficiaryFirstName: beneficiary.firstName,
    beneficiaryLastName: beneficiary.lastName,
    emergencyContact: beneficiary.emergencyContact,
    emergencyContactPhone: beneficiary.emergencyContactPhone,
    dateStart: parseISO(dto.dateStart).toLocaleDateString("fr"),
    dateEnd: parseISO(dto.dateEnd).toLocaleDateString("fr"),
    mentorName: `${mentor.firstName} ${mentor.lastName}`,
    scheduleText: prettyPrintSchedule(dto.schedule).split("\n"),
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
  };
};

const getPeAdvisorEmailIfExist = (
  advisor: ConventionPoleEmploiUserAdvisorEntity | undefined,
): [string] | [] => (advisor?.email ? [advisor.email] : []);
