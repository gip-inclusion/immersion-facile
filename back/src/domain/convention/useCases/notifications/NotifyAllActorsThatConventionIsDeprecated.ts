import { ConventionDto, conventionSchema } from "shared";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { getAllConventionRecipientsEmail } from "../../entities/Convention";

export class NotifyAllActorsThatConventionIsDeprecated extends TransactionalUseCase<ConventionDto> {
  protected inputSchema = conventionSchema;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
  }

  public async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);
    if (!agency) {
      throw new Error(
        `Unable to send mail. No agency config found for ${convention.agencyId}`,
      );
    }

    const { beneficiary } = convention.signatories;

    const recipients = getAllConventionRecipientsEmail(convention, agency);

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
