import {
  AgencyDto,
  ConventionDto,
  ConventionReadDto,
  frontRoutes,
  Role,
  TemplatedEmail,
} from "shared";
import { GenerateConventionMagicLinkUrl } from "../../../../adapters/primary/config/magicLinkUrl";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import {
  ConventionSignReminderPayload,
  conventionSignReminderPayloadSchema,
  ReminderType,
} from "../../../core/eventsPayloads/ConventionSignReminderPayload";
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

export class NotifyThatConventionStillNeedToBeSigned extends TransactionalUseCase<
  ConventionSignReminderPayload,
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

  inputSchema = conventionSignReminderPayloadSchema;

  protected async _execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { conventionId, type }: ConventionSignReminderPayload,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    uow: UnitOfWork,
  ) {
    const convention = await uow.conventionQueries.getConventionById(
      conventionId,
    );
    if (!convention)
      throw new NotFoundError(missingConventionMessage(conventionId));
    const agency = await uow.agencyRepository.getById(convention.agencyId);
    if (!agency) throw new NotFoundError(missingAgencyMessage(convention));
    if (type === "FirstReminderForAgency" || type === "LastReminderForAgency")
      return this.onAgencyReminder(type, convention, agency);
    throw new Error("Method not implemented.");
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
}

export const forbiddenUnsupportedStatusMessage = (
  convention: ConventionDto,
  type: ReminderType,
): string =>
  `Convention status ${convention.status} is not supported for reminder ${type}.`;
