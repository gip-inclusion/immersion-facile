import {
  errors,
  isNotEmptyArray,
  type NotEmptyArray,
  type UserId,
  type WithUserId,
  withUserIdSchema,
} from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type {
  EstablishmentAdminRight,
  EstablishmentAggregate,
  EstablishmentUserRight,
} from "../../establishment/entities/EstablishmentAggregate";

export type DeleteUser = ReturnType<typeof makeDeleteUser>;

export const makeDeleteUser = useCaseBuilder("DeleteUser")
  .withDeps<{ timeGateway: TimeGateway; createNewEvent: CreateNewEvent }>()
  .withInput<WithUserId>(withUserIdSchema)
  .build(async ({ uow, deps, inputParams }) => {
    const userToDelete = await uow.userRepository.getById(inputParams.userId);

    if (!userToDelete) throw errors.user.notFound(inputParams);

    const establishmentsWithUserRight =
      await uow.establishmentAggregateRepository.getEstablishmentAggregatesByFilters(
        { userId: userToDelete.id },
      );

    const updatedEstablishments = await updateEstablishments(
      uow,
      establishmentsWithUserRight,
      userToDelete.id,
    );

    await Promise.all(
      updatedEstablishments.map((establishment) =>
        uow.establishmentAggregateRepository.updateEstablishmentAggregate(
          establishment,
          deps.timeGateway.now(),
        ),
      ),
    );

    await uow.userRepository.delete(userToDelete.id);
    await uow.outboxRepository.save(
      deps.createNewEvent({
        topic: "UserDeleted",
        payload: {
          userId: userToDelete.id,
          triggeredBy: {
            kind: "crawler",
          },
        },
      }),
    );
  });

const updateEstablishments = async (
  uow: UnitOfWork,
  establishmentsToUpdate: EstablishmentAggregate[],
  userToDeleteId: UserId,
): Promise<EstablishmentAggregate[]> => {
  const updatedEstablishments: EstablishmentAggregate[] = [];

  for (const establishment of establishmentsToUpdate) {
    updatedEstablishments.push(
      await updateEstablishment(establishment, userToDeleteId, uow),
    );
  }

  return updatedEstablishments;
};

const getMostActiveUserId = async (
  uow: UnitOfWork,
  remainingRights: NotEmptyArray<EstablishmentUserRight>,
): Promise<UserId> => {
  const users = await uow.userRepository.getByIds(
    remainingRights.map(({ userId }) => userId),
  );

  return users.sort((a, b) =>
    Number(a.lastLoginAt) > Number(b.lastLoginAt) ? -1 : 1,
  )[0].id;
};

async function updateEstablishment(
  establishment: EstablishmentAggregate,
  userToDeleteId: UserId,
  uow: UnitOfWork,
): Promise<EstablishmentAggregate> {
  const remainingRights = establishment.userRights.filter(
    ({ userId }) => userId !== userToDeleteId,
  );

  const isNoMoreEstablishmentAdmins =
    remainingRights.filter(({ role }) => role === "establishment-admin")
      .length === 0;

  const userIdToSetAdmin =
    isNotEmptyArray(remainingRights) && isNoMoreEstablishmentAdmins
      ? await getMostActiveUserId(uow, remainingRights)
      : null;

  return {
    ...establishment,
    userRights: remainingRights.map((right) => {
      if (right.userId === userIdToSetAdmin)
        return {
          userId: right.userId,
          role: "establishment-admin",
          shouldReceiveDiscussionNotifications:
            right.shouldReceiveDiscussionNotifications,
          isMainContactInPerson: right.isMainContactInPerson,
          isMainContactByPhone: right.isMainContactByPhone || null,
          job: right.job || "non-communiqué",
          phone: right.phone || "+33600000000", // On ne peut pas deviner un numéro de téléphone : +33600000000 ??? pas dingue
        } satisfies EstablishmentAdminRight;
      return right;
    }),
  };
}
