import { setMilliseconds } from "date-fns";
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
  .withCurrentUser<ConnectedUser>()
  .withDeps<Deps>()
  .build(async ({ inputParams: consumerId, uow, currentUser, deps }) => {
    throwIfNotAdmin(currentUser);

    const existingApiConsumer =
      await uow.apiConsumerRepository.getById(consumerId);

    if (!existingApiConsumer)
      throw errors.apiConsumer.notFound({ id: consumerId });

    const now = setMilliseconds(deps.timeGateway.now(), 0);

    await Promise.all([
      uow.apiConsumerRepository.save({
        ...existingApiConsumer,
        currentKeyIssuedAt: now.toISOString(),
        revokedAt: null,
      }),
      uow.outboxRepository.save(
        deps.createNewEvent({
          topic: "ApiConsumerKeyRenewed",
          payload: {
            consumerId,
            triggeredBy: {
              kind: "connected-user",
              userId: currentUser.id,
            },
          },
        }),
      ),
    ]);

    return deps.generateApiConsumerJwt({
      id: consumerId,
      version: 1,
      iat: now.getTime() / 1000,
    });
  });
