import { keys } from "ramda";
import {
  type ApiConsumer,
  type ApiConsumerJwt,
  type ApiConsumerRight,
  type ApiConsumerRights,
  type CreateWebhookSubscription,
  type InclusionConnectedUser,
  type WriteApiConsumerParams,
  writeApiConsumerSchema,
} from "shared";
import { throwIfNotAdmin } from "../../../inclusion-connected-users/helpers/authorization.helper";
import { TransactionalUseCase } from "../../UseCase";
import type { CreateNewEvent } from "../../events/ports/EventBus";
import type { GenerateApiConsumerJwt } from "../../jwt";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";

export class SaveApiConsumer extends TransactionalUseCase<
  WriteApiConsumerParams,
  ApiConsumerJwt | undefined,
  InclusionConnectedUser
> {
  protected inputSchema = writeApiConsumerSchema;

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
    input: WriteApiConsumerParams,
    uow: UnitOfWork,
    currentUser: InclusionConnectedUser,
  ): Promise<ApiConsumerJwt | undefined> {
    throwIfNotAdmin(currentUser);

    const existingApiConsumer = await uow.apiConsumerRepository.getById(
      input.id,
    );
    const isNewApiConsumer = !existingApiConsumer;

    const apiConsumer = this.#buildApiConsumerWithoutSubscription(
      input,
      existingApiConsumer,
    );

    await uow.apiConsumerRepository.save(apiConsumer);

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "ApiConsumerSaved",
        payload: {
          consumerId: input.id,
          triggeredBy: {
            kind: "inclusion-connected",
            userId: currentUser.id,
          },
        },
      }),
    );

    if (isNewApiConsumer)
      return this.#generateApiConsumerJwt({
        id: input.id,
      });

    return;
  }

  #buildApiConsumerWithoutSubscription(
    input: WriteApiConsumerParams,
    existingApiConsumer: ApiConsumer | undefined,
  ): ApiConsumer {
    const rights = keys(input.rights).reduce((acc, rightName) => {
      const subscriptions = existingApiConsumer
        ? existingApiConsumer.rights[rightName].subscriptions
        : [];
      const newRight = {
        ...input.rights[rightName],
        ...acc[rightName],
        subscriptions,
      } satisfies ApiConsumerRight<unknown, CreateWebhookSubscription>;

      return {
        ...acc,
        [rightName]: newRight,
      };
    }, {} as ApiConsumerRights);

    return {
      ...input,
      createdAt:
        existingApiConsumer?.createdAt ?? this.#timeGateway.now().toISOString(),
      rights,
    };
  }
}
