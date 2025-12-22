import {
  frontRoutes,
  getFormattedFirstnameAndLastname,
  makeUrlWithQueryParams,
  type WithConventionDto,
  withConventionSchema,
} from "shared";
import type { AppConfig } from "../../../../../config/bootstrap/appConfig";
import type { SaveNotificationAndRelatedEvent } from "../../../notifications/helpers/Notification";
import { TransactionalUseCase } from "../../../UseCase";
import type { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../unit-of-work/ports/UnitOfWorkPerformer";

export class NotifyFranceTravailUserAdvisorOnConventionFullySigned extends TransactionalUseCase<WithConventionDto> {
  protected inputSchema = withConventionSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #config: AppConfig;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    config: AppConfig,
  ) {
    super(uowPerformer);
    this.#config = config;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
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
            advisorFirstName: getFormattedFirstnameAndLastname({
              firstname: conventionFtAdvisor.advisor.firstName,
            }),
            advisorLastName: getFormattedFirstnameAndLastname({
              lastname: conventionFtAdvisor.advisor.lastName,
            }),
            agencyLogoUrl: agency.logoUrl ?? undefined,
            beneficiaryFirstName: getFormattedFirstnameAndLastname({
              firstname: convention.signatories.beneficiary.firstName,
            }),
            beneficiaryLastName: getFormattedFirstnameAndLastname({
              lastname: convention.signatories.beneficiary.lastName,
            }),
            beneficiaryEmail: convention.signatories.beneficiary.email,
            businessName: convention.businessName,
            conventionId: convention.id,
            dateEnd: convention.dateEnd,
            dateStart: convention.dateStart,
            immersionAddress: convention.immersionAddress,
            manageConventionLink: `${this.#config.immersionFacileBaseUrl}${makeUrlWithQueryParams(
              `/${frontRoutes.manageConventionUserConnected}`,
              {
                conventionId: convention.id,
              },
            )}`,
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
