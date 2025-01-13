import { parseISO } from "date-fns";
import { uniq } from "ramda";
import {
  AgencyDto,
  ConventionDto,
  CreateConventionMagicLinkPayloadProperties,
  Email,
  Role,
  TemplatedEmail,
  WithConventionDto,
  concatValidatorNames,
  displayEmergencyContactInfos,
  errors,
  frontRoutes,
  isUrlValid,
  withConventionSchema,
} from "shared";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { TransactionalUseCase } from "../../../core/UseCase";
import { ConventionFtUserAdvisorEntity } from "../../../core/authentication/pe-connect/dto/FtConnect.dto";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { prepareMagicShortLinkMaker } from "../../../core/short-link/ShortLink";
import { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

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
      ...getPeAdvisorEmailAndRoleIfExist(
        await uow.conventionPoleEmploiAdvisorRepository.getByConventionId(
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
        ...(role === "back-office"
          ? { sub: this.#config.backofficeUsername }
          : {}),
      };

    const { beneficiary, beneficiaryRepresentative } = convention.signatories;

    const makeShortMagicLink = prepareMagicShortLinkMaker({
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
        agencyAssessmentDocumentLink:
          agency.questionnaireUrl !== null &&
          isUrlValid(agency.questionnaireUrl)
            ? agency.questionnaireUrl
            : undefined,
        magicLink: await makeShortMagicLink(frontRoutes.conventionDocument),
        validatorName: convention.validators?.agencyValidator
          ? concatValidatorNames(convention.validators?.agencyValidator)
          : "",
      },
    };
  }
}

const getPeAdvisorEmailAndRoleIfExist = (
  conventionPeUserAdvisor: ConventionFtUserAdvisorEntity | undefined,
): [{ role: Role; email: Email }] | [] =>
  conventionPeUserAdvisor?.advisor?.email
    ? [{ role: "validator", email: conventionPeUserAdvisor.advisor.email }]
    : [];
