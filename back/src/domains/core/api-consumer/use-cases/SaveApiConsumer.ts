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
import { useCaseBuilder } from "../../useCaseBuilder";

export type SaveApiConsumer = ReturnType<typeof makeSaveApiConsumer>;

export const makeSaveApiConsumer = useCaseBuilder("SaveApiConsumer")
  .withInput(writeApiConsumerSchema)
  .withOutput<ApiConsumerJwt | undefined>()
  .withCurrentUser<ConnectedUser>()
  .withDeps<{
    createNewEvent: CreateNewEvent;
    generateApiConsumerJwt: GenerateApiConsumerJwt;
    timeGateway: TimeGateway;
  }>()
  .build(
    async ({
      currentUser,
      inputParams,
      uow,
      deps: { createNewEvent, generateApiConsumerJwt, timeGateway },
    }) => {
      throwIfNotAdmin(currentUser);

      const existingApiConsumer = await uow.apiConsumerRepository.getById(
        inputParams.id,
      );
      const isNewApiConsumer = !existingApiConsumer;

      const keyIssuedAt = setMilliseconds(timeGateway.now(), 0);

      await uow.apiConsumerRepository.save(
        buildApiConsumerWithoutSubscription({
          input: inputParams,
          existingApiConsumer,
          keyIssuedAt,
          timeGateway,
        }),
      );
      await uow.outboxRepository.save(
        createNewEvent({
          topic: "ApiConsumerSaved",
          payload: {
            consumerId: inputParams.id,
            triggeredBy: {
              kind: "connected-user",
              userId: currentUser.id,
            },
          },
        }),
      );

      return isNewApiConsumer
        ? generateApiConsumerJwt({
            id: inputParams.id,
            version: 1,
            iat: keyIssuedAt.getTime() / 1000,
          })
        : undefined;
    },
  );

const buildApiConsumerWithoutSubscription = ({
  input,
  existingApiConsumer,
  keyIssuedAt,
  timeGateway,
}: {
  input: WriteApiConsumerParams;
  existingApiConsumer: ApiConsumer | undefined;
  keyIssuedAt: Date;
  timeGateway: TimeGateway;
}): ApiConsumer => {
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
          createdAt: timeGateway.now().toISOString(),
          currentKeyIssuedAt: keyIssuedAt.toISOString(),
          revokedAt: null,
        }),
  };
};
