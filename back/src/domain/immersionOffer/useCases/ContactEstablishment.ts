import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRequestSchema,
} from "../../../shared/contactEstablishment";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class ContactEstablishment extends TransactionalUseCase<
  ContactEstablishmentRequestDto,
  void
> {
  inputSchema = contactEstablishmentRequestSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    params: ContactEstablishmentRequestDto,
    { establishmentAggregateRepo, outboxRepo }: UnitOfWork,
  ): Promise<void> {
    const { siret, contactMode } = params;

    const establishment =
      await establishmentAggregateRepo.getEstablishmentForSiret(siret);
    if (!establishment) throw new NotFoundError(siret);

    const contact =
      await establishmentAggregateRepo.getContactForEstablishmentSiret(siret);
    if (!contact)
      throw new BadRequestError(`No contact for establishment: ${siret}`);

    if (contactMode !== contact.contactMethod)
      throw new BadRequestError(
        `Contact mode mismatch: ${contactMode} in params. In contact (fetched with siret) : ${contact.contactMethod}`,
      );

    const event = this.createNewEvent({
      topic: "ContactRequestedByBeneficiary",
      payload: params,
    });

    await outboxRepo.save(event);
  }
}
