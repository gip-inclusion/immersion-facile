import { values } from "ramda";
import {
  type AgencyDto,
  type ConventionDto,
  type CreateConventionMagicLinkPayloadProperties,
  type Signatory,
  type TemplatedEmail,
  type WithConventionDto,
  errors,
  filterNotFalsy,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  withConventionSchema,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { createLogger } from "../../../../utils/logger";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { prepareConventionMagicShortLinkMaker } from "../../../core/short-link/ShortLink";
import type { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

const logger = createLogger(__filename);

export class NotifySignatoriesThatConventionSubmittedNeedsSignature extends TransactionalUseCase<WithConventionDto> {
  protected inputSchema = withConventionSchema;

  readonly #timeGateway: TimeGateway;

  readonly #shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;

  readonly #generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;

  readonly #config: AppConfig;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    timeGateway: TimeGateway,
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    config: AppConfig,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);

    this.#config = config;
    this.#timeGateway = timeGateway;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
    this.#generateConventionMagicLinkUrl = generateConventionMagicLinkUrl;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  public async _execute(
    { convention }: WithConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    if (convention.status === "PARTIALLY_SIGNED") {
      logger.info({
        message:
          "Skipping sending signature-requiring establishment representative confirmation as convention is already partially signed",
      });
      return;
    }

    const [agencyWithRights] = await uow.agencyRepository.getByIds([
      convention.agencyId,
    ]);
    if (!agencyWithRights)
      throw errors.agency.notFound({ agencyId: convention.agencyId });

    for (const signatory of values(convention.signatories).filter(
      filterNotFalsy,
    )) {
      await this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: await this.#makeEmail(
          signatory,
          convention,
          await agencyWithRightToAgencyDto(uow, agencyWithRights),
          uow,
        ),
        followedIds: {
          conventionId: convention.id,
          agencyId: convention.agencyId,
          establishmentSiret: convention.siret,
        },
      });
    }
  }

  async #makeEmail(
    signatory: Signatory,
    convention: ConventionDto,
    agency: AgencyDto,
    uow: UnitOfWork,
  ): Promise<TemplatedEmail> {
    const {
      id,
      businessName,
      signatories: {
        beneficiary,
        beneficiaryRepresentative,
        establishmentRepresentative,
        beneficiaryCurrentEmployer,
      },
    } = convention;

    const conventionMagicLinkPayload: CreateConventionMagicLinkPayloadProperties =
      {
        id,
        role: signatory.role,
        email: signatory.email,
        now: this.#timeGateway.now(),
      };

    const makeMagicShortLink = prepareConventionMagicShortLinkMaker({
      conventionMagicLinkPayload,
      uow,
      config: this.#config,
      generateConventionMagicLinkUrl: this.#generateConventionMagicLinkUrl,
      shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
    });

    return {
      kind: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
      recipients: [signatory.email],
      params: {
        conventionId: convention.id,
        internshipKind: convention.internshipKind,
        signatoryName: getFormattedFirstnameAndLastname({
          firstname: signatory.firstName,
          lastname: signatory.lastName,
        }),
        beneficiaryName: getFormattedFirstnameAndLastname({
          firstname: beneficiary.firstName,
          lastname: beneficiary.lastName,
        }),
        establishmentTutorName: getFormattedFirstnameAndLastname({
          firstname: convention.establishmentTutor.firstName,
          lastname: convention.establishmentTutor.lastName,
        }),
        establishmentRepresentativeName: getFormattedFirstnameAndLastname({
          firstname: establishmentRepresentative.firstName,
          lastname: establishmentRepresentative.lastName,
        }),
        beneficiaryRepresentativeName:
          beneficiaryRepresentative &&
          getFormattedFirstnameAndLastname({
            firstname: beneficiaryRepresentative.firstName,
            lastname: beneficiaryRepresentative.lastName,
          }),
        beneficiaryCurrentEmployerName:
          beneficiaryCurrentEmployer &&
          getFormattedFirstnameAndLastname({
            lastname: beneficiaryCurrentEmployer.lastName,
            firstname: beneficiaryCurrentEmployer.firstName,
          }),
        conventionSignShortlink: await makeMagicShortLink({
          targetRoute: frontRoutes.conventionToSign,
          lifetime: "short",
          extraQueryParams: {
            mtm_source: "email-signature-link",
          },
        }),
        businessName,
        agencyLogoUrl: agency.logoUrl ?? undefined,
      },
    };
  }
}
