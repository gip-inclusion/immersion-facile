import { format } from "date-fns";
import {
  AgencyDto,
  Beneficiary,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDto,
  ConventionReadDto,
  EstablishmentRepresentative,
  frontRoutes,
  GenericActor,
  isSignatoryRole,
  Role,
  TemplatedEmail,
} from "shared";
import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../../adapters/primary/config/magicLinkUrl";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import {
  ConventionReminderPayload,
  conventionReminderPayloadSchema,
  ReminderKind,
} from "../../../core/eventsPayloads/ConventionReminderPayload";
import { ShortLinkIdGeneratorGateway } from "../../../core/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { prepareMagicShortLinkMaker } from "../../../core/ShortLink";
import { TransactionalUseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import {
  missingAgencyMessage,
  missingConventionMessage,
} from "./NotifyLastSigneeThatConventionHasBeenSigned";

type EmailWithRole = {
  email: string;
  role: Role;
};

export class NotifyConventionReminder extends TransactionalUseCase<
  ConventionReminderPayload,
  void
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private emailGateway: EmailGateway,
    private timeGateway: TimeGateway,
    private readonly generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    private readonly shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
    private readonly config: AppConfig,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionReminderPayloadSchema;

  protected async _execute(
    { conventionId, reminderKind }: ConventionReminderPayload,
    uow: UnitOfWork,
  ) {
    const conventionRead = await uow.conventionQueries.getConventionById(
      conventionId,
    );
    if (!conventionRead)
      throw new NotFoundError(missingConventionMessage(conventionId));

    if (
      reminderKind === "FirstReminderForSignatories" ||
      reminderKind === "LastReminderForSignatories"
    )
      return this.onSignatoriesReminder(reminderKind, conventionRead, uow);

    const [agency] = await uow.agencyRepository.getByIds([
      conventionRead.agencyId,
    ]);

    if (!agency) throw new NotFoundError(missingAgencyMessage(conventionRead));

    if (
      reminderKind === "FirstReminderForAgency" ||
      reminderKind === "LastReminderForAgency"
    )
      return this.onAgencyReminder(reminderKind, conventionRead, agency, uow);
  }

  private async onSignatoriesReminder(
    kind: Extract<
      ReminderKind,
      "FirstReminderForSignatories" | "LastReminderForSignatories"
    >,
    conventionRead: ConventionReadDto,
    uow: UnitOfWork,
  ): Promise<void> {
    if (!["READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(conventionRead.status))
      throw new Error(forbiddenUnsupportedStatusMessage(conventionRead, kind));

    const actors = [
      ...Object.values(conventionRead.signatories),
      conventionRead.establishmentTutor,
    ];

    const emails: TemplatedEmail[] = [
      ...(kind === "FirstReminderForSignatories"
        ? await this.makeSignatoryFirstReminderEmails(
            actors,
            conventionRead,
            uow,
          )
        : []),
      ...(kind === "LastReminderForSignatories"
        ? await this.makeSignatoryLastReminderEmails(
            actors,
            conventionRead,
            uow,
          )
        : []),
    ];
    await Promise.all(
      emails.map((email) => this.emailGateway.sendEmail(email)),
    );
  }

  private async onAgencyReminder(
    reminderKind: Extract<
      ReminderKind,
      "FirstReminderForAgency" | "LastReminderForAgency"
    >,
    conventionRead: ConventionReadDto,
    agency: AgencyDto,
    uow: UnitOfWork,
  ): Promise<void> {
    if (conventionRead.status !== "IN_REVIEW")
      throw new Error(
        forbiddenUnsupportedStatusMessage(conventionRead, reminderKind),
      );

    const emailsWithRole: EmailWithRole[] = [
      ...agency.counsellorEmails.map(
        (email) =>
          ({
            role: "counsellor",
            email,
          } satisfies EmailWithRole),
      ),
      ...agency.validatorEmails.map(
        (email) =>
          ({
            role: "validator",
            email,
          } satisfies EmailWithRole),
      ),
    ];

    const emails: TemplatedEmail[] = [
      ...(reminderKind === "FirstReminderForAgency"
        ? await this.makeAgencyFirstReminderEmails(
            emailsWithRole,
            conventionRead,
            agency,
            uow,
          )
        : []),
      ...(reminderKind === "LastReminderForAgency"
        ? await this.makeAgencyLastReminderEmails(
            emailsWithRole,
            conventionRead,
            uow,
          )
        : []),
    ];

    await Promise.all(
      emails.map((email) => this.emailGateway.sendEmail(email)),
    );
  }

  private makeAgencyFirstReminderEmails(
    emailsWithRole: EmailWithRole[],
    convention: ConventionReadDto,
    agency: AgencyDto,
    uow: UnitOfWork,
  ): Promise<TemplatedEmail[]> {
    return Promise.all(
      emailsWithRole.map(async ({ email, role }) => {
        const makeShortMagicLink = prepareMagicShortLinkMaker({
          config: this.config,
          conventionMagicLinkPayload: {
            id: convention.id,
            role,
            email,
            now: this.timeGateway.now(),
          },
          generateConventionMagicLinkUrl: this.generateConventionMagicLinkUrl,
          shortLinkIdGeneratorGateway: this.shortLinkIdGeneratorGateway,
          uow,
        });
        return {
          type: "AGENCY_FIRST_REMINDER",
          recipients: [email],
          params: {
            agencyName: agency.name,
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            businessName: convention.businessName,
            dateStart: convention.dateStart,
            dateEnd: convention.dateEnd,
            agencyMagicLinkUrl: await makeShortMagicLink(
              frontRoutes.manageConvention,
            ),
          },
        };
      }),
    );
  }

  private makeAgencyLastReminderEmails(
    emailsWithRole: EmailWithRole[],
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<TemplatedEmail[]> {
    return Promise.all(
      emailsWithRole.map(async ({ email, role }) => {
        const makeShortMagicLink = prepareMagicShortLinkMaker({
          config: this.config,
          conventionMagicLinkPayload: {
            id: convention.id,
            role,
            email,
            now: this.timeGateway.now(),
          },
          generateConventionMagicLinkUrl: this.generateConventionMagicLinkUrl,
          shortLinkIdGeneratorGateway: this.shortLinkIdGeneratorGateway,
          uow,
        });
        return {
          type: "AGENCY_LAST_REMINDER",
          recipients: [email],
          params: {
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            businessName: convention.businessName,
            agencyMagicLinkUrl: await makeShortMagicLink(
              frontRoutes.manageConvention,
            ),
          },
        };
      }),
    );
  }

  private makeSignatoryFirstReminderEmails(
    actors: GenericActor<Role>[],
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<TemplatedEmail[]> {
    return Promise.all(
      actors.map(async ({ role, email, firstName, lastName }) => {
        const makeShortMagicLink = prepareMagicShortLinkMaker({
          config: this.config,
          conventionMagicLinkPayload: {
            id: convention.id,
            role,
            email,
            now: this.timeGateway.now(),
          },
          generateConventionMagicLinkUrl: this.generateConventionMagicLinkUrl,
          shortLinkIdGeneratorGateway: this.shortLinkIdGeneratorGateway,
          uow,
        });
        return {
          type: "SIGNATORY_FIRST_REMINDER",
          recipients: [email],
          params: {
            actorFirstName: firstName,
            actorLastName: lastName,
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            businessName: convention.businessName,
            signatoriesSummary: toSignatoriesSummary(convention).join("\n"),
            magicLinkUrl: isSignatoryRole(role)
              ? await makeShortMagicLink(frontRoutes.conventionToSign)
              : undefined,
          },
        };
      }),
    );
  }
  private makeSignatoryLastReminderEmails(
    actors: GenericActor<Role>[],
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<TemplatedEmail[]> {
    return Promise.all(
      actors.map(async ({ email, role, firstName, lastName }) => {
        const makeShortMagicLink = prepareMagicShortLinkMaker({
          config: this.config,
          conventionMagicLinkPayload: {
            id: convention.id,
            role,
            email,
            now: this.timeGateway.now(),
          },
          generateConventionMagicLinkUrl: this.generateConventionMagicLinkUrl,
          shortLinkIdGeneratorGateway: this.shortLinkIdGeneratorGateway,
          uow,
        });
        return {
          type: "SIGNATORY_LAST_REMINDER",
          recipients: [email],
          params: {
            actorFirstName: firstName,
            actorLastName: lastName,
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            businessName: convention.businessName,
            signatoriesSummary: toSignatoriesSummary(convention).join("\n"),
            magicLinkUrl: isSignatoryRole(role)
              ? await makeShortMagicLink(frontRoutes.conventionToSign)
              : undefined,
          },
        };
      }),
    );
  }
}

export const forbiddenUnsupportedStatusMessage = (
  convention: ConventionDto,
  kind: ReminderKind,
): string =>
  `Convention status ${convention.status} is not supported for reminder ${kind}.`;

export const toSignatoriesSummary = ({
  signatories,
  businessName,
}: ConventionDto): string[] =>
  [
    beneficiarySummary(signatories.beneficiary),
    beneficiaryRepresentativeSummary(signatories.beneficiaryRepresentative),
    beneficiaryCurrentEmployer(signatories.beneficiaryCurrentEmployer),
    establishmentSummary(signatories.establishmentRepresentative, businessName),
  ].filter((element): element is string => !!element);

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
    ? `✔️  - A signé le ${format(new Date(signAt), "dd/MM/yyyy")}`
    : `❌ - N'a pas signé`;
