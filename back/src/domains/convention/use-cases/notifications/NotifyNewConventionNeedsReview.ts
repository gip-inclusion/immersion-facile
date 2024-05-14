import {
  AgencyDto,
  ConventionStatus,
  Role,
  TemplatedEmail,
  WithConventionDto,
  concatValidatorNames,
  frontRoutes,
  withConventionSchema,
} from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { createLogger } from "../../../../utils/logger";
import { TransactionalUseCase } from "../../../core/UseCase";
import { PeConnectImmersionAdvisorDto } from "../../../core/authentication/pe-connect/dto/PeConnectAdvisor.dto";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { prepareMagicShortLinkMaker } from "../../../core/short-link/ShortLink";
import { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

const logger = createLogger(__filename);

export class NotifyNewConventionNeedsReview extends TransactionalUseCase<WithConventionDto> {
  protected inputSchema = withConventionSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;

  readonly #timeGateway: TimeGateway;

  readonly #shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;

  readonly #config: AppConfig;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    timeGateway: TimeGateway,
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
    config: AppConfig,
  ) {
    super(uowPerformer);

    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#generateConventionMagicLinkUrl = generateConventionMagicLinkUrl;
    this.#timeGateway = timeGateway;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
    this.#config = config;
  }

  protected async _execute(
    { convention }: WithConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepository.getById(convention.agencyId);

    if (!agency) {
      logger.error(
        { agencyId: convention.agencyId },
        "No Agency Config found for this agency code",
      );
      return;
    }
    const conventionAdvisorEntity =
      await uow.conventionPoleEmploiAdvisorRepository.getByConventionId(
        convention.id,
      );
    const peAdvisor = conventionAdvisorEntity?.advisor;

    const recipients = determineRecipients(
      convention.status,
      agency,
      peAdvisor,
    );
    logger.debug(`conventionDto.status : ${convention.status}`);

    if (!recipients) {
      logger.error(
        {
          conventionId: convention.id,
          status: convention.status,
          agencyId: convention.agencyId,
        },
        "Unable to find appropriate recipient for validation notification.",
      );
      return;
    }

    logger.info(
      {
        recipients,
        conventionId: convention.id,
      },
      "Sending Mail to review an immersion",
    );

    const emails: TemplatedEmail[] = await Promise.all(
      recipients.map(async (recipient) => {
        const makeShortMagicLink = prepareMagicShortLinkMaker({
          config: this.#config,
          conventionMagicLinkPayload: {
            id: convention.id,
            role: recipient.role,
            email: recipient.email,
            now: this.#timeGateway.now(),
          },
          generateConventionMagicLinkUrl: this.#generateConventionMagicLinkUrl,
          shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
          uow,
        });

        return {
          kind: "NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION",
          recipients: [recipient.email],
          params: {
            agencyLogoUrl: agency.logoUrl ?? undefined,
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            businessName: convention.businessName,
            conventionId: convention.id,
            conventionStatusLink: await makeShortMagicLink(
              frontRoutes.conventionStatusDashboard,
            ),
            internshipKind: convention.internshipKind,
            magicLink: await makeShortMagicLink(frontRoutes.manageConvention),
            possibleRoleAction:
              recipient.role === "counsellor"
                ? "en vérifier l'éligibilité"
                : "en considérer la validation",
            validatorName: convention.validators?.agencyCounsellor
              ? concatValidatorNames(convention.validators?.agencyCounsellor)
              : "",
            peAdvisor: recipient.peAdvisor,
          },
        };
      }),
    );

    await Promise.all(
      emails.map((email) =>
        this.#saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: email,
          followedIds: {
            conventionId: convention.id,
            agencyId: convention.agencyId,
            establishmentSiret: convention.siret,
          },
        }),
      ),
    );

    logger.info(
      {
        recipients,
        conventionId: convention.id,
      },
      "Mail to review an immersion sent",
    );
  }
}

type Recipient = {
  role: Role;
  email: string;
  peAdvisor:
    | {
        recipientIsPeAdvisor: boolean;
        firstName: string;
        lastName: string;
        email: string;
      }
    | undefined;
};

const determineRecipients = (
  status: ConventionStatus,
  agency: AgencyDto,
  peAdvisor: PeConnectImmersionAdvisorDto | undefined,
): Recipient[] => {
  const hasCounsellorEmails = agency.counsellorEmails.length > 0;
  const hasValidatorEmails = agency.validatorEmails.length > 0;

  switch (status) {
    case "IN_REVIEW": {
      if (hasCounsellorEmails)
        return agency.counsellorEmails.map(
          (email): Recipient => ({
            role: "counsellor",
            email,
            peAdvisor: undefined,
          }),
        );

      if (peAdvisor) {
        const validatorRecipients = agency.validatorEmails.map(
          (email): Recipient => ({
            role: "validator",
            email,
            peAdvisor: {
              recipientIsPeAdvisor: false,
              ...peAdvisor,
            },
          }),
        );

        return [
          {
            role: "validator",
            email: peAdvisor.email,
            peAdvisor: {
              recipientIsPeAdvisor: true,
              ...peAdvisor,
            },
          },
          ...validatorRecipients,
        ];
      }

      if (hasValidatorEmails)
        return agency.validatorEmails.map(
          (email): Recipient => ({
            role: "validator",
            email,
            peAdvisor: undefined,
          }),
        );

      return [];
    }
    case "ACCEPTED_BY_COUNSELLOR":
      if (peAdvisor) {
        const validatorRecipients = agency.validatorEmails.map(
          (email): Recipient => ({
            role: "validator",
            email,
            peAdvisor: {
              recipientIsPeAdvisor: false,
              ...peAdvisor,
            },
          }),
        );

        return [
          {
            role: "validator",
            email: peAdvisor.email,
            peAdvisor: {
              recipientIsPeAdvisor: true,
              ...peAdvisor,
            },
          },
          ...validatorRecipients,
        ];
      }

      return agency.validatorEmails.map(
        (email): Recipient => ({
          role: "validator",
          email,
          peAdvisor: undefined,
        }),
      );

    default:
      // This notification may fire when using the /debug/populate route, with
      // statuses not included in the above list. Ignore this case.
      return [];
  }
};
