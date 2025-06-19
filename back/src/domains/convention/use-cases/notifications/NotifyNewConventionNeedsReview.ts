import {
  type AgencyDto,
  type ConventionStatus,
  concatValidatorNames,
  frontRoutes,
  getFullname,
  type Role,
  type TemplatedEmail,
  type WithConventionDto,
  withConventionSchema,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { createLogger } from "../../../../utils/logger";
import type { FtConnectImmersionAdvisorDto } from "../../../core/authentication/ft-connect/dto/FtConnectAdvisor.dto";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { prepareConventionMagicShortLinkMaker } from "../../../core/short-link/ShortLink";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

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
      logger.error({
        agencyId: convention.agencyId,
        message: "No Agency Config found for this agency code",
      });
      return;
    }
    const conventionAdvisorEntity =
      await uow.conventionFranceTravailAdvisorRepository.getByConventionId(
        convention.id,
      );
    const peAdvisor = conventionAdvisorEntity?.advisor;

    const recipients = determineRecipients(
      convention.status,
      await agencyWithRightToAgencyDto(uow, agency),
      peAdvisor,
    );

    if (!recipients) {
      logger.error({
        conventionId: convention.id,
        agencyId: convention.agencyId,
        message:
          "Unable to find appropriate recipient for validation notification.",
      });
      return;
    }

    const emails: TemplatedEmail[] = await Promise.all(
      recipients.map(async (recipient) => {
        const makeShortMagicLink = prepareConventionMagicShortLinkMaker({
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
            agencyReferentName: getFullname(
              convention.agencyReferent?.firstname,
              convention.agencyReferent?.lastname,
            ),
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            businessName: convention.businessName,
            conventionId: convention.id,
            internshipKind: convention.internshipKind,
            magicLink: await makeShortMagicLink({
              targetRoute: frontRoutes.manageConvention,
              lifetime: "short",
            }),
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
  }
}

export type Recipient = {
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
  peAdvisor: FtConnectImmersionAdvisorDto | undefined,
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
