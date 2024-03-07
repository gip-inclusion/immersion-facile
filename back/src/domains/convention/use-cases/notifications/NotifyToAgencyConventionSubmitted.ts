import {
  AgencyDto,
  ConventionDto,
  Role,
  WithConventionDto,
  frontRoutes,
  withConventionSchema,
} from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { NotFoundError } from "../../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { prepareMagicShortLinkMaker } from "../../../core/short-link/ShortLink";
import { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class NotifyToAgencyConventionSubmitted extends TransactionalUseCase<
  WithConventionDto,
  void
> {
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

    this.#config = config;
    this.#generateConventionMagicLinkUrl = generateConventionMagicLinkUrl;
    this.#timeGateway = timeGateway;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  protected async _execute(
    { convention }: WithConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);
    if (!agency) {
      throw new NotFoundError(
        `Unable to send mail. No agency config found for ${convention.agencyId}`,
      );
    }

    const conventionAdsivorEntity =
      await uow.conventionPoleEmploiAdvisorRepository.getByConventionId(
        convention.id,
      );

    if (conventionAdsivorEntity?.advisor)
      return this.#sendEmailToRecipients({
        agency,
        convention,
        recipients: [conventionAdsivorEntity.advisor.email],
        role: "validator",
        warning: undefined,
        uow,
      });

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
      warning:
        agency.kind === "pole-emploi"
          ? "Merci de vérifier le conseiller référent associé à ce bénéficiaire."
          : undefined,
      uow,
    });
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
              agencyLogoUrl: agency.logoUrl ?? undefined,
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
