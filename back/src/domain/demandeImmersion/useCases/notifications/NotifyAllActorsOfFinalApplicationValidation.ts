import {
  ApplicationSource,
  DemandeImmersionDto,
} from "../../../../shared/DemandeImmersionDto";
import {
  prettyPrintLegacySchedule,
  prettyPrintSchedule,
} from "../../../../shared/ScheduleUtils";
import { logger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import {
  EmailGateway,
  ValidatedApplicationFinalConfirmationParams,
} from "../../ports/EmailGateway";

export class NotifyAllActorsOfFinalApplicationValidation
  implements UseCase<DemandeImmersionDto>
{
  private readonly logger = logger.child({
    logsource: "NotifyAllActorsOfFinalApplicationValidation",
  });

  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly emailAllowList: Readonly<Set<string>>,
    private readonly unrestrictedEmailSendingSources: Readonly<
      Set<ApplicationSource>
    >,
  ) {}

  public async execute(dto: DemandeImmersionDto): Promise<void> {
    this.logger.info(
      {
        demandeImmersionid: dto.id,
      },
      "------------- Entering execute.",
    );

    // TODO: Add advisor to the list of recipients.
    let recipients = [dto.email, dto.mentorEmail];
    if (!this.unrestrictedEmailSendingSources.has(dto.source)) {
      recipients = recipients.filter((email) => this.emailAllowList.has(email));
    }

    if (recipients.length > 0) {
      await this.emailGateway.sendValidatedApplicationFinalConfirmation(
        recipients,
        getValidatedApplicationFinalConfirmationParams(dto),
      );
    } else {
      this.logger.info(
        {
          id: dto.id,
          recipients,
          source: dto.source,
        },
        "Sending validation confirmation email skipped.",
      );
    }
  }
}

const getSignature = (source: ApplicationSource): string => {
  switch (source) {
    case "BOULOGNE_SUR_MER":
      return "L'équipe de l'AMIE du Boulonnais";
    case "NARBONNE":
      return "L'équipe de la Mission Locale de Narbonne";
    default:
      return "L'immersion facile";
  }
};

// Visible for testing.
export const getQuestionnaireUrl = (source: ApplicationSource): string => {
  switch (source) {
    case "BOULOGNE_SUR_MER":
      return "https://docs.google.com/document/d/1LLNoYByQzU6PXmOTN-MHbrhfOOglvTm1dBuzUzgesow/view";
    case "NARBONNE":
      return "https://drive.google.com/file/d/1GP4JX21uF5RCBk8kbjWtgZjiBBHPYSFO/view";
    default:
      return "";
  }
};

// Visible for testing.
export const getValidatedApplicationFinalConfirmationParams = (
  dto: DemandeImmersionDto,
): ValidatedApplicationFinalConfirmationParams => {
  return {
    beneficiaryFirstName: dto.firstName,
    beneficiaryLastName: dto.lastName,
    dateStart: dto.dateStart,
    dateEnd: dto.dateEnd,
    mentorName: dto.mentor,
    scheduleText: dto.legacySchedule?.description
      ? prettyPrintLegacySchedule(dto.legacySchedule)
      : prettyPrintSchedule(dto.schedule),
    businessName: dto.businessName,
    immersionAddress: dto.immersionAddress || "",
    immersionProfession: dto.immersionProfession,
    immersionActivities: dto.immersionActivities,
    sanitaryPrevention:
      dto.sanitaryPrevention && dto.sanitaryPreventionDescription
        ? dto.sanitaryPreventionDescription
        : "non",
    individualProtection: dto.individualProtection ? "oui" : "non",
    questionnaireUrl: getQuestionnaireUrl(dto.source),
    signature: getSignature(dto.source),
  };
};
