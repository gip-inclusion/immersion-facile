import {
  type FormEstablishmentDto,
  type InclusionConnectDomainJwtPayload,
  type WithFormEstablishmentDto,
  errors,
  withFormEstablishmentSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import type { AddressGateway } from "../../core/address/ports/AddressGateway";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import type { EstablishmentAggregate } from "../entities/EstablishmentAggregate";
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

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    addressAPI: AddressGateway,
    uuidGenerator: UuidGenerator,
    timeGateway: TimeGateway,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);

    this.#addressGateway = addressAPI;
    this.#timeGateway = timeGateway;
    this.#uuidGenerator = uuidGenerator;
    this.#createNewEvent = createNewEvent;
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

    return this.withAllowedRights(
      uow,
      formEstablishment,
      initialEstablishmentAggregate,
      triggeredBy,
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

  private async withAllowedRights(
    uow: UnitOfWork,
    formEstablishment: FormEstablishmentDto,
    originalAggregate: EstablishmentAggregate,
    triggeredBy: TriggeredBy,
  ): Promise<void> {
    const establishmentAggregate = await makeEstablishmentAggregate({
      uow,
      timeGateway: this.#timeGateway,
      addressGateway: this.#addressGateway,
      uuidGenerator: this.#uuidGenerator,
      existingEntity: originalAggregate.establishment,
      formEstablishment,
      // Rien touché mais étonnant qu'on maj pas le naf ni le nombre d'employés
      nafAndNumberOfEmployee: {
        nafDto: originalAggregate.establishment.nafDto,
        numberEmployeesRange:
          originalAggregate.establishment.numberEmployeesRange,
      },
      score: originalAggregate.establishment.score,
    });

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
}
