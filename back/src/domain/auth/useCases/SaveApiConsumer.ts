import { addYears } from "date-fns";
import { keys } from "ramda";
import {
  ApiConsumer,
  ApiConsumerJwt,
  ApiConsumerRight,
  ApiConsumerRights,
  BackOfficeDomainPayload,
  CreateApiConsumerParams,
  createApiConsumerSchema,
} from "shared";
import {
  ForbiddenError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { GenerateApiConsumerJwt } from "../jwt";

export const EXPIRATION_IN_YEARS = 2;

export class SaveApiConsumer extends TransactionalUseCase<
  CreateApiConsumerParams,
  ApiConsumerJwt | undefined,
  BackOfficeDomainPayload
> {
  protected inputSchema = createApiConsumerSchema;

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
    input: CreateApiConsumerParams,
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
    input: CreateApiConsumerParams,
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
      } satisfies ApiConsumerRight<unknown>;

      return {
        ...acc,
        [rightName]: newRight,
      };
    }, {} as ApiConsumerRights);

    const now = this.#timeGateway.now();

    const additionInfos = existingApiConsumer
      ? {
          createdAt: existingApiConsumer.createdAt,
          expirationDate: existingApiConsumer.expirationDate,
        }
      : {
          createdAt: now.toISOString(),
          expirationDate: addYears(now, EXPIRATION_IN_YEARS).toISOString(),
        };

    return {
      ...input,
      ...additionInfos,
      rights,
    };
  }
}
