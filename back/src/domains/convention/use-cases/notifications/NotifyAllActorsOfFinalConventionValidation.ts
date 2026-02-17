import { parseISO } from "date-fns";
import { uniqBy } from "ramda";
import {
  type AgencyDto,
  type AgencyModifierRole,
  agencyModifierRoles,
  type ConventionDto,
  type ConventionRole,
  displayEmergencyContactInfos,
  type Email,
  errors,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  isEstablishmentTutorIsEstablishmentRepresentative,
  makeUrlWithQueryParams,
  type TemplatedEmail,
  type WithConventionDto,
  withConventionSchema,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import type { CreateConventionMagicLinkPayloadProperties } from "../../../../utils/jwt";
import type { ConventionFtUserAdvisorEntity } from "../../../core/authentication/ft-connect/dto/FtConnect.dto";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { prepareConventionMagicShortLinkMaker } from "../../../core/short-link/ShortLink";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class NotifyAllActorsOfFinalConventionValidation extends TransactionalUseCase<WithConventionDto> {
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

  public async _execute(
    { convention }: WithConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const [agencyWithRights] = await uow.agencyRepository.getByIds([
      convention.agencyId,
    ]);

    if (!agencyWithRights)
      throw errors.agency.notFound({ agencyId: convention.agencyId });

    const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);

    const recipientsRoleAndEmail: { role: ConventionRole; email: Email }[] =
      uniqBy(
        (recipient) => recipient.email,
        [
          ...Object.values(convention.signatories).map((signatory) => ({
            role: signatory.role,
            email: signatory.email,
          })),
          ...(convention.signatories.establishmentRepresentative.email !==
          convention.establishmentTutor.email
            ? [
                {
                  role: convention.establishmentTutor.role,
                  email: convention.establishmentTutor.email,
                },
              ]
            : []),
          ...agency.validatorEmails.map(
            (validatorEmail): { role: ConventionRole; email: Email } => ({
              role: "validator",
              email: validatorEmail,
            }),
          ),
          ...agency.counsellorEmails.map(
            (counsellorEmail): { role: ConventionRole; email: Email } => ({
              role: "counsellor",
              email: counsellorEmail,
            }),
          ),
          ...getFtAdvisorEmailAndRoleIfExist(
            await uow.conventionFranceTravailAdvisorRepository.getByConventionId(
              convention.id,
            ),
          ),
        ],
      );
    for (const emailAndRole of recipientsRoleAndEmail) {
      const { role, email: recipient } = emailAndRole;
      await this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: await this.#prepareEmail(
          convention,
          role,
          recipient,
          uow,
          agency,
        ),
        followedIds: {
          conventionId: convention.id,
          agencyId: convention.agencyId,
          establishmentSiret: convention.siret,
        },
      });
    }
  }

  async #prepareEmail(
    convention: ConventionDto,
    role: ConventionRole,
    recipient: string,
    uow: UnitOfWork,
    agency: AgencyDto,
  ): Promise<TemplatedEmail> {
    const conventionMagicLinkPayload: CreateConventionMagicLinkPayloadProperties =
      {
        id: convention.id,
        role,
        email: recipient,
        now: this.#timeGateway.now(),
        expOverride:
          this.#timeGateway.now().getTime() + 1000 * 60 * 60 * 24 * 365, // 1 year
      };
    const shouldHaveAssessmentMagicLink =
      (isEstablishmentTutorIsEstablishmentRepresentative(convention) &&
        role === "establishment-representative") ||
      (!isEstablishmentTutorIsEstablishmentRepresentative(convention) &&
        role === "establishment-tutor");

    const { beneficiary, beneficiaryRepresentative } = convention.signatories;

    const makeShortMagicLink = prepareConventionMagicShortLinkMaker({
      config: this.#config,
      conventionMagicLinkPayload,
      generateConventionMagicLinkUrl: this.#generateConventionMagicLinkUrl,
      shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
      uow,
    });

    const magicLink = agencyModifierRoles.includes(role as AgencyModifierRole)
      ? `${this.#config.immersionFacileBaseUrl}${makeUrlWithQueryParams(
          `/${frontRoutes.manageConventionUserConnected}`,
          { conventionId: convention.id },
        )}`
      : await makeShortMagicLink({
          targetRoute: frontRoutes.conventionDocument,
          lifetime: "long",
          singleUse: false,
        });

    return {
      kind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      recipients: [recipient],
      params: {
        conventionId: convention.id,
        internshipKind: convention.internshipKind,
        beneficiaryFirstName: getFormattedFirstnameAndLastname({
          firstname: beneficiary.firstName,
        }),
        beneficiaryLastName: getFormattedFirstnameAndLastname({
          lastname: beneficiary.lastName,
        }),
        beneficiaryBirthdate: beneficiary.birthdate,
        dateStart: parseISO(convention.dateStart).toLocaleDateString("fr"),
        dateEnd: parseISO(convention.dateEnd).toLocaleDateString("fr"),
        establishmentTutorName: getFormattedFirstnameAndLastname({
          firstname: convention.establishmentTutor.firstName,
          lastname: convention.establishmentTutor.lastName,
        }),
        businessName: convention.businessName,
        immersionAppellationLabel:
          convention.immersionAppellation.appellationLabel,
        emergencyContactInfos: displayEmergencyContactInfos({
          beneficiaryRepresentative,
          beneficiary,
        }),
        agencyLogoUrl: agency.logoUrl ?? undefined,
        magicLink,
        assessmentMagicLink: shouldHaveAssessmentMagicLink
          ? await makeShortMagicLink({
              targetRoute: frontRoutes.assessment,
              lifetime: "2Days",
              singleUse: true,
            })
          : undefined,
        validatorName: convention.validators?.agencyValidator
          ? getFormattedFirstnameAndLastname(
              convention.validators.agencyValidator,
            )
          : "",
      },
    };
  }
}

const getFtAdvisorEmailAndRoleIfExist = (
  conventionFtUserAdvisor: ConventionFtUserAdvisorEntity | undefined,
): [{ role: ConventionRole; email: Email }] | [] =>
  conventionFtUserAdvisor?.advisor?.email
    ? [{ role: "validator", email: conventionFtUserAdvisor.advisor.email }]
    : [];
