import {
  AgencyDto,
  ConventionDto,
  ConventionId,
  conventionSchema,
  frontRoutes,
  Signatory,
  SignatoryRole,
  TemplatedEmail,
} from "shared";
import { GenerateConventionMagicLinkUrl } from "../../../../adapters/primary/config/magicLinkUrl";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";

export const missingConventionMessage = (conventionId: ConventionId) =>
  `Missing convention ${conventionId} on convention repository.`;

export const missingAgencyMessage = (convention: ConventionDto) =>
  `Missing agency '${convention.agencyId}' on agency repository.`;

export const noSignatoryMessage = (convention: ConventionDto): string =>
  `No signatories has signed the convention id ${convention.id}.`;

export class NotifyLastSigneeThatConventionHasBeenSigned extends TransactionalUseCase<ConventionDto> {
  protected inputSchema = conventionSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    private readonly generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const savedConvention = await uow.conventionRepository.getById(
      convention.id,
    );
    if (!savedConvention)
      throw new Error(missingConventionMessage(convention.id));
    const [agency] = await uow.agencyRepository.getByIds([
      savedConvention.agencyId,
    ]);
    if (!agency) throw new Error(missingAgencyMessage(savedConvention));
    return this.onRepositoryConvention(uow, savedConvention, agency);
  }

  private emailToSend(
    convention: ConventionDto,
    lastSignee: { signedAt: string; email: string; role: SignatoryRole },
    agency: AgencyDto,
  ): TemplatedEmail {
    const conventionStatusLink = this.generateConventionMagicLinkUrl({
      targetRoute: frontRoutes.conventionStatusDashboard,
      id: convention.id,
      role: lastSignee.role,
      email: lastSignee.email,
      now: this.timeGateway.now(),
    });

    return {
      kind: "SIGNEE_HAS_SIGNED_CONVENTION",
      params: {
        agencyLogoUrl: agency.logoUrl,
        internshipKind: convention.internshipKind,
        conventionId: convention.id,
        signedAt: lastSignee.signedAt,
        conventionStatusLink,
      },
      recipients: [lastSignee.email],
    };
  }

  private lastSigneeEmail(
    signatories: Signatory[],
  ): { signedAt: string; email: string; role: SignatoryRole } | undefined {
    const signatoryEmailsOrderedBySignedAt = signatories
      .filter(
        (
          signatory,
        ): signatory is Signatory & {
          signedAt: string;
        } => signatory.signedAt !== undefined,
      )
      .sort((a, b) => (a.signedAt < b.signedAt ? -1 : 0))
      .map(({ email, signedAt, role }) => ({
        email,
        signedAt,
        role,
      }));
    return signatoryEmailsOrderedBySignedAt.at(-1);
  }

  private onRepositoryConvention(
    uow: UnitOfWork,
    convention: ConventionDto,
    agency: AgencyDto,
  ): Promise<void> {
    const lastSigneeEmail = this.lastSigneeEmail(
      Object.values(convention.signatories),
    );
    if (lastSigneeEmail)
      return this.saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: this.emailToSend(convention, lastSigneeEmail, agency),
        followedIds: {
          conventionId: convention.id,
          agencyId: convention.agencyId,
          establishmentSiret: convention.siret,
        },
      });
    throw new Error(noSignatoryMessage(convention));
  }
}
