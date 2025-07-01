import {
  errors,
  getFormattedFirstnameAndLastname,
  type WithConventionDto,
  withConventionSchema,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { getAllConventionRecipientsEmail } from "../../entities/Convention";

export class NotifyAllActorsThatConventionIsRejected extends TransactionalUseCase<WithConventionDto> {
  protected inputSchema = withConventionSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  public async _execute(
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
        kind: "REJECTED_CONVENTION_NOTIFICATION",
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
          rejectionReason: convention.statusJustification || "",
          signature: agency.signature,
          immersionProfession: convention.immersionAppellation.appellationLabel,
          agencyLogoUrl: agency.logoUrl ?? undefined,
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
