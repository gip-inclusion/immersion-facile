import { equals } from "ramda";
import {
  type AbsoluteUrl,
  type ConnectedUserDomainJwtPayload,
  errors,
  type WithFormEstablishmentDto,
  withFormEstablishmentSchema,
} from "shared";
import type { AddressGateway } from "../../core/address/ports/AddressGateway";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
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

    const triggeredBy = await getTriggeredBy(
      uow,
      currentUser,
      initialEstablishmentAggregate,
    );

    if (triggeredBy.kind !== "connected-user") throw errors.user.unauthorized();
    const triggeredByUser = await uow.userRepository.getById(
      triggeredBy.userId,
    );
    if (!triggeredByUser)
      throw errors.user.notFound({ userId: triggeredBy.userId });

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
    const userRightsUpdated = getUserRightsUpdated(
      establishmentAggregate,
      initialEstablishmentAggregate,
    );

    const makeUserRightsAddedNotifications = () =>
      userRightsAdded.map(async (userRight) => {
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

    const makeUserRightsUpdatedNotifications = () =>
      userRightsUpdated.map(async (userRight) => {
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

    await Promise.all([
      ...makeUserRightsAddedNotifications(),
      ...makeUserRightsUpdatedNotifications(),
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
          triggeredBy,
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

const getUserRightsUpdated = (
  updatedEstablishmentAggregate: EstablishmentAggregate,
  initialEstablishmentAggregate: EstablishmentAggregate,
): EstablishmentUserRight[] => {
  return updatedEstablishmentAggregate.userRights.filter((userRight) =>
    initialEstablishmentAggregate.userRights.some(
      (existingUserRight) =>
        existingUserRight.userId === userRight.userId &&
        !equals(existingUserRight, userRight),
    ),
  );
};

const getTriggeredBy = async (
  uow: UnitOfWork,
  jwtPayload: ConnectedUserDomainJwtPayload,
  establishmentAggregate: EstablishmentAggregate,
): Promise<TriggeredBy> => {
  const user = await uow.userRepository.getById(jwtPayload.userId);
  if (!user) throw errors.user.notFound({ userId: jwtPayload.userId });

  if (
    establishmentAggregate.userRights.some(
      ({ userId }) => userId === user.id,
    ) ||
    user.isBackofficeAdmin
  )
    return {
      kind: "connected-user",
      userId: user.id,
    };

  throw errors.user.forbidden({
    userId: user.id,
  });
};
