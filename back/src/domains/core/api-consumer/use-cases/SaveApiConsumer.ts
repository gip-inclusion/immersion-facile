import { keys } from "ramda";
import {
  ApiConsumer,
  ApiConsumerJwt,
  ApiConsumerRight,
  ApiConsumerRights,
  CreateWebhookSubscription,
  InclusionConnectDomainJwtPayload,
  WriteApiConsumerParams,
  writeApiConsumerSchema,
} from "shared";
import { UnauthorizedError } from "../../../../config/helpers/httpErrors";
import { throwIfIcUserNotBackofficeAdmin } from "../../../inclusion-connected-users/helpers/throwIfIcUserNotBackofficeAdmin";
import { TransactionalUseCase } from "../../UseCase";
import { CreateNewEvent } from "../../events/ports/EventBus";
import { GenerateApiConsumerJwt } from "../../jwt";
import { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";

export const EXPIRATION_IN_YEARS = 2;

export class SaveApiConsumer extends TransactionalUseCase<
  WriteApiConsumerParams,
  ApiConsumerJwt | undefined,
  InclusionConnectDomainJwtPayload
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
    payload?: InclusionConnectDomainJwtPayload,
  ): Promise<ApiConsumerJwt | undefined> {
    if (!payload) throw new UnauthorizedError();
    await throwIfIcUserNotBackofficeAdmin(uow, payload);

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
        payload: { consumerId: input.id },
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
