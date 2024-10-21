import { WithConventionDto, withConventionSchema } from "shared";
import { agencyWithRightToAgencyDto } from "../../../../utils/agency";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { getAllConventionRecipientsEmail } from "../../entities/Convention";

export class NotifyAllActorsThatConventionIsDeprecated extends TransactionalUseCase<WithConventionDto> {
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
    if (!agency) {
      throw new Error(
        `Unable to send mail. No agency config found for ${convention.agencyId}`,
      );
    }

    const { beneficiary } = convention.signatories;

    const recipients = getAllConventionRecipientsEmail(
      convention,
      await agencyWithRightToAgencyDto(uow, agency),
    );

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "DEPRECATED_CONVENTION_NOTIFICATION",
        recipients,
        params: {
          conventionId: convention.id,
          internshipKind: convention.internshipKind,
          beneficiaryFirstName: beneficiary.firstName,
          beneficiaryLastName: beneficiary.lastName,
          businessName: convention.businessName,
          deprecationReason: convention.statusJustification || "",
          dateStart: convention.dateStart,
          dateEnd: convention.dateEnd,
          immersionProfession: convention.immersionAppellation.appellationLabel,
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
