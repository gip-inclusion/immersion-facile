import {
  type AgencyWithUsersRights,
  type ConventionDto,
  errors,
  frontRoutes,
  type Signatory,
  type SignatoryRole,
  type TemplatedEmail,
  type WithConventionDto,
  withConventionSchema,
} from "shared";
import type { GenerateConventionMagicLinkUrl } from "../../../../config/bootstrap/magicLinkUrl";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class NotifyLastSigneeThatConventionHasBeenSigned extends TransactionalUseCase<WithConventionDto> {
  protected inputSchema = withConventionSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;

  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    generateConventionStatusLinkUrl: GenerateConventionMagicLinkUrl,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
    this.#generateConventionMagicLinkUrl = generateConventionStatusLinkUrl;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    { convention }: WithConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const savedConvention = await uow.conventionRepository.getById(
      convention.id,
    );

    if (!savedConvention)
      throw errors.convention.notFound({ conventionId: convention.id });

    const [agency] = await uow.agencyRepository.getByIds([
      savedConvention.agencyId,
    ]);

    if (!agency)
      throw errors.agency.notFound({
        agencyId: savedConvention.agencyId,
      });

    return this.#onRepositoryConvention(uow, savedConvention, agency);
  }

  #emailToSend(
    convention: ConventionDto,
    lastSignee: { signedAt: string; email: string; role: SignatoryRole },
    agency: AgencyWithUsersRights,
  ): TemplatedEmail {
    const magicLink = this.#generateConventionMagicLinkUrl({
      targetRoute: frontRoutes.manageConvention,
      id: convention.id,
      role: lastSignee.role,
      email: lastSignee.email,
      now: this.#timeGateway.now(),
      lifetime: "long",
    });

    return {
      kind: "SIGNEE_HAS_SIGNED_CONVENTION",
      params: {
        agencyLogoUrl: agency.logoUrl ?? undefined,
        internshipKind: convention.internshipKind,
        conventionId: convention.id,
        signedAt: lastSignee.signedAt,
        magicLink,
        agencyName: agency.name,
      },
      recipients: [lastSignee.email],
    };
  }

  #lastSigneeEmail(
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

  async #onRepositoryConvention(
    uow: UnitOfWork,
    convention: ConventionDto,
    agency: AgencyWithUsersRights,
  ): Promise<void> {
    const lastSigneeEmail = this.#lastSigneeEmail(
      Object.values(convention.signatories),
    );
    if (lastSigneeEmail) {
      await this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: this.#emailToSend(
          convention,
          lastSigneeEmail,
          agency,
        ),
        followedIds: {
          conventionId: convention.id,
          agencyId: convention.agencyId,
          establishmentSiret: convention.siret,
        },
      });
      return;
    }
    throw errors.convention.noSignatoryHasSigned({
      conventionId: convention.id,
    });
  }
}
