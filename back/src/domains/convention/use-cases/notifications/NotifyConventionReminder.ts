import { format } from "date-fns";
import {
  type AgencyDto,
  type AgencyWithUsersRights,
  type Beneficiary,
  type BeneficiaryCurrentEmployer,
  type BeneficiaryRepresentative,
  type ConventionDto,
  type ConventionReadDto,
  type EstablishmentRepresentative,
  type ExtractFromExisting,
  type GenericActor,
  type ReminderKind,
  type Role,
  type TemplatedEmail,
  type TemplatedSms,
  errors,
  filterNotFalsy,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  isEstablishmentTutorIsEstablishmentRepresentative,
  isSignatoryRole,
  smsRecipientPhoneSchema,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { ConventionReminderPayload } from "../../../core/events/eventPayload.dto";
import { conventionReminderPayloadSchema } from "../../../core/events/eventPayload.schema";
import type {
  NotificationContentAndFollowedIds,
  SaveNotificationsBatchAndRelatedEvent,
} from "../../../core/notifications/helpers/Notification";
import { prepareConventionMagicShortLinkMaker } from "../../../core/short-link/ShortLink";
import type { ShortLinkIdGeneratorGateway } from "../../../core/short-link/ports/ShortLinkIdGeneratorGateway";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

type EmailWithRole = {
  email: string;
  role: Role;
};

type SignatoriesReminderKind = ExtractFromExisting<
  ReminderKind,
  "ReminderForSignatories"
>;

type AgenciesReminderKind = ExtractFromExisting<
  ReminderKind,
  "FirstReminderForAgency" | "LastReminderForAgency"
>;

export class NotifyConventionReminder extends TransactionalUseCase<
  ConventionReminderPayload,
  void
> {
  protected inputSchema = conventionReminderPayloadSchema;

  readonly #timeGateway: TimeGateway;

  readonly #saveNotificationsBatchAndRelatedEvent: SaveNotificationsBatchAndRelatedEvent;

  readonly #generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;

  readonly #shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;

  readonly #config: AppConfig;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    timeGateway: TimeGateway,
    saveNotificationAndRelatedEvent: SaveNotificationsBatchAndRelatedEvent,
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
    config: AppConfig,
  ) {
    super(uowPerformer);

    this.#config = config;
    this.#generateConventionMagicLinkUrl = generateConventionMagicLinkUrl;
    this.#saveNotificationsBatchAndRelatedEvent =
      saveNotificationAndRelatedEvent;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    { conventionId, reminderKind }: ConventionReminderPayload,
    uow: UnitOfWork,
  ) {
    const conventionRead =
      await uow.conventionQueries.getConventionById(conventionId);
    if (!conventionRead) throw errors.convention.notFound({ conventionId });

    if (reminderKind === "ReminderForSignatories")
      return this.#onSignatoriesReminder(reminderKind, conventionRead, uow);

    const agency = await uow.agencyRepository.getById(conventionRead.agencyId);
    if (!agency)
      throw errors.agency.notFound({
        agencyId: conventionRead.agencyId,
      });

    return this.#onAgencyReminder(reminderKind, conventionRead, agency, uow);
  }

  async #makeSignatoryReminderEmail(
    { role, email, firstName, lastName }: GenericActor<Role>,
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<TemplatedEmail> {
    const makeShortMagicLink = prepareConventionMagicShortLinkMaker({
      config: this.#config,
      conventionMagicLinkPayload: {
        id: convention.id,
        role,
        email,
        now: this.#timeGateway.now(),
      },
      generateConventionMagicLinkUrl: this.#generateConventionMagicLinkUrl,
      shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
      uow,
    });

    return {
      kind: "SIGNATORY_REMINDER",
      recipients: [email],
      params: {
        actorFirstName: firstName,
        actorLastName: lastName,
        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        businessName: convention.businessName,
        conventionId: convention.id,
        signatoriesSummary: toSignatoriesSummary(convention).join("\n"),
        magicLinkUrl: isSignatoryRole(role)
          ? await makeShortMagicLink({
              targetRoute: frontRoutes.conventionToSign,
              lifetime: "short",
            })
          : undefined,
      },
    };
  }

  async #onAgencyReminder(
    reminderKind: AgenciesReminderKind,
    conventionRead: ConventionReadDto,
    agencyWithRights: AgencyWithUsersRights,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);
    if (conventionRead.status !== "IN_REVIEW")
      throw errors.convention.forbiddenReminder({
        convention: conventionRead,
        kind: reminderKind,
      });

    await this.#saveNotificationsBatchAndRelatedEvent(
      uow,
      await Promise.all(
        [
          ...agency.counsellorEmails.map(
            (email) =>
              ({
                role: "counsellor",
                email,
              }) satisfies EmailWithRole,
          ),
          ...agency.validatorEmails.map(
            (email) =>
              ({
                role: "validator",
                email,
              }) satisfies EmailWithRole,
          ),
        ].map((emailWithRole) =>
          this.#createAgencyReminderEmail(
            emailWithRole,
            conventionRead,
            agency,
            uow,
            reminderKind,
          ),
        ),
      ),
    );
  }

  async #onSignatoriesReminder(
    kind: SignatoriesReminderKind,
    conventionRead: ConventionReadDto,
    uow: UnitOfWork,
  ): Promise<void> {
    if (!["READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(conventionRead.status))
      throw errors.convention.forbiddenReminder({
        convention: conventionRead,
        kind,
      });

    const signatories = Object.values(conventionRead.signatories);

    const smsSignatories = signatories.filter(
      (signatory) =>
        !signatory.signedAt &&
        smsRecipientPhoneSchema.safeParse(signatory.phone).success,
    );

    const emailActors = [
      ...signatories,
      ...(isEstablishmentTutorIsEstablishmentRepresentative(conventionRead)
        ? []
        : [conventionRead.establishmentTutor]),
    ];

    const templatedEmails: TemplatedEmail[] = await Promise.all(
      emailActors.map((actor) =>
        this.#makeSignatoryReminderEmail(actor, conventionRead, uow),
      ),
    );

    const templatedSms = await Promise.all(
      smsSignatories.map((signatory) =>
        this.#prepareSmsReminderParams(signatory, conventionRead, uow, kind),
      ),
    );

    const followedIds = {
      conventionId: conventionRead.id,
      agencyId: conventionRead.agencyId,
      establishmentSiret: conventionRead.siret,
    };

    await this.#saveNotificationsBatchAndRelatedEvent(uow, [
      ...templatedEmails.map(
        (email): NotificationContentAndFollowedIds => ({
          kind: "email",
          followedIds,
          templatedContent: email,
        }),
      ),
      ...templatedSms.map(
        (sms): NotificationContentAndFollowedIds => ({
          kind: "sms",
          followedIds,
          templatedContent: sms,
        }),
      ),
    ]);
  }

  async #prepareSmsReminderParams(
    { role, email, phone }: GenericActor<Role>,
    convention: ConventionReadDto,
    uow: UnitOfWork,
    kind: SignatoriesReminderKind,
  ): Promise<TemplatedSms> {
    const makeShortMagicLink = prepareConventionMagicShortLinkMaker({
      config: this.#config,
      conventionMagicLinkPayload: {
        id: convention.id,
        role,
        email,
        now: this.#timeGateway.now(),
      },
      generateConventionMagicLinkUrl: this.#generateConventionMagicLinkUrl,
      shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
      uow,
    });

    const shortLink = await makeShortMagicLink({
      targetRoute: frontRoutes.conventionToSign,
      lifetime: "short",
    });

    return {
      kind,
      recipientPhone: phone,
      params: { shortLink },
    };
  }

  async #createAgencyReminderEmail(
    { email, role }: EmailWithRole,
    convention: ConventionReadDto,
    agency: AgencyDto,
    uow: UnitOfWork,
    kind: AgenciesReminderKind,
  ): Promise<NotificationContentAndFollowedIds> {
    const makeShortMagicLink = prepareConventionMagicShortLinkMaker({
      config: this.#config,
      conventionMagicLinkPayload: {
        id: convention.id,
        role,
        email,
        now: this.#timeGateway.now(),
      },
      generateConventionMagicLinkUrl: this.#generateConventionMagicLinkUrl,
      shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
      uow,
    });

    const templatedEmail: TemplatedEmail =
      kind === "FirstReminderForAgency"
        ? {
            kind: "AGENCY_FIRST_REMINDER",
            recipients: [email],
            params: {
              conventionId: convention.id,
              agencyName: agency.name,
              agencyReferentName: getFormattedFirstnameAndLastname(
                convention.agencyReferent ?? {},
              ),
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              businessName: convention.businessName,
              dateStart: convention.dateStart,
              dateEnd: convention.dateEnd,
              agencyMagicLinkUrl: await makeShortMagicLink({
                targetRoute: frontRoutes.manageConvention,
                lifetime: "short",
              }),
            },
          }
        : {
            kind: "AGENCY_LAST_REMINDER",
            recipients: [email],
            params: {
              conventionId: convention.id,
              agencyReferentName: getFormattedFirstnameAndLastname(
                convention.agencyReferent ?? {},
              ),
              beneficiaryFirstName:
                convention.signatories.beneficiary.firstName,
              beneficiaryLastName: convention.signatories.beneficiary.lastName,
              businessName: convention.businessName,
              agencyMagicLinkUrl: await makeShortMagicLink({
                targetRoute: frontRoutes.manageConvention,
                lifetime: "short",
              }),
            },
          };

    return {
      kind: "email",
      followedIds: {
        conventionId: convention.id,
        agencyId: agency.id,
        establishmentSiret: convention.siret,
      },
      templatedContent: templatedEmail,
    };
  }
}

