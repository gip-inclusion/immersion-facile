import { equals } from "ramda";
import {
  type AbsoluteUrl,
  type InclusionConnectDomainJwtPayload,
  type WithFormEstablishmentDto,
  errors,
  withFormEstablishmentSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import type { AddressGateway } from "../../core/address/ports/AddressGateway";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import type {
  EstablishmentAggregate,
  EstablishmentUserRight,
} from "../entities/EstablishmentAggregate";
import { makeEstablishmentAggregate } from "../helpers/makeEstablishmentAggregate";

export class UpdateEstablishmentAggregateFromForm extends TransactionalUseCase<
  WithFormEstablishmentDto,
  void,
  InclusionConnectDomainJwtPayload
> {
  protected inputSchema = withFormEstablishmentSchema;

  readonly #addressGateway: AddressGateway;

  readonly #uuidGenerator: UuidGenerator;

  readonly #timeGateway: TimeGateway;

  readonly #createNewEvent: CreateNewEvent;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #immersionBaseUrl: AbsoluteUrl;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    addressAPI: AddressGateway,
    uuidGenerator: UuidGenerator,
    timeGateway: TimeGateway,
    createNewEvent: CreateNewEvent,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    immersionBaseUrl: AbsoluteUrl,
  ) {
    super(uowPerformer);

    this.#addressGateway = addressAPI;
    this.#timeGateway = timeGateway;
    this.#uuidGenerator = uuidGenerator;
    this.#createNewEvent = createNewEvent;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#immersionBaseUrl = immersionBaseUrl;
  }

  public async _execute(
    { formEstablishment }: WithFormEstablishmentDto,
    uow: UnitOfWork,
    jwtPayload: InclusionConnectDomainJwtPayload,
  ): Promise<void> {
    if (!jwtPayload) throw errors.user.noJwtProvided();

    const initialEstablishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        formEstablishment.siret,
      );

    if (!initialEstablishmentAggregate)
      throw errors.establishment.notFound({
        siret: formEstablishment.siret,
      });

    const triggeredBy = await this.#getTriggeredBy(
      uow,
      jwtPayload,
      initialEstablishmentAggregate,
    );

    if (triggeredBy.kind !== "inclusion-connected")
      throw errors.user.unauthorized();
    const triggeredByUser = await uow.userRepository.getById(
      triggeredBy.userId,
    );
    if (!triggeredByUser)
      throw errors.user.notFound({ userId: triggeredBy.userId });

    const establishmentAggregate = await makeEstablishmentAggregate({
      uow,
      timeGateway: this.#timeGateway,
      addressGateway: this.#addressGateway,
      uuidGenerator: this.#uuidGenerator,
      existingEntity: initialEstablishmentAggregate.establishment,
      formEstablishment,
      // Rien touché mais étonnant qu'on maj pas le naf ni le nombre d'employés
      nafAndNumberOfEmployee: {
        nafDto: initialEstablishmentAggregate.establishment.nafDto,
        numberEmployeesRange:
          initialEstablishmentAggregate.establishment.numberEmployeesRange,
      },
      score: initialEstablishmentAggregate.establishment.score,
    });

    const userRightsAdded = this.#getUserRightsAdded(
      establishmentAggregate,
      initialEstablishmentAggregate,
    );
    const userRightsUpdated = this.#getUserRightsUpdated(
      establishmentAggregate,
      initialEstablishmentAggregate,
    );

    const makeUserRightsAddedNotifications = () =>
      userRightsAdded.map(async (userRight) => {
        const user = await uow.userRepository.getById(userRight.userId);
        if (!user) throw errors.user.notFound({ userId: userRight.userId });
        return this.#saveNotificationAndRelatedEvent(uow, {
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
              immersionBaseUrl: this.#immersionBaseUrl,
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
        return this.#saveNotificationAndRelatedEvent(uow, {
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
      this.#timeGateway.now(),
    );

    return uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "UpdatedEstablishmentAggregateInsertedFromForm",
        payload: {
          siret: establishmentAggregate.establishment.siret,
          triggeredBy,
        },
      }),
    );
  }

  #getUserRightsAdded(
    updatedFormEstablishment: EstablishmentAggregate,
    initialEstablishmentAggregate: EstablishmentAggregate,
  ): EstablishmentUserRight[] {
    return updatedFormEstablishment.userRights.filter(
      (userRight) =>
        !initialEstablishmentAggregate.userRights.some(
          (existingUserRight) => existingUserRight.userId === userRight.userId,
        ),
    );
  }

  #getUserRightsUpdated(
    updatedEstablishmentAggregate: EstablishmentAggregate,
    initialEstablishmentAggregate: EstablishmentAggregate,
  ): EstablishmentUserRight[] {
    return updatedEstablishmentAggregate.userRights.filter((userRight) =>
      initialEstablishmentAggregate.userRights.some(
        (existingUserRight) =>
          existingUserRight.userId === userRight.userId &&
          !equals(existingUserRight, userRight),
      ),
    );
  }

  async #getTriggeredBy(
    uow: UnitOfWork,
    jwtPayload: InclusionConnectDomainJwtPayload,
    establishmentAggregate: EstablishmentAggregate,
  ): Promise<TriggeredBy> {
    const user = await uow.userRepository.getById(jwtPayload.userId);
    if (!user) throw errors.user.notFound({ userId: jwtPayload.userId });

    if (
      establishmentAggregate.userRights.some(
        ({ userId }) => userId === user.id,
      ) ||
      user.isBackofficeAdmin
    )
      return {
        kind: "inclusion-connected",
        userId: user.id,
      };

    throw errors.user.forbidden({
      userId: user.id,
    });
  }
}
