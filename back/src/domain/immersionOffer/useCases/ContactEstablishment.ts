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
    { immersionOfferRepo, outboxRepo }: UnitOfWork,
  ): Promise<void> {
    const { immersionOfferId, contactMode } = params;

    const annotatedImmersionOffer =
      await immersionOfferRepo.getAnnotatedImmersionOfferById(immersionOfferId);
    if (!annotatedImmersionOffer) throw new NotFoundError(immersionOfferId);

    const contact = await immersionOfferRepo.getContactByImmersionOfferId(
      immersionOfferId,
    );
    if (!contact)
      throw new BadRequestError(
        `No contact for immersion offer: ${immersionOfferId}`,
      );

    const annotatedEstablishment =
      await immersionOfferRepo.getAnnotatedEstablishmentByImmersionOfferId(
        immersionOfferId,
      );
    if (!annotatedEstablishment) throw new NotFoundError(immersionOfferId);

    if (contactMode !== annotatedEstablishment.contactMethod)
      throw new BadRequestError(
        `Contact mode mismatch: IN_PERSON in immersion offer: ${immersionOfferId}`,
      );

    const event = this.createNewEvent({
      topic: "ContactRequestedByBeneficiary",
      payload: params,
    });

    await outboxRepo.save(event);
  }
}
