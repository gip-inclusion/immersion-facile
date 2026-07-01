import { keys, toPairs, uniq, values } from "ramda";
import {
  type AgencyId,
  type AgencyRole,
  type AgencyStatus,
  type AgencyUserRight,
  type AgencyUsersRights,
  type AgencyWithUsersRights,
  type ExtractFromExisting,
  errors,
  executeInSequence,
  isNotEmptyArray,
  type UserId,
  type UserWithAdminRights,
  type WithUserId,
  withUserIdSchema,
  type ZodSchemaWithInputMatchingOutput,
} from "shared";
import z from "zod";
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

export const partialDeleteOptions = [
  "establishement-only",
  "agency-only",
] as const;

export type DeleteUserInputSchema = WithUserId &
  WithTriggeredBy & {
    partialDelete?: (typeof partialDeleteOptions)[number];
  };

const deleteUserInputSchema: ZodSchemaWithInputMatchingOutput<DeleteUserInputSchema> =
  withUserIdSchema
    .and(withTriggeredBySchema)
    .and(z.object({ partialDelete: z.enum(partialDeleteOptions).optional() }));

export type DeleteUser = ReturnType<typeof makeDeleteUser>;

export const makeDeleteUser = useCaseBuilder("DeleteUser")
  .withDeps<{ timeGateway: TimeGateway; createNewEvent: CreateNewEvent }>()
  .withInput(deleteUserInputSchema)
  .build(
    async ({ uow, deps: { createNewEvent, timeGateway }, inputParams }) => {
      if (inputParams.triggeredBy?.kind !== "crawler")
        throw errors.user.forbiddenNotTriggeredByCrawler();

      const userToDelete = await uow.userRepository.getById(inputParams.userId);
      if (!userToDelete) throw errors.user.notFound(inputParams);

      const { data: agenciesWithUserRight } =
        await uow.agencyRepository.getAgencies({
          filters: { userIds: [userToDelete.id] },
        });
      const establishmentsWithUserRight =
        await uow.establishmentAggregateRepository.getEstablishmentAggregatesByFilters(
          { userId: userToDelete.id },
        );

      if (inputParams.partialDelete)
        throw new Error("HYBRYD BEHAVIOR NOT IMPLEMENTED");

      const updatedAgencies = await executeInSequence(
        agenciesWithUserRight,
        updateAgency(uow, userToDelete.id),
      );

      const updatedEstablishments = await executeInSequence(
        establishmentsWithUserRight,
        updateEstablishment(uow, userToDelete.id),
      );

      await executeInSequence(updatedEstablishments, (establishment) =>
        uow.establishmentAggregateRepository.updateEstablishmentAggregate(
          establishment,
          timeGateway.now(),
        ),
      );
      await executeInSequence(updatedAgencies, (agency) =>
        uow.agencyRepository.update(agency),
      );
      await uow.userRepository.delete(userToDelete.id);
      await uow.outboxRepository.saveNewEventsBatch(
        makeEvents({
          createNewEvent,
          userToDelete,
          updatedEstablishments,
          updatedAgencies,
          triggeredBy: {
            kind: "crawler",
          },
        }),
      );
    },
  );

