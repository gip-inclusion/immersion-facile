import {
  AgencyDto,
  ConventionDto,
  conventionSchema,
  frontRoutes,
  Role,
} from "shared";
import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../../adapters/primary/config/magicLinkUrl";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import { ShortLinkIdGeneratorGateway } from "../../../core/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { prepareMagicShortLinkMaker } from "../../../core/ShortLink";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";

export class NotifyToAgencyApplicationSubmitted extends TransactionalUseCase<
  ConventionDto,
  void
> {
  protected inputSchema = conventionSchema;

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

    this.#config = config;
    this.#generateConventionMagicLinkUrl = generateConventionMagicLinkUrl;
    this.#timeGateway = timeGateway;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  protected async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);
    if (!agency) {
      throw new NotFoundError(
        `Unable to send mail. No agency config found for ${convention.agencyId}`,
      );
    }

    const hasCounsellors = agency.counsellorEmails.length > 0;

    const recipients: {
      recipients: string[];
      role: Role;
    } = hasCounsellors
      ? {
          recipients: agency.counsellorEmails,
          role: "counsellor",
        }
      : {
          recipients: agency.validatorEmails,
          role: "validator",
        };

    return this.#sendEmailToRecipients({
      agency,
      convention,
      ...recipients,
      warning: await this.#makeWarning(agency, convention, uow),
      uow,
    });
  }

  async #makeWarning(
    agency: AgencyDto,
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<string | undefined> {
    if (agency.kind !== "pole-emploi") return;
    const conventionAdsivorEntity =
      await uow.conventionPoleEmploiAdvisorRepository.getByConventionId(
        convention.id,
      );
    const advisor = conventionAdsivorEntity?.advisor;
    return !advisor
      ? "Merci de vérifier le conseiller référent associé à ce bénéficiaire."
      : `Un mail a également été envoyé au conseiller référent (${advisor.firstName} ${advisor.lastName} - ${advisor.email})`;
  }

  async #sendEmailToRecipients({
    agency,
    recipients,
    convention,
    role,
    warning,
    uow,
  }: {
    recipients: string[];
    agency: AgencyDto;
    convention: ConventionDto;
    role: Role;
    warning?: string;
    uow: UnitOfWork;
  }) {
    await Promise.all(
      recipients.map(async (email) => {
        const makeMagicShortLink = prepareMagicShortLinkMaker({
          conventionMagicLinkPayload: {
            id: convention.id,
            role,
            email,
            now: this.#timeGateway.now(),
          },
          uow,
          config: this.#config,
          generateConventionMagicLinkUrl: this.#generateConventionMagicLinkUrl,
          shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
        });

        return this.#saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
            recipients: [email],
            params: {
              internshipKind: convention.internshipKind,
              agencyName: agency.name,
              businessName: convention.businessName,
              dateEnd: convention.dateEnd,
              dateStart: convention.dateStart,
              conventionId: convention.id,
              firstName: convention.signatories.beneficiary.firstName,
              lastName: convention.signatories.beneficiary.lastName,
              magicLink: await makeMagicShortLink(frontRoutes.manageConvention),
              conventionStatusLink: await makeMagicShortLink(
                frontRoutes.conventionStatusDashboard,
              ),
              agencyLogoUrl: agency.logoUrl,
              warning,
            },
          },
          followedIds: {
            conventionId: convention.id,
            agencyId: convention.agencyId,
            establishmentSiret: convention.siret,
          },
        });
      }),
    );
  }
}
