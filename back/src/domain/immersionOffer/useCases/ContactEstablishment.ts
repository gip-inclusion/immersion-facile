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
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    params: ContactEstablishmentRequestDto,
    unitOfWork: UnitOfWork,
  ): Promise<void> {
    throw new Error("implement");
    // await unitOfWork.outboxRepo.save(event);
  }
}
