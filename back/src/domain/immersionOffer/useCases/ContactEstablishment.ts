import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRequestSchema,
} from "../../../shared/contactEstablishment";
import { ContactMethod } from "../../../shared/FormEstablishmentDto";
import {
  ImmersionOfferId,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

const throwIfNoContactId = (
  searchImmersionResult: SearchImmersionResultDto,
  searchedOfferId: ImmersionOfferId,
) => {
  if (!searchImmersionResult.contactId) {
    throw new BadRequestError(
      `no contact id in immersion offer: ${searchedOfferId}`,
    );
  }
};

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

    const handledContactMode: ContactMethod[] = ["EMAIL", "PHONE"];

    if (handledContactMode.includes(params.contactMode)) {
      throwIfNoContactId(immersionOffer, params.immersionOfferId);

      const event = this.createNewEvent({
        topic: "ContactRequestedByBeneficiary",
        payload: params,
      });

      await unitOfWork.outboxRepo.save(event);
    }
  }
}
