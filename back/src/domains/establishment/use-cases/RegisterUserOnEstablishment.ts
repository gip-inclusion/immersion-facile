import {
  type ConnectedUser,
  errors,
  registerUserOnEstablishmentPayloadSchema,
} from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type RegisterUserOnEstablishment = ReturnType<
  typeof makeRegisterUserOnEstablishment
>;

export const makeRegisterUserOnEstablishment = useCaseBuilder(
  "RegisterUserOnEstablishment",
)
  .withInput(registerUserOnEstablishmentPayloadSchema)
  .withCurrentUser<ConnectedUser | undefined>()
  .withDeps<{ createNewEvent: CreateNewEvent }>()
  .build(async ({ uow, currentUser, deps, inputParams: payload }) => {
    if (!currentUser) throw errors.user.unauthorized();
    if (payload.userRight.status !== "PENDING")
      throw errors.establishment.userRightStatusNotPending({
        siret: payload.siret,
        userId: currentUser.id,
      });
    const user = await uow.userRepository.getById(currentUser.id);
    if (!user) throw errors.user.notFound({ userId: currentUser.id });
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

    await uow.outboxRepository.save(
      deps.createNewEvent({
        topic: "UserRightRegisteredOnEstablishment",
        payload: {
          siret: payload.siret,
          userRight: {
            ...payload.userRight,
            userId: user.id,
          },
          triggeredBy: { kind: "connected-user", userId: user.id },
        },
      }),
    );
  });
