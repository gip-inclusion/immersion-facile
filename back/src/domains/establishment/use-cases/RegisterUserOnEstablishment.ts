import {
  type ConnectedUser,
  errors,
  registerUserOnEstablishmentPayloadSchema,
} from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { EstablishmentAggregate } from "../entities/EstablishmentAggregate";

export type RegisterUserOnEstablishment = ReturnType<
  typeof makeRegisterUserOnEstablishment
>;

export const makeRegisterUserOnEstablishment = useCaseBuilder(
  "RegisterUserOnEstablishment",
)
  .withInput(registerUserOnEstablishmentPayloadSchema)
  .withCurrentUser<ConnectedUser | undefined>()
  .withDeps<{ timeGateway: TimeGateway; createNewEvent: CreateNewEvent }>()
  .build(async ({ uow, currentUser, deps, inputParams: payload }) => {
    if (!currentUser) throw errors.user.unauthorized();
    if (currentUser.email !== payload.userRight.email) {
      throw errors.user.forbiddenEmailUpdate();
    }

    if (payload.userRight.status !== "PENDING")
      throw errors.establishment.userRightStatusNotPending({
        siret: payload.siret,
        userId: currentUser.id,
      });

    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        payload.siret,
      );
    if (!establishmentAggregate)
      throw errors.establishment.notFound({ siret: payload.siret });
    if (
      establishmentAggregate.userRights.some(
        (userRight) => userRight.userId === currentUser.id,
      )
    )
      throw errors.establishment.userRightAlreadyExists({
        siret: payload.siret,
        userId: currentUser.id,
      });

    const establishmentAggregateWithRequestedUserRight: EstablishmentAggregate =
      {
        ...establishmentAggregate,
        userRights: [
          ...establishmentAggregate.userRights,
          { ...payload.userRight, userId: currentUser.id },
        ],
      };

    await uow.establishmentAggregateRepository.updateEstablishmentAggregate(
      establishmentAggregateWithRequestedUserRight,
      deps.timeGateway.now(),
    );

    await uow.outboxRepository.save(
      deps.createNewEvent({
        topic: "PendingUserRightRegisteredOnEstablishment",
        payload: {
          siret: payload.siret,
          userRight: {
            ...payload.userRight,
            userId: currentUser.id,
          },
          triggeredBy: { kind: "connected-user", userId: currentUser.id },
        },
      }),
    );
  });
