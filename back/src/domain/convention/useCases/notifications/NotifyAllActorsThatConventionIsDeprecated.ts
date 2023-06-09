import { uniq } from "ramda";
import { ConventionDto, conventionSchema } from "shared";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";

export class NotifyAllActorsThatConventionIsDeprecated extends TransactionalUseCase<ConventionDto> {
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

    const {
      beneficiary,
      establishmentRepresentative,
      beneficiaryCurrentEmployer,
      beneficiaryRepresentative,
    } = convention.signatories;

    const recipients = uniq([
      beneficiary.email,
      establishmentRepresentative.email,
      ...agency.counsellorEmails,
      ...agency.validatorEmails,
      ...(beneficiaryCurrentEmployer ? [beneficiaryCurrentEmployer.email] : []),
      ...(beneficiaryRepresentative ? [beneficiaryRepresentative.email] : []),
    ]);

    await this.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "DEPRECATED_CONVENTION_NOTIFICATION",
        recipients,
        params: {
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
