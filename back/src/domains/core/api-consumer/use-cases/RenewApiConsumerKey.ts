import {
  type ApiConsumerId,
  type ApiConsumerJwt,
  apiConsumerIdSchema,
  type ConnectedUser,
  errors,
} from "shared";
import { throwIfNotAdmin } from "../../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../events/ports/EventBus";
import type { GenerateApiConsumerJwt } from "../../jwt";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../UseCase";
import type { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";

export class RenewApiConsumerKey extends TransactionalUseCase<
  ApiConsumerId,
  ApiConsumerJwt,
  ConnectedUser
> {
  protected inputSchema = apiConsumerIdSchema;

  #createNewEvent: CreateNewEvent;

  #generateApiConsumerJwt: GenerateApiConsumerJwt;

  #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    generateApiConsumerJwt: GenerateApiConsumerJwt,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#generateApiConsumerJwt = generateApiConsumerJwt;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    consumerId: ApiConsumerId,
    uow: UnitOfWork,
    currentUser: ConnectedUser,
  ): Promise<ApiConsumerJwt> {
    throwIfNotAdmin(currentUser);

    const existingApiConsumer =
      await uow.apiConsumerRepository.getById(consumerId);

    if (!existingApiConsumer)
      throw errors.apiConsumer.notFound({ id: consumerId });

    const newKeyIssuedAt = this.#timeGateway.now().toISOString();

    const updatedApiConsumer = {
      ...existingApiConsumer,
      currentKeyIssuedAt: newKeyIssuedAt,
      revokedAt: null,
    };

    await uow.apiConsumerRepository.save(updatedApiConsumer);

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "ApiConsumerKeyRenewed",
        payload: {
          consumerId,
          triggeredBy: {
            kind: "connected-user",
            userId: currentUser.id,
          },
        },
      }),
    );

    return this.#generateApiConsumerJwt({
      id: consumerId,
      version: 1,
    });
  }
}
