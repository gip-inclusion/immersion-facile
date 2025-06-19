import {
  frontRoutes,
  type WithConventionDto,
  withConventionSchema,
} from "shared";
import type { GenerateConventionMagicLinkUrl } from "../../../../../config/bootstrap/magicLinkUrl";
import type { SaveNotificationAndRelatedEvent } from "../../../notifications/helpers/Notification";
import type { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../../UseCase";
import type { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";

export class NotifyFranceTravailUserAdvisorOnConventionFullySigned extends TransactionalUseCase<WithConventionDto> {
  protected inputSchema = withConventionSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl;

  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);

    this.#generateConventionMagicLinkUrl = generateConventionMagicLinkUrl;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#timeGateway = timeGateway;
  }

  public async _execute(
    { convention: conventionFromEvent }: WithConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const [conventionFtAdvisor, convention] = await Promise.all([
      uow.conventionFranceTravailAdvisorRepository.getByConventionId(
        conventionFromEvent.id,
      ),
      uow.conventionRepository.getById(conventionFromEvent.id),
    ]);

    if (!convention) return;

    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);

    if (conventionFtAdvisor?.advisor && agency)
      await this.#saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED",
          recipients: [conventionFtAdvisor.advisor.email],
          params: {
            advisorFirstName: conventionFtAdvisor.advisor.firstName,
            advisorLastName: conventionFtAdvisor.advisor.lastName,
            agencyLogoUrl: agency.logoUrl ?? undefined,
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            beneficiaryEmail: convention.signatories.beneficiary.email,
            businessName: convention.businessName,
            conventionId: convention.id,
            dateEnd: convention.dateEnd,
            dateStart: convention.dateStart,
            immersionAddress: convention.immersionAddress,
            magicLink: this.#generateConventionMagicLinkUrl({
              id: convention.id,
              role: "validator",
              targetRoute: frontRoutes.manageConvention,
              email: conventionFtAdvisor.advisor.email,
              now: this.#timeGateway.now(),
            }),
          },
        },
        followedIds: {
          conventionId: convention.id,
          agencyId: convention.agencyId,
          establishmentSiret: convention.siret,
        },
      });
  }
}
