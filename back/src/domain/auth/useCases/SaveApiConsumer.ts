import {
  ApiConsumer,
  apiConsumerSchema,
  BackOfficeDomainPayload,
  JwtDto,
} from "shared";
import {
  ForbiddenError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { GenerateApiConsumerJwt } from "../jwt";

export class SaveApiConsumer extends TransactionalUseCase<
  ApiConsumer,
  JwtDto,
  BackOfficeDomainPayload
> {
  protected inputSchema = apiConsumerSchema;

  #createNewEvent: CreateNewEvent;

  #generateApiConsumerJwt: GenerateApiConsumerJwt;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    generateApiConsumerJwt: GenerateApiConsumerJwt,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#generateApiConsumerJwt = generateApiConsumerJwt;
  }

  protected async _execute(
    input: ApiConsumer,
    uow: UnitOfWork,
    payload?: BackOfficeDomainPayload,
  ): Promise<JwtDto> {
    if (!payload) throw new UnauthorizedError();
    if (payload.role !== "backOffice")
      throw new ForbiddenError(
        "Provided JWT payload does not have sufficient privileges. Received role: 'beneficiary'",
      );

    await uow.apiConsumerRepository.save(input);
    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "ApiConsumerSaved",
        payload: { consumerId: input.id },
      }),
    );

    return {
      jwt: this.#generateApiConsumerJwt({
        id: input.id,
      }),
    };
  }
}
