import { equals } from "ramda";
import {
  type AbsoluteUrl,
  type ConnectedUserDomainJwtPayload,
  type EstablishmentUserRightStatus,
  errors,
  onlyAdminUserRightsWithStatusAccepted,
  onlyUserRightWithStatusAccepted,
  type WithFormEstablishmentDto,
  withFormEstablishmentSchema,
} from "shared";
import type { AddressGateway } from "../../core/address/ports/AddressGateway";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import type {
  EstablishmentAggregate,
  EstablishmentUserRight,
} from "../entities/EstablishmentAggregate";
import { makeEstablishmentAggregate } from "../helpers/makeEstablishmentAggregate";

export type UpdateEstablishmentAggregateFromForm = ReturnType<
  typeof makeUpdateEstablishmentAggregateFromForm
>;

type Deps = {
  addressGateway: AddressGateway;
  uuidGenerator: UuidGenerator;
  timeGateway: TimeGateway;
  createNewEvent: CreateNewEvent;
  saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  immersionBaseUrl: AbsoluteUrl;
};

export const makeUpdateEstablishmentAggregateFromForm = useCaseBuilder(
  "UpdateEstablishmentAggregateFromForm",
)
  .withInput<WithFormEstablishmentDto>(withFormEstablishmentSchema)
  .withCurrentUser<ConnectedUserDomainJwtPayload>()
  .withDeps<Deps>()
  .build(async ({ deps, inputParams, uow, currentUser }) => {
    const initialEstablishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        inputParams.formEstablishment.siret,
      );

    if (!initialEstablishmentAggregate)
      throw errors.establishment.notFound({
        siret: inputParams.formEstablishment.siret,
      });

    const triggeredByUser = await uow.userRepository.getById(
      currentUser.userId,
    );

    if (!triggeredByUser)
      throw errors.user.notFound({ userId: currentUser.userId });

    const hasPermission =
      triggeredByUser.isBackofficeAdmin ||
      initialEstablishmentAggregate.userRights.some(
        ({ userId, status, role }) =>
          userId === triggeredByUser.id &&
          onlyAdminUserRightsWithStatusAccepted({
            role,
            status,
          }),
      );

    if (!hasPermission)
      throw errors.user.forbidden({
        userId: triggeredByUser.id,
      });

    const establishmentAggregate = await makeEstablishmentAggregate({
      uow,
      timeGateway: deps.timeGateway,
      addressGateway: deps.addressGateway,
      uuidGenerator: deps.uuidGenerator,
      existingEntity: initialEstablishmentAggregate.establishment,
      formEstablishment: inputParams.formEstablishment,
      // Rien touché mais étonnant qu'on maj pas le naf ni le nombre d'employés
      nafAndNumberOfEmployee: {
        nafDto: initialEstablishmentAggregate.establishment.nafDto,
        numberEmployeesRange:
          initialEstablishmentAggregate.establishment.numberEmployeesRange,
      },
      score: initialEstablishmentAggregate.establishment.score,
    });

    const userRightsAdded = getUserRightsAdded(
      establishmentAggregate,
      initialEstablishmentAggregate,
    );
    const userRightsUpdatedWithSameStatus = getUserRightsUpdatedWithSameStatus(
      establishmentAggregate,
      initialEstablishmentAggregate,
    );
    const userRightsUpdatedWithNewStatus = getUserRightsUpdatedWithNewStatus(
      establishmentAggregate,
      initialEstablishmentAggregate,
    );
    const pendingUserRightsRemoved = getPendingUserRightsRemoved(
      establishmentAggregate,
      initialEstablishmentAggregate,
    );

    const makeUserRightsAddedNotifications = () =>
      userRightsAdded
        .filter((userRight) =>
          onlyUserRightWithStatusAccepted({ status: userRight.status }),
        )
        .map(async (userRight) => {
          const user = await uow.userRepository.getById(userRight.userId);
          if (!user) throw errors.user.notFound({ userId: userRight.userId });
          return deps.saveNotificationAndRelatedEvent(uow, {
            kind: "email",
            templatedContent: {
              kind: "ESTABLISHMENT_USER_RIGHTS_ADDED",
              recipients: [user.email],
              params: {
                businessName:
                  establishmentAggregate.establishment.customizedName ??
                  establishmentAggregate.establishment.name,
                firstName: user.firstName,
                lastName: user.lastName,
                triggeredByUserFirstName: triggeredByUser.firstName,
                triggeredByUserLastName: triggeredByUser.lastName,
                role: userRight.role,
                immersionBaseUrl: deps.immersionBaseUrl,
              },
            },
            followedIds: {
              userId: userRight.userId,
              establishmentSiret: establishmentAggregate.establishment.siret,
            },
          });
        });

    const makeUserRightsUpdatedWithSameStatusNotifications = () =>
      userRightsUpdatedWithSameStatus.map(async (userRight) => {
        const user = await uow.userRepository.getById(userRight.userId);
        if (!user) throw errors.user.notFound({ userId: userRight.userId });
        return deps.saveNotificationAndRelatedEvent(uow, {
          kind: "email",
          templatedContent: {
            kind: "ESTABLISHMENT_USER_RIGHTS_UPDATED",
            recipients: [user.email],
            params: {
              businessName:
                establishmentAggregate.establishment.customizedName ??
                establishmentAggregate.establishment.name,
              firstName: user.firstName,
              lastName: user.lastName,
              triggeredByUserFirstName: triggeredByUser.firstName,
              triggeredByUserLastName: triggeredByUser.lastName,
              updatedRole: userRight.role,
            },
          },
          followedIds: {
            userId: userRight.userId,
            establishmentSiret: establishmentAggregate.establishment.siret,
          },
        });
      });

    const businessNameForUserRightsEmails =
      establishmentAggregate.establishment.customizedName ??
      establishmentAggregate.establishment.name;

    const notifyUserRightStatusChangeByEmail = async (
      userId: string,
      updatedStatus:
        | Extract<EstablishmentUserRightStatus, "ACCEPTED">
        | "REJECTED",
    ) => {
      const notifiedUser = await uow.userRepository.getById(userId);
      if (!notifiedUser) throw errors.user.notFound({ userId });
      return deps.saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "ESTABLISHMENT_USER_RIGHTS_STATUS_UPDATED",
          recipients: [notifiedUser.email],
          params: {
            businessName: businessNameForUserRightsEmails,
            firstName: notifiedUser.firstName,
            lastName: notifiedUser.lastName,
            triggeredByUserFirstName: triggeredByUser.firstName,
            triggeredByUserLastName: triggeredByUser.lastName,
            updatedStatus,
            immersionBaseUrl: deps.immersionBaseUrl,
          },
        },
        followedIds: {
          userId,
          establishmentSiret: establishmentAggregate.establishment.siret,
        },
      });
    };

    await Promise.all([
      ...makeUserRightsAddedNotifications(),
      ...makeUserRightsUpdatedWithSameStatusNotifications(),
      ...userRightsUpdatedWithNewStatus.map((userRight) =>
        notifyUserRightStatusChangeByEmail(userRight.userId, "ACCEPTED"),
      ),
      ...pendingUserRightsRemoved.map((removedUserRight) =>
        notifyUserRightStatusChangeByEmail(removedUserRight.userId, "REJECTED"),
      ),
    ]);

    await uow.establishmentAggregateRepository.updateEstablishmentAggregate(
      establishmentAggregate,
      deps.timeGateway.now(),
    );

    return uow.outboxRepository.save(
      deps.createNewEvent({
        topic: "UpdatedEstablishmentAggregateInsertedFromForm",
        payload: {
          siret: establishmentAggregate.establishment.siret,
          triggeredBy: {
            kind: "connected-user",
            userId: triggeredByUser.id,
          },
        },
      }),
    );
  });

