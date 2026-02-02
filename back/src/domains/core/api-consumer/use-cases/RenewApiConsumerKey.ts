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
import { useCaseBuilder } from "../../useCaseBuilder";

type Deps = {
  createNewEvent: CreateNewEvent;
  generateApiConsumerJwt: GenerateApiConsumerJwt;
  timeGateway: TimeGateway;
};

export type RenewApiConsumerKey = ReturnType<typeof makeRenewApiConsumerKey>;
export const makeRenewApiConsumerKey = useCaseBuilder("RenewApiConsumerKey")
  .withInput<ApiConsumerId>(apiConsumerIdSchema)
  .withOutput<ApiConsumerJwt>()
  .withCurrentUser<ConnectedUser | undefined>()
  .withDeps<Deps>()
  .build(async ({ inputParams: consumerId, uow, currentUser, deps }) => {
    throwIfNotAdmin(currentUser);

    const existingApiConsumer =
      await uow.apiConsumerRepository.getById(consumerId);

    if (!existingApiConsumer)
      throw errors.apiConsumer.notFound({ id: consumerId });

    const now = deps.timeGateway.now();
    const newKeyIssuedAt = now.toISOString();

    const updatedApiConsumer = {
      ...existingApiConsumer,
      currentKeyIssuedAt: newKeyIssuedAt,
      revokedAt: null,
    };

    await uow.apiConsumerRepository.save(updatedApiConsumer);

    await uow.outboxRepository.save(
      deps.createNewEvent({
        topic: "ApiConsumerKeyRenewed",
        payload: {
          consumerId,
          triggeredBy: {
            kind: "connected-user",
            userId: currentUser!.id,
          },
        },
      }),
    );

    return deps.generateApiConsumerJwt({
      id: consumerId,
      version: 1,
      iat: now.getTime() / 1000,
    });
  });
