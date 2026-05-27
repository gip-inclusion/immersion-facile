import {
  addressDtoToString,
  type ConnectedUser,
  errors,
  executeInSequence,
  withSiretSchema,
} from "shared";
import { throwIfNotAdmin } from "../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type DeleteEstablishment = ReturnType<typeof makeDeleteEstablishment>;
export const makeDeleteEstablishment = useCaseBuilder("DeleteEstablishment")
  .withInput(withSiretSchema)
  .withCurrentUser<ConnectedUser | void>()
  .withDeps<{
    timeGateway: TimeGateway;
    createNewEvent: CreateNewEvent;
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  }>()
  .build(async ({ currentUser, deps, inputParams, uow }) => {
    if (!currentUser) throw errors.user.unauthorized();
    throwIfNotAdmin(currentUser);

    const groupsWithSiret = await uow.groupRepository.groupsWithSiret(
      inputParams.siret,
    );

    const groupsUpdatedWithoutSiret = groupsWithSiret.map((group) => ({
      ...group,
      sirets: group.sirets.filter(
        (groupSiret) => groupSiret !== inputParams.siret,
      ),
    }));

    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        inputParams.siret,
      );

    if (!establishmentAggregate)
      throw errors.establishment.notFound({ siret: inputParams.siret });

    await uow.establishmentAggregateRepository.delete(
      establishmentAggregate.establishment.siret,
    );

    await executeInSequence(groupsUpdatedWithoutSiret, (group) =>
      uow.groupRepository.save(group),
    );

    await uow.deletedEstablishmentRepository.save({
      siret: establishmentAggregate.establishment.siret,
      createdAt: establishmentAggregate.establishment.createdAt,
      deletedAt: deps.timeGateway.now(),
    });

    const adminIds = establishmentAggregate.userRights
      .filter(({ role }) => role === "establishment-admin")
      .map(({ userId }) => userId);
    const contactIds = establishmentAggregate.userRights
      .filter(({ role }) => role === "establishment-contact")
      .map(({ userId }) => userId);

    const deletedEstablishmentEvent = deps.createNewEvent({
      topic: "EstablishmentDeleted",
      payload: {
        siret: establishmentAggregate.establishment.siret,
        triggeredBy: { kind: "connected-user", userId: currentUser.id },
      },
    });

    await uow.outboxRepository.save(deletedEstablishmentEvent);
    await deps.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "ESTABLISHMENT_DELETED",
        recipients: (await uow.userRepository.getByIds(adminIds)).map(
          ({ email }) => email,
        ),
        cc: (await uow.userRepository.getByIds(contactIds)).map(
          ({ email }) => email,
        ),
        params: {
          businessAddresses: establishmentAggregate.establishment.locations.map(
            (addressAndPosition) =>
              addressDtoToString(addressAndPosition.address),
          ),
          businessName: establishmentAggregate.establishment.name,
          siret: establishmentAggregate.establishment.siret,
        },
      },
      followedIds: {
        establishmentSiret: establishmentAggregate.establishment.siret,
      },
    });
  });