export const toSignatoriesSummary = ({
  signatories,
  businessName,
}: ConventionDto): string[] =>
  [
    beneficiarySummary(signatories.beneficiary),
    beneficiaryRepresentativeSummary(signatories.beneficiaryRepresentative),
    beneficiaryCurrentEmployer(signatories.beneficiaryCurrentEmployer),
    establishmentSummary(signatories.establishmentRepresentative, businessName),
  ].filter(filterNotFalsy);

const beneficiarySummary = (
  beneficiary: Beneficiary<"immersion" | "mini-stage-cci">,
): string =>
  `- ${signStatus(beneficiary.signedAt)} - ${beneficiary.firstName} ${
    beneficiary.lastName
  }, bénéficiaire`;

const beneficiaryRepresentativeSummary = (
  beneficiaryRepresentative: BeneficiaryRepresentative | undefined,
): string | undefined =>
  beneficiaryRepresentative &&
  `- ${signStatus(beneficiaryRepresentative.signedAt)} - ${
    beneficiaryRepresentative.firstName
  } ${beneficiaryRepresentative.lastName}, représentant légal du bénéficiaire`;

const beneficiaryCurrentEmployer = (
  beneficiaryCurrentEmployer: BeneficiaryCurrentEmployer | undefined,
): string | undefined =>
  beneficiaryCurrentEmployer &&
  `- ${signStatus(beneficiaryCurrentEmployer.signedAt)} - ${
    beneficiaryCurrentEmployer.firstName
  } ${beneficiaryCurrentEmployer.lastName}, employeur actuel du bénéficiaire`;

const establishmentSummary = (
  establishmentRepresentative: EstablishmentRepresentative,
  businessName: string,
): string =>
  `- ${signStatus(establishmentRepresentative.signedAt)} - ${
    establishmentRepresentative.firstName
  } ${
    establishmentRepresentative.lastName
  }, représentant l'entreprise ${businessName}`;

const signStatus = (signAt: string | undefined): string =>
  signAt
    ? `√  - A signé le ${format(new Date(signAt), "dd/MM/yyyy")}`
    : `❌ - N'a pas signé`;
