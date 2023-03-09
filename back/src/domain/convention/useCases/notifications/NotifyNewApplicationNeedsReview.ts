import {
  AgencyDto,
  ConventionDto,
  conventionSchema,
  ConventionStatus,
  CreateConventionMagicLinkPayloadProperties,
  frontRoutes,
  Role,
} from "shared";
import { GenerateConventionMagicLinkUrl } from "../../../../adapters/primary/config/magicLinkUrl";
import { createLogger } from "../../../../utils/logger";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

const logger = createLogger(__filename);

export class NotifyNewApplicationNeedsReview extends TransactionalUseCase<ConventionDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateConventionMagicLinkUrl,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionSchema;

  public async _execute(
    conventionDto: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepository.getById(conventionDto.agencyId);

    if (!agency) {
      logger.error(
        { agencyId: conventionDto.agencyId },
        "No Agency Config found for this agency code",
      );
      return;
    }

    const recipients = determineRecipients(conventionDto.status, agency);
    logger.debug("conventionDto.status : " + conventionDto.status);

    if (!recipients) {
      logger.error(
        {
          applicationId: conventionDto.id,
          status: conventionDto.status,
          agencyId: conventionDto.agencyId,
        },
        "Unable to find appropriate recipient for validation notification.",
      );
      return;
    }

    logger.info(
      {
        recipients,
        applicationId: conventionDto.id,
      },
      "Sending Mail to review an immersion",
    );

    await Promise.all(
      recipients.emails.map((email) => {
        const magicLinkCommonFields: CreateConventionMagicLinkPayloadProperties =
          {
            id: conventionDto.id,
            role: recipients.role,
            email,
            now: this.timeGateway.now(),
          };
        return this.emailGateway.sendEmail({
          type: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
          recipients: [email],
          params: {
            internshipKind: conventionDto.internshipKind,
            businessName: conventionDto.businessName,
            magicLink: this.generateMagicLinkFn({
              ...magicLinkCommonFields,
              targetRoute: frontRoutes.manageConvention,
            }),
            conventionStatusLink: this.generateMagicLinkFn({
              ...magicLinkCommonFields,
              targetRoute: frontRoutes.conventionStatusDashboard,
            }),
            beneficiaryFirstName:
              conventionDto.signatories.beneficiary.firstName,
            beneficiaryLastName: conventionDto.signatories.beneficiary.lastName,
            possibleRoleAction:
              recipients.role === "counsellor"
                ? "en vérifier l'éligibilité"
                : "en considérer la validation",
            agencyLogoUrl: agency.logoUrl,
          },
        });
      }),
    );

    logger.info(
      {
        recipients,
        conventionId: conventionDto.id,
      },
      "Mail to review an immersion sent",
    );
  }
}

type Recipients = {
  role: Role;
  emails: string[];
};

const determineRecipients = (
  status: ConventionStatus,
  agency: AgencyDto,
): Recipients | undefined => {
  const hasCounsellorEmails = agency.counsellorEmails.length > 0;
  const hasValidatorEmails = agency.validatorEmails.length > 0;
  const hasAdminEmails = agency.adminEmails.length > 0;

  switch (status) {
    case "IN_REVIEW": {
      if (hasCounsellorEmails)
        return { role: "counsellor", emails: agency.counsellorEmails };
      if (hasValidatorEmails)
        return { role: "validator", emails: agency.validatorEmails };
      return;
    }
    case "ACCEPTED_BY_COUNSELLOR":
      return hasValidatorEmails
        ? { role: "validator", emails: agency.validatorEmails }
        : undefined;
    case "ACCEPTED_BY_VALIDATOR":
      return hasAdminEmails
        ? { role: "backOffice", emails: agency.adminEmails }
        : undefined;
    default:
      // This notification may fire when using the /debug/populate route, with
      // statuses not included in the above list. Ignore this case.
      return;
  }
};
