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
import { GenerateConventionMagicLinkUrl } from "../../../../adapters/primary/config/magicLinkUrl";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import {
  ConventionReminderPayload,
  conventionReminderPayloadSchema,
  ReminderType,
} from "../../../core/eventsPayloads/ConventionReminderPayload";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
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
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionReminderPayloadSchema;

  protected async _execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { conventionId, reminderType: type }: ConventionReminderPayload,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    uow: UnitOfWork,
  ) {
    const conventionRead = await uow.conventionQueries.getConventionById(
      conventionId,
    );
    if (!conventionRead)
      throw new NotFoundError(missingConventionMessage(conventionId));

    const agency = await uow.agencyRepository.getById(conventionRead.agencyId);

    if (!agency) throw new NotFoundError(missingAgencyMessage(conventionRead));

    if (type === "FirstReminderForAgency" || type === "LastReminderForAgency")
      return this.onAgencyReminder(type, conventionRead, agency);

    if (type === "FirstReminderForSignatories")
      return this.onSignatoriesReminder(type, conventionRead);

    throw new Error("Not supported.");
  }

  private onSignatoriesReminder(
    type: ReminderType,
    conventionRead: ConventionReadDto,
  ): Promise<void> {
    if (!["READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(conventionRead.status))
      throw new Error(forbiddenUnsupportedStatusMessage(conventionRead, type));

    const actors = [
      ...Object.values(conventionRead.signatories),
      conventionRead.establishmentTutor,
    ];
    return Promise.all(
      this.makeSignatoryReminderEmails(actors, conventionRead).map((email) =>
        this.emailGateway.sendEmail(email),
      ),
    ).then(() => Promise.resolve());
  }

  private onAgencyReminder(
    type: ReminderType,
    conventionRead: ConventionReadDto,
    agency: AgencyDto,
  ): Promise<void> {
    if (conventionRead.status !== "IN_REVIEW")
      throw new Error(forbiddenUnsupportedStatusMessage(conventionRead, type));

    const consellorEmails: EmailWithRole[] = agency.counsellorEmails.map(
      (email) => ({
        role: "counsellor",
        email,
      }),
    );
    const validatorEmails: EmailWithRole[] = agency.validatorEmails.map(
      (email) => ({
        role: "validator",
        email,
      }),
    );
    const emailsWithRole: EmailWithRole[] = [
      ...consellorEmails,
      ...validatorEmails,
    ];

    const { agencyDepartment, agencyName, ...convention } = conventionRead;

    const emails: TemplatedEmail[] = [
      ...(type === "FirstReminderForAgency"
        ? this.makeAgencyFirstReminderEmails(emailsWithRole, convention, agency)
        : []),
      ...(type === "LastReminderForAgency"
        ? this.makeAgencyLastReminderEmails(emailsWithRole, convention)
        : []),
    ];

    return Promise.all(
      emails.map((email) => this.emailGateway.sendEmail(email)),
    ).then(() => Promise.resolve());
  }

  private makeAgencyFirstReminderEmails(
    emailsWithRole: EmailWithRole[],
    convention: ConventionDto,
    agency: AgencyDto,
  ): TemplatedEmail[] {
    return emailsWithRole.map(({ email, role }) => ({
      type: "AGENCY_FIRST_REMINDER",
      recipients: [email],
      params: {
        agencyName: agency.name,
        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        businessName: convention.businessName,
        dateStart: convention.dateStart,
        dateEnd: convention.dateEnd,
        agencyMagicLinkUrl: this.generateConventionMagicLinkUrl({
          id: convention.id,
          role,
          email,
          now: this.timeGateway.now(),
          targetRoute: frontRoutes.manageConvention,
        }),
      },
    }));
  }

  private makeAgencyLastReminderEmails(
    emailsWithRole: EmailWithRole[],
    convention: ConventionDto,
  ): TemplatedEmail[] {
    return emailsWithRole.map(({ email, role }) => ({
      type: "AGENCY_LAST_REMINDER",
      recipients: [email],
      params: {
        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        businessName: convention.businessName,
        agencyMagicLinkUrl: this.generateConventionMagicLinkUrl({
          id: convention.id,
          role,
          email,
          now: this.timeGateway.now(),
          targetRoute: frontRoutes.manageConvention,
        }),
      },
    }));
  }

  private makeSignatoryReminderEmails(
    actors: GenericActor<Role>[],
    convention: ConventionDto,
  ): TemplatedEmail[] {
    return actors.map((actor) => ({
      type: "SIGNATORY_FIRST_REMINDER",
      recipients: [actor.email],
      params: {
        actorFirstName: actor.firstName,
        actorLastName: actor.lastName,
        beneficiaryFirstName: convention.signatories.beneficiary.firstName,
        beneficiaryLastName: convention.signatories.beneficiary.lastName,
        businessName: convention.businessName,
        signatoriesSummary: toSignatoriesSummary(convention).join("\n"),
        magicLinkUrl: isSignatoryRole(actor.role)
          ? this.generateConventionMagicLinkUrl({
              id: convention.id,
              role: actor.role,
              email: actor.email,
              now: this.timeGateway.now(),
              targetRoute: frontRoutes.conventionToSign,
            })
          : undefined,
      },
    }));
  }
}

export const forbiddenUnsupportedStatusMessage = (
  convention: ConventionDto,
  type: ReminderType,
): string =>
  `Convention status ${convention.status} is not supported for reminder ${type}.`;

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
    : `❌ - N'as pas signé`;
