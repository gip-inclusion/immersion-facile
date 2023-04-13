import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRequestSchema,
} from "shared";

import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
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
    { establishmentAggregateRepository, outboxRepository }: UnitOfWork,
  ): Promise<void> {
    const { siret, contactMode } = params;

    const establishmentAggregate =
      await establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );
    if (!establishmentAggregate) throw new NotFoundError(siret);

    const contact = establishmentAggregate.contact;
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

    await outboxRepository.save(event);
  }
}
