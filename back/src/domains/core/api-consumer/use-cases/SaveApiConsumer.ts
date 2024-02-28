import { keys } from "ramda";
import {
  ApiConsumer,
  ApiConsumerJwt,
  ApiConsumerRight,
  ApiConsumerRights,
  BackOfficeDomainPayload,
  CreateWebhookSubscription,
  WriteApiConsumerParams,
  writeApiConsumerSchema,
} from "shared";
import {
  ForbiddenError,
  UnauthorizedError,
} from "../../../../adapters/primary/helpers/httpErrors";
import { GenerateApiConsumerJwt } from "../../../auth/jwt";
import { TransactionalUseCase } from "../../UseCase";
import { CreateNewEvent } from "../../events/ports/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../ports/UnitOfWork";
import { TimeGateway } from "../../time-gateway/ports/TimeGateway";

export const EXPIRATION_IN_YEARS = 2;

export class SaveApiConsumer extends TransactionalUseCase<
  WriteApiConsumerParams,
  ApiConsumerJwt | undefined,
  BackOfficeDomainPayload
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
    payload?: BackOfficeDomainPayload,
  ): Promise<ApiConsumerJwt | undefined> {
    if (!payload) throw new UnauthorizedError();
    if (payload.role !== "backOffice")
      throw new ForbiddenError(
        "Provided JWT payload does not have sufficient privileges. Received role: 'beneficiary'",
      );

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
