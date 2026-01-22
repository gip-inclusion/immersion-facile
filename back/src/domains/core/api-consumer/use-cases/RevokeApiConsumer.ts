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
import { useCaseBuilder } from "../../useCaseBuilder";

type Deps = {
  createNewEvent: CreateNewEvent;
  timeGateway: TimeGateway;
};

export type RevokeApiConsumer = ReturnType<typeof makeRevokeApiConsumer>;
export const makeRevokeApiConsumer = useCaseBuilder("RevokeApiConsumer")
  .withInput<ApiConsumerId>(apiConsumerIdSchema)
  .withOutput<void>()
  .withCurrentUser<ConnectedUser | undefined>()
  .withDeps<Deps>()
  .build(async ({ inputParams: consumerId, uow, currentUser, deps }) => {
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
      revokedAt: deps.timeGateway.now().toISOString(),
    };

    await uow.apiConsumerRepository.save(revokedApiConsumer);

    await uow.outboxRepository.save(
      deps.createNewEvent({
        topic: "ApiConsumerRevoked",
        payload: {
          consumerId,
          triggeredBy: {
            kind: "connected-user",
            userId: currentUser!.id,
          },
        },
      }),
    );
  });
