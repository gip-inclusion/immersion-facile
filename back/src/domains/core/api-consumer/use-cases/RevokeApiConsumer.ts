import {
  type ApiConsumerId,
  apiConsumerIdSchema,
  ConflictError,
  type ConnectedUser,
  errors,
} from "shared";
import { throwIfNotAdmin } from "../../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../events/ports/EventBus";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../UseCase";
import type { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";

export class RevokeApiConsumer extends TransactionalUseCase<
  ApiConsumerId,
  void,
  ConnectedUser
> {
  protected inputSchema = apiConsumerIdSchema;

  #createNewEvent: CreateNewEvent;

  #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    consumerId: ApiConsumerId,
    uow: UnitOfWork,
    currentUser: ConnectedUser,
  ): Promise<void> {
    throwIfNotAdmin(currentUser);

    const existingApiConsumer =
      await uow.apiConsumerRepository.getById(consumerId);

    if (!existingApiConsumer)
      throw errors.apiConsumer.notFound({ id: consumerId });

    if (existingApiConsumer.revokedAt)
      throw new ConflictError(
        `Api consumer with id '${consumerId}' is already revoked`,
      );

    const revokedApiConsumer = {
      ...existingApiConsumer,
      revokedAt: this.#timeGateway.now().toISOString(),
    };

    await uow.apiConsumerRepository.save(revokedApiConsumer);

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "ApiConsumerRevoked",
        payload: {
          consumerId,
          triggeredBy: {
            kind: "connected-user",
            userId: currentUser.id,
          },
        },
      }),
    );
  }
}
