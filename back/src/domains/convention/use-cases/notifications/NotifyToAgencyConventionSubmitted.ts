import {
  type AgencyDto,
  type ConventionDto,
  type Email,
  errors,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  makeUrlWithQueryParams,
  type WithConventionDto,
  withConventionSchema,
} from "shared";
import type { AppConfig } from "../../../../config/bootstrap/appConfig";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class NotifyToAgencyConventionSubmitted extends TransactionalUseCase<
  WithConventionDto,
  void
> {
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

  protected async _execute(
    { convention }: WithConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const [agencyWithRights] = await uow.agencyRepository.getByIds([
      convention.agencyId,
    ]);
    if (!agencyWithRights)
      throw errors.agency.notFound({ agencyId: convention.agencyId });

    const agency = await agencyWithRightToAgencyDto(uow, agencyWithRights);

    const conventionAdvisorEntity =
      await uow.conventionFranceTravailAdvisorRepository.getByConventionId(
        convention.id,
      );

    if (conventionAdvisorEntity?.advisor)
      return this.#sendEmailToRecipients({
        agency,
        convention,
        recipients: [conventionAdvisorEntity.advisor.email],
        warning: undefined,
        uow,
      });

    const hasCounsellors = agency.counsellorEmails.length > 0;

    const recipients: Email[] = hasCounsellors
      ? agency.counsellorEmails
      : agency.validatorEmails;

    return this.#sendEmailToRecipients({
      agency,
      convention,
      recipients,
      warning:
        agency.kind === "pole-emploi"
          ? "Merci de vérifier le conseiller référent associé à ce bénéficiaire."
          : undefined,
      uow,
    });
  }

  async #sendEmailToRecipients({
    agency,
    recipients,
    convention,
    warning,
    uow,
  }: {
    recipients: Email[];
    agency: AgencyDto;
    convention: ConventionDto;
    warning?: string;
    uow: UnitOfWork;
  }) {
    await Promise.all(
      recipients.map(async (email) => {
        return this.#saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "NEW_CONVENTION_AGENCY_NOTIFICATION",
            recipients: [email],
            params: {
              internshipKind: convention.internshipKind,
              agencyName: agency.name,
              agencyReferentName: getFormattedFirstnameAndLastname(
                convention.agencyReferent ?? {},
              ),
              businessName: convention.businessName,
              dateEnd: convention.dateEnd,
              dateStart: convention.dateStart,
              conventionId: convention.id,
              firstName: getFormattedFirstnameAndLastname({
                firstname: convention.signatories.beneficiary.firstName,
              }),
              lastName: getFormattedFirstnameAndLastname({
                lastname: convention.signatories.beneficiary.lastName,
              }),
              magicLink: `${this.#config.immersionFacileBaseUrl}${makeUrlWithQueryParams(
                `/${frontRoutes.manageConventionUserConnected}`,
                { conventionId: convention.id },
              )}`,
              agencyLogoUrl: agency.logoUrl ?? undefined,
              warning,
            },
          },
          followedIds: {
            conventionId: convention.id,
            agencyId: convention.agencyId,
            establishmentSiret: convention.siret,
          },
        });
      }),
    );
  }
}
