import {
  addressDtoToString,
  type ConnectedUser,
  errors,
  type SiretDto,
  siretSchema,
} from "shared";
import { z } from "zod";
import { throwIfNotAdmin } from "../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

type DeleteEstablishmentPayload = {
  siret: SiretDto;
};

const deleteEstablishmentPayloadSchema: z.Schema<DeleteEstablishmentPayload> =
  z.object({
    siret: siretSchema,
  });

export class DeleteEstablishment extends TransactionalUseCase<
  DeleteEstablishmentPayload,
  void,
  ConnectedUser
> {
  protected inputSchema = deleteEstablishmentPayloadSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private timeGateway: TimeGateway,
    private readonly saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    private readonly createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    { siret }: DeleteEstablishmentPayload,
    uow: UnitOfWork,
    currentUser: ConnectedUser,
  ): Promise<void> {
    throwIfNotAdmin(currentUser);

    const groupsWithSiret = await uow.groupRepository.groupsWithSiret(siret);

    const groupsUpdatedWithoutSiret = groupsWithSiret.map((group) => ({
      ...group,
      sirets: group.sirets.filter((groupSiret) => groupSiret !== siret),
    }));

    const establishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      );
    if (!establishmentAggregate) throw errors.establishment.notFound({ siret });

    await Promise.all([
      uow.establishmentAggregateRepository.delete(siret),
      ...groupsUpdatedWithoutSiret.map((group) =>
        uow.groupRepository.save(group),
      ),
      uow.deletedEstablishmentRepository.save({
        siret,
        createdAt: establishmentAggregate.establishment.createdAt,
        deletedAt: this.timeGateway.now(),
      }),
    ]);

    const adminIds = establishmentAggregate.userRights
      .filter(({ role }) => role === "establishment-admin")
      .map(({ userId }) => userId);
    const contactIds = establishmentAggregate.userRights
      .filter(({ role }) => role === "establishment-contact")
      .map(({ userId }) => userId);

    const deletedEstablishmentEvent = this.createNewEvent({
      topic: "EstablishmentDeleted",
      payload: {
        siret,
        triggeredBy: { kind: "connected-user", userId: currentUser.id },
      },
    });

    await uow.outboxRepository.save(deletedEstablishmentEvent);
    await this.saveNotificationAndRelatedEvent(uow, {
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
  }
}
