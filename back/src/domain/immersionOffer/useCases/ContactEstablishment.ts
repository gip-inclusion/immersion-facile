import { createLogger } from "./../../../utils/logger";
import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRequestSchema,
} from "../../../shared/contactEstablishment";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork, UnitOfWorkPerformer } from "./../../core/ports/UnitOfWork";

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
    unitOfWork: UnitOfWork,
  ): Promise<void> {
    const immersionOffer =
      await unitOfWork.immersionOfferRepo.getImmersionFromUuid(
        params.immersionOfferId,
      );

    if (!immersionOffer) throw new NotFoundError(params.immersionOfferId);
    if (params.contactMode !== immersionOffer.contactMode)
      throw new BadRequestError(
        `contact mode mismatch: ${params.contactMode} in immersion offer: ${params.immersionOfferId}`,
      );

    if (params.contactMode === "EMAIL") {
      if (!immersionOffer.contactId) {
        throw new BadRequestError(
          `no contact id in immersion offer: ${params.immersionOfferId}`,
        );
      }

      const event = this.createNewEvent({
        topic: "EmailContactRequestedByBeneficiary",
        payload: params,
      });
      await unitOfWork.outboxRepo.save(event);
    }
  }
}