const updateEstablishment =
  (uow: UnitOfWork, userId: UserId) =>
  async (
    establishment: EstablishmentAggregate,
  ): Promise<EstablishmentAggregate> => {
    const remainingRights = establishment.userRights.filter(
      (right) => userId !== right.userId,
    );

    const isNoMoreEstablishmentAdmins =
      remainingRights.filter(({ role }) => role === "establishment-admin")
        .length === 0;

    const userIdToSetAdmin =
      isNotEmptyArray(remainingRights) && isNoMoreEstablishmentAdmins
        ? await getMostActiveUserId(
            uow,
            remainingRights.map(({ userId }) => userId),
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
                  status: "ACCEPTED",
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
  updatedAgencies,
  triggeredBy,
}: {
  createNewEvent: CreateNewEvent;
  userToDelete: UserWithAdminRights;
  updatedEstablishments: EstablishmentAggregate[];
  updatedAgencies: AgencyWithUsersRights[];
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
  ...updatedAgencies
    .filter(isAgencyWithRightsButWithoutAdminOrValidator)
    .map((agency) =>
      createNewEvent({
        topic: "AgencyHasBeenPutOnHold",
        payload: { agencyId: agency.id, triggeredBy: { kind: "crawler" } },
      }),
    ),
];

type AgencyRightList = Array<AgencyUserRight & WithUserId>;

const updateAgency =
  (uow: UnitOfWork, userId: UserId) =>
  async (agency: AgencyWithUsersRights): Promise<AgencyWithUsersRights> => {
    const remainingRightsList = toPairs(
      agency.usersRights,
    ).reduce<AgencyRightList>(
      (acc, [id, right]) => [
        ...acc,
        ...(id !== userId && right ? [{ userId: id, ...right }] : []),
      ],
      [],
    );

    const remainingValidators = remainingRightsList.filter((right) =>
      right.roles.includes("validator"),
    );
    const remainingAdmins = remainingRightsList.filter((right) =>
      right.roles.includes("agency-admin"),
    );

    const userIdToSetNotifiedValidator = await getUserIdToSetNotifiedValidator({
      remainingValidators,
      remainingAdmins,
      uow,
    });

    const userIdToSetAdmin = await getUserIdToSetAdmin({
      remainingValidators,
      remainingAdmins,
      uow,
    });

    return {
      ...agency,
      ...(!remainingValidators.length && !remainingAdmins.length
        ? await getAgencyStatusWhenNoRemainingAdminOrValidator({
            uow,
            agencyId: agency.id,
            remainingRightsList,
          })
        : {}),
      usersRights: remainingRightsList.reduce<AgencyUsersRights>(
        (acc, { userId, ...agencyRight }) => ({
          ...acc,
          [userId]: updateUserAgencyRight({
            isUserSetAdmin: userIdToSetAdmin === userId,
            isUserSetNotifiedValidator: userIdToSetNotifiedValidator === userId,
            agencyRight,
          }),
        }),
        {},
      ),
    };
  };

const getAgencyStatusWhenNoRemainingAdminOrValidator = async ({
  uow,
  agencyId,
  remainingRightsList,
}: {
  uow: UnitOfWork;
  agencyId: AgencyId;
  remainingRightsList: AgencyRightList;
}): Promise<{
  status: ExtractFromExisting<AgencyStatus, "closed" | "rejected">;
  statusJustification: string;
}> => {
  if (!remainingRightsList.length) {
    return {
      status: "closed",
      statusJustification: "Aucun utilisateur actif",
    };
  }

  const acceptedConventions = await uow.conventionQueries.getConventions({
    filters: {
      agencyIds: [agencyId],
      withStatuses: ["ACCEPTED_BY_VALIDATOR"],
    },
    sortBy: "dateStart",
  });

  return {
    status: acceptedConventions.length ? "closed" : "rejected",
    statusJustification: "Aucun utilisateur actif",
  };
};

const getMostActiveUserId = (
  uow: UnitOfWork,
  userIds: UserId[],
): Promise<UserId> =>
  uow.userRepository
    .getByIds(userIds)
    .then(
      (users) =>
        users.sort((a, b) =>
          Number(a.lastLoginAt) < Number(b.lastLoginAt) ? 1 : -1,
        )[0].id,
    );

const establishmentWithUserRights = ({
  userRights,
}: EstablishmentAggregate): boolean => userRights.length === 0;

const isAgencyWithRightsButWithoutAdminOrValidator = ({
  usersRights,
}: AgencyWithUsersRights): boolean =>
  !values(usersRights).some(
    (usersRight) =>
      usersRight?.roles.includes("validator") ||
      usersRight?.roles.includes("agency-admin"),
  ) && keys(usersRights).length > 0;

const getUserIdToSetNotifiedValidator = async ({
  remainingAdmins,
  remainingValidators,
  uow,
}: {
  remainingValidators: AgencyRightList;
  remainingAdmins: AgencyRightList;
  uow: UnitOfWork;
}): Promise<UserId | null> => {
  if (
    remainingValidators.length &&
    !remainingValidators.some((right) => right.isNotifiedByEmail)
  )
    return getMostActiveUserId(
      uow,
      remainingValidators.map(({ userId }) => userId),
    );

  if (!remainingValidators.length && remainingAdmins.length)
    return getMostActiveUserId(
      uow,
      remainingAdmins.map(({ userId }) => userId),
    );

  return null;
};

const getUserIdToSetAdmin = async ({
  remainingAdmins,
  remainingValidators,
  uow,
}: {
  remainingValidators: AgencyRightList;
  remainingAdmins: AgencyRightList;
  uow: UnitOfWork;
}): Promise<UserId | null> =>
  !remainingAdmins.length && remainingValidators.length
    ? getMostActiveUserId(
        uow,
        remainingValidators.map(({ userId }) => userId),
      )
    : null;

const updateUserAgencyRight = ({
  isUserSetAdmin,
  isUserSetNotifiedValidator,
  agencyRight,
}: {
  isUserSetNotifiedValidator: boolean;
  isUserSetAdmin: boolean;
  agencyRight: AgencyUserRight;
}): AgencyUserRight => ({
  isNotifiedByEmail: isUserSetNotifiedValidator
    ? true
    : agencyRight.isNotifiedByEmail,
  roles: uniq([
    ...agencyRight.roles,
    ...(isUserSetNotifiedValidator
      ? (["validator"] satisfies AgencyRole[])
      : []),
    ...(isUserSetAdmin ? (["agency-admin"] satisfies AgencyRole[]) : []),
  ]),
});
