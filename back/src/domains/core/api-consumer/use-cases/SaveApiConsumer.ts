import { setMilliseconds } from "date-fns";
import { keys } from "ramda";
import {
  type ApiConsumer,
  type ApiConsumerJwt,
  type ApiConsumerRights,
  type ConnectedUser,
  type WriteApiConsumerParams,
  writeApiConsumerSchema,
} from "shared";
import { throwIfNotAdmin } from "../../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../events/ports/EventBus";
import type { GenerateApiConsumerJwt } from "../../jwt";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../UseCase";
import type { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";

export class SaveApiConsumer extends TransactionalUseCase<
  WriteApiConsumerParams,
  ApiConsumerJwt | undefined,
  ConnectedUser
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
    currentUser: ConnectedUser,
  ): Promise<ApiConsumerJwt | undefined> {
    throwIfNotAdmin(currentUser);

    const existingApiConsumer = await uow.apiConsumerRepository.getById(
      input.id,
    );
    const isNewApiConsumer = !existingApiConsumer;

    const keyIssuedAt = setMilliseconds(this.#timeGateway.now(), 0);

    await Promise.all([
      uow.apiConsumerRepository.save(
        this.#buildApiConsumerWithoutSubscription({
          input,
          existingApiConsumer,
          keyIssuedAt,
        }),
      ),
      uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "ApiConsumerSaved",
          payload: {
            consumerId: input.id,
            triggeredBy: {
              kind: "connected-user",
              userId: currentUser.id,
            },
          },
        }),
      ),
    ]);

    return isNewApiConsumer
      ? this.#generateApiConsumerJwt({
          id: input.id,
          version: 1,
          iat: keyIssuedAt.getTime() / 1000,
        })
      : undefined;
  }

  #buildApiConsumerWithoutSubscription({
    input,
    existingApiConsumer,
    keyIssuedAt,
  }: {
    input: WriteApiConsumerParams;
    existingApiConsumer: ApiConsumer | undefined;
    keyIssuedAt: Date;
  }): ApiConsumer {
    const updatedRights = keys(input.rights).reduce(
      (acc, rightName) => ({
        ...acc,
        [rightName]: {
          ...input.rights[rightName],
          ...acc[rightName],
          subscriptions: existingApiConsumer
            ? existingApiConsumer.rights[rightName].subscriptions
            : [],
        },
      }),
      {} as ApiConsumerRights,
    );

    return {
      ...input,
      rights: updatedRights,
      ...(existingApiConsumer
        ? {
            currentKeyIssuedAt: existingApiConsumer.currentKeyIssuedAt,
            createdAt: existingApiConsumer.createdAt,
            revokedAt: existingApiConsumer.revokedAt,
          }
        : {
            createdAt: this.#timeGateway.now().toISOString(),
            currentKeyIssuedAt: keyIssuedAt.toISOString(),
            revokedAt: null,
          }),
    };
  }
}
