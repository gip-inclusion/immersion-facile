import { ConventionDto, conventionSchema } from "shared";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { getAllConventionRecipientsEmail } from "../../entities/Convention";

export class NotifyAllActorsThatConventionIsCancelled extends TransactionalUseCase<ConventionDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionSchema;

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
    const beneficiary = convention.signatories.beneficiary;

    const recipients = getAllConventionRecipientsEmail(convention, agency);

    await this.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "CANCELLED_CONVENTION_NOTIFICATION",
        recipients,
        params: {
          agencyName: agency.name,
          conventionId: convention.id,
          internshipKind: convention.internshipKind,
          beneficiaryFirstName: beneficiary.firstName,
          beneficiaryLastName: beneficiary.lastName,
          businessName: convention.businessName,
          signature: agency.signature,
          immersionProfession: convention.immersionAppellation.appellationLabel,
          agencyLogoUrl: agency.logoUrl,
          dateEnd: convention.dateEnd,
          dateStart: convention.dateStart,
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
