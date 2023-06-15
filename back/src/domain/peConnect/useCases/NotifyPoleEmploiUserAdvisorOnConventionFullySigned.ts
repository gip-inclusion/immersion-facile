import { ConventionDto, conventionSchema, frontRoutes } from "shared";
import { GenerateConventionMagicLinkUrl } from "../../../adapters/primary/config/magicLinkUrl";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../generic/notifications/entities/Notification";

export class NotifyPoleEmploiUserAdvisorOnConventionFullySigned extends TransactionalUseCase<ConventionDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    private readonly generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionSchema;

  public async _execute(
    conventionFromEvent: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const [conventionPeAdvisor, convention] = await Promise.all([
      uow.conventionPoleEmploiAdvisorRepository.getByConventionId(
        conventionFromEvent.id,
      ),
      uow.conventionRepository.getById(conventionFromEvent.id),
    ]);

    if (!convention) return;

    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);

    if (conventionPeAdvisor && conventionPeAdvisor.advisor && agency)
      await this.saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED",
          recipients: [conventionPeAdvisor.advisor.email],
          params: {
            advisorFirstName: conventionPeAdvisor.advisor.firstName,
            advisorLastName: conventionPeAdvisor.advisor.lastName,
            agencyLogoUrl: agency.logoUrl,
            beneficiaryFirstName: convention.signatories.beneficiary.firstName,
            beneficiaryLastName: convention.signatories.beneficiary.lastName,
            beneficiaryEmail: convention.signatories.beneficiary.email,
            businessName: convention.businessName,
            conventionId: convention.id,
            dateEnd: convention.dateEnd,
            dateStart: convention.dateStart,
            immersionAddress: convention.immersionAddress,
            magicLink: this.generateConventionMagicLinkUrl({
              id: convention.id,
              role: "validator",
              targetRoute: frontRoutes.manageConvention,
              email: conventionPeAdvisor.advisor.email,
              now: this.timeGateway.now(),
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