const getUserRightsAdded = (
  updatedFormEstablishment: EstablishmentAggregate,
  initialEstablishmentAggregate: EstablishmentAggregate,
): EstablishmentUserRight[] => {
  return updatedFormEstablishment.userRights.filter(
    (userRight) =>
      !initialEstablishmentAggregate.userRights.some(
        (existingUserRight) => existingUserRight.userId === userRight.userId,
      ),
  );
};

const getUserRightsUpdatedWithSameStatus = (
  updatedEstablishmentAggregate: EstablishmentAggregate,
  initialEstablishmentAggregate: EstablishmentAggregate,
): EstablishmentUserRight[] => {
  return updatedEstablishmentAggregate.userRights.filter((userRight) =>
    initialEstablishmentAggregate.userRights.some(
      (existingUserRight) =>
        existingUserRight.userId === userRight.userId &&
        existingUserRight.status === userRight.status &&
        !equals(existingUserRight, userRight),
    ),
  );
};

const getUserRightsUpdatedWithNewStatus = (
  updatedEstablishmentAggregate: EstablishmentAggregate,
  initialEstablishmentAggregate: EstablishmentAggregate,
): EstablishmentUserRight[] => {
  return updatedEstablishmentAggregate.userRights.filter((userRight) =>
    initialEstablishmentAggregate.userRights.some(
      (existingUserRight) =>
        existingUserRight.userId === userRight.userId &&
        existingUserRight.status !== userRight.status,
    ),
  );
};

const getPendingUserRightsRemoved = (
  updatedEstablishmentAggregate: EstablishmentAggregate,
  initialEstablishmentAggregate: EstablishmentAggregate,
): EstablishmentUserRight[] =>
  initialEstablishmentAggregate.userRights.filter(
    (existingUserRight) =>
      existingUserRight.status === "PENDING" &&
      !updatedEstablishmentAggregate.userRights.some(
        ({ userId }) => userId === existingUserRight.userId,
      ),
  );
