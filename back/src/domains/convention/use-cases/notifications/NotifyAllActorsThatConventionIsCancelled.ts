import {
  type WithConventionDto,
  errors,
  getFormattedFirstnameAndLastname,
  withConventionSchema,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { getAllConventionRecipientsEmail } from "../../entities/Convention";

export class NotifyAllActorsThatConventionIsCancelled extends TransactionalUseCase<WithConventionDto> {
  protected inputSchema = withConventionSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  protected async _execute(
    { convention }: WithConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);
    if (!agency)
      throw errors.agency.notFound({ agencyId: convention.agencyId });

    const beneficiary = convention.signatories.beneficiary;

    const recipients = getAllConventionRecipientsEmail(
      convention,
      await agencyWithRightToAgencyDto(uow, agency),
    );

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "CANCELLED_CONVENTION_NOTIFICATION",
        recipients,
        params: {
          agencyName: agency.name,
          conventionId: convention.id,
          internshipKind: convention.internshipKind,
          beneficiaryFirstName: getFormattedFirstnameAndLastname({
            firstname: beneficiary.firstName,
          }),
          beneficiaryLastName: getFormattedFirstnameAndLastname({
            lastname: beneficiary.lastName,
          }),
          businessName: convention.businessName,
          signature: agency.signature,
          immersionProfession: convention.immersionAppellation.appellationLabel,
          agencyLogoUrl: agency.logoUrl ?? undefined,
          dateEnd: convention.dateEnd,
          dateStart: convention.dateStart,
          justification: convention.statusJustification || "non renseigné",
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
