import {
  errors,
  isNotEmptyArray,
  type User,
  type UserId,
  type UserWithAdminRights,
  type WithUserId,
  withUserIdSchema,
} from "shared";
import {
  type DomainEvent,
  type TriggeredBy,
  type WithTriggeredBy,
  withTriggeredBySchema,
} from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type {
  EstablishmentAdminRight,
  EstablishmentAggregate,
} from "../../establishment/entities/EstablishmentAggregate";

export type DeleteUser = ReturnType<typeof makeDeleteUser>;

export const makeDeleteUser = useCaseBuilder("DeleteUser")
  .withDeps<{ timeGateway: TimeGateway; createNewEvent: CreateNewEvent }>()
  .withInput<WithUserId & WithTriggeredBy>(
    withUserIdSchema.and(withTriggeredBySchema),
  )
  .build(
    async ({ uow, deps: { createNewEvent, timeGateway }, inputParams }) => {
      if (inputParams.triggeredBy?.kind !== "crawler")
        throw errors.user.forbiddenNotTriggeredByCrawler();

      const userToDelete = await uow.userRepository.getById(inputParams.userId);

      if (!userToDelete) throw errors.user.notFound(inputParams);

      const userAgencies = await uow.agencyRepository.getAgenciesRightsByUserId(
        userToDelete.id,
      );
      if (userAgencies.length > 0)
        throw errors.user.deleteForbiddenAgencyRights(userToDelete.id);

      const updatedEstablishments = await updateEstablishmentsRelatedToUser(
        uow,
        userToDelete,
      );

      await Promise.all([
        ...updatedEstablishments.map((establishment) =>
          uow.establishmentAggregateRepository.updateEstablishmentAggregate(
            establishment,
            timeGateway.now(),
          ),
        ),
        uow.userRepository.delete(userToDelete.id),
        uow.outboxRepository.saveNewEventsBatch(
          makeEvents({
            createNewEvent,
            userToDelete,
            updatedEstablishments,
            triggeredBy: {
              kind: "crawler",
            },
          }),
        ),
      ]);
    },
  );

const getMostActiveUserId = async (users: User[]): Promise<UserId> => {
  return users.sort((a, b) =>
    Number(a.lastLoginAt) > Number(b.lastLoginAt) ? -1 : 1,
  )[0].id;
};

const updateEstablishment = async ({
  establishment,
  userToDeleteId,
  uow,
}: {
  establishment: EstablishmentAggregate;
  userToDeleteId: UserId;
  uow: UnitOfWork;
}): Promise<EstablishmentAggregate> => {
  const remainingRights = establishment.userRights.filter(
    ({ userId }) => userId !== userToDeleteId,
  );

  const isNoMoreEstablishmentAdmins =
    remainingRights.filter(({ role }) => role === "establishment-admin")
      .length === 0;

  const userIdToSetAdmin =
    isNotEmptyArray(remainingRights) && isNoMoreEstablishmentAdmins
      ? await getMostActiveUserId(
          await uow.userRepository.getByIds(
            remainingRights.map(({ userId }) => userId),
          ),
        )
      : null;

  return {
    ...establishment,
    userRights: userIdToSetAdmin
      ? remainingRights.map((right) =>
          right.userId === userIdToSetAdmin
            ? ({
                userId: right.userId,
                role: "establishment-admin",
                shouldReceiveDiscussionNotifications:
                  right.shouldReceiveDiscussionNotifications,
                isMainContactInPerson: right.isMainContactInPerson,
                isMainContactByPhone: right.isMainContactByPhone || null,
                job: right.job || "non-communiqué",
                phone: right.phone || "+33600000000", // On ne peut pas deviner un numéro de téléphone : +33600000000 ??? pas dingue
              } satisfies EstablishmentAdminRight)
            : right,
        )
      : remainingRights,
  };
};

const makeEvents = ({
  createNewEvent,
  userToDelete,
  updatedEstablishments,
  triggeredBy,
}: {
  createNewEvent: CreateNewEvent;
  userToDelete: UserWithAdminRights;
  updatedEstablishments: EstablishmentAggregate[];
  triggeredBy: TriggeredBy;
}): DomainEvent[] => [
  createNewEvent({
    topic: "UserDeleted",
    payload: {
      userId: userToDelete.id,
      triggeredBy,
    },
  }),
  ...updatedEstablishments
    .filter(establishmentWithUserRights)
    .map((establishment) =>
      createNewEvent({
        topic: "AllEstablishmentUsersDeleted",
        payload: {
          siret: establishment.establishment.siret,
          triggeredBy,
        },
      }),
    ),
];

const establishmentWithUserRights = ({
  userRights,
}: EstablishmentAggregate): boolean => userRights.length === 0;

const updateEstablishmentsRelatedToUser = async (
  uow: UnitOfWork,
  userToDelete: UserWithAdminRights,
): Promise<EstablishmentAggregate[]> =>
  uow.establishmentAggregateRepository
    .getEstablishmentAggregatesByFilters({ userId: userToDelete.id })
    .then((establishmentsWithUserRight) =>
      Promise.all(
        establishmentsWithUserRight.map((establishment) =>
          updateEstablishment({
            establishment,
            userToDeleteId: userToDelete.id,
            uow,
          }),
        ),
      ),
    );
