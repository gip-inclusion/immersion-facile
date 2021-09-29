import {
  ApplicationSource,
  DemandeImmersionDto,
} from "../../../../shared/DemandeImmersionDto";
import {
  prettyPrintLegacySchedule,
  prettyPrintSchedule,
} from "../../../../shared/ScheduleUtils";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import {
  EmailGateway,
  ValidatedApplicationFinalConfirmationParams,
} from "../../ports/EmailGateway";

const logger = createLogger(__filename);
export class NotifyAllActorsOfFinalApplicationValidation
  implements UseCase<DemandeImmersionDto>
{
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly emailAllowList: Readonly<Set<string>>,
    private readonly unrestrictedEmailSendingSources: Readonly<
      Set<ApplicationSource>
    >,
    private readonly counsellorEmails: Readonly<
      Record<ApplicationSource, string[]>
    >,
  ) {}

  public async execute(dto: DemandeImmersionDto): Promise<void> {
    logger.info(
      {
        demandeImmersionid: dto.id,
      },
      "------------- Entering execute.",
    );

    let recipients = [
      dto.email,
      dto.mentorEmail,
      ...(this.counsellorEmails[dto.source] || []),
    ];
    if (!this.unrestrictedEmailSendingSources.has(dto.source)) {
      recipients = recipients.filter((email) => {
        if (!this.emailAllowList.has(email)) {
          logger.info(`Skipped sending email to: ${email}`);
          return false;
        }
        return true;
      });
    }

    if (recipients.length > 0) {
      await this.emailGateway.sendValidatedApplicationFinalConfirmation(
        recipients,
        getValidatedApplicationFinalConfirmationParams(dto),
      );
    } else {
      logger.info(
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
