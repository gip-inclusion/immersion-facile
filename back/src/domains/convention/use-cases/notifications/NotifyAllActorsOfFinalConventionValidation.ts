import { parseISO } from "date-fns";
import { uniq } from "ramda";
import {
  type AgencyDto,
  type ConventionDto,
  type CreateConventionMagicLinkPayloadProperties,
  concatValidatorNames,
  displayEmergencyContactInfos,
  type Email,
  errors,
  frontRoutes,
  isEstablishmentTutorIsEstablishmentRepresentative,
  type Role,
  type TemplatedEmail,
  type WithConventionDto,
  withConventionSchema,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
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

    const recipientsRoleAndEmail: { role: Role; email: Email }[] = uniq([
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
      ...agency.counsellorEmails.map(
        (counsellorEmail): { role: Role; email: Email } => ({
          role: "counsellor",
          email: counsellorEmail,
        }),
      ),
      ...agency.validatorEmails.map(
        (validatorEmail): { role: Role; email: Email } => ({
          role: "validator",
          email: validatorEmail,
        }),
      ),
      ...getFtAdvisorEmailAndRoleIfExist(
        await uow.conventionFranceTravailAdvisorRepository.getByConventionId(
          convention.id,
        ),
      ),
    ]);
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
    role: Role,
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
        exp: this.#timeGateway.now().getTime() + 1000 * 60 * 60 * 24 * 365, // 1 year
        // UGLY : need to rework, handling of JWT payloads
        ...(role === "back-office" ? { sub: "admin" } : {}),
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

    return {
      kind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      recipients: [recipient],
      params: {
        conventionId: convention.id,
        internshipKind: convention.internshipKind,
        beneficiaryFirstName: beneficiary.firstName,
        beneficiaryLastName: beneficiary.lastName,
        beneficiaryBirthdate: beneficiary.birthdate,
        dateStart: parseISO(convention.dateStart).toLocaleDateString("fr"),
        dateEnd: parseISO(convention.dateEnd).toLocaleDateString("fr"),
        establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,
        businessName: convention.businessName,
        immersionAppellationLabel:
          convention.immersionAppellation.appellationLabel,
        emergencyContactInfos: displayEmergencyContactInfos({
          beneficiaryRepresentative,
          beneficiary,
        }),
        agencyLogoUrl: agency.logoUrl ?? undefined,
        magicLink: await makeShortMagicLink({
          targetRoute: frontRoutes.conventionDocument,
          lifetime: "long",
        }),
        assessmentMagicLink: shouldHaveAssessmentMagicLink
          ? await makeShortMagicLink({
              targetRoute: frontRoutes.assessment,
              lifetime: "long",
            })
          : undefined,
        validatorName: convention.validators?.agencyValidator
          ? concatValidatorNames(convention.validators?.agencyValidator)
          : "",
      },
    };
  }
}

const getFtAdvisorEmailAndRoleIfExist = (
  conventionFtUserAdvisor: ConventionFtUserAdvisorEntity | undefined,
): [{ role: Role; email: Email }] | [] =>
  conventionFtUserAdvisor?.advisor?.email
    ? [{ role: "validator", email: conventionFtUserAdvisor.advisor.email }]
    : [];
