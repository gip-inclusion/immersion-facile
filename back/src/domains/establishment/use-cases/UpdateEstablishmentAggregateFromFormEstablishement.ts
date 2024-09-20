import {
  WithFormEstablishmentDto,
  errors,
  withFormEstablishmentSchema,
} from "shared";
import { rawAddressToLocation } from "../../../utils/address";
import { TransactionalUseCase } from "../../core/UseCase";
import { AddressGateway } from "../../core/address/ports/AddressGateway";
import {
  WithTriggeredBy,
  withTriggeredBySchema,
} from "../../core/events/events";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import { makeEstablishmentAggregate } from "../helpers/makeEstablishmentAggregate";

export class UpdateEstablishmentAggregateFromForm extends TransactionalUseCase<
  WithFormEstablishmentDto & WithTriggeredBy,
  void
> {
  protected inputSchema = withFormEstablishmentSchema.and(
    withTriggeredBySchema,
  );

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
    {
      formEstablishment,
      triggeredBy,
    }: WithFormEstablishmentDto & WithTriggeredBy,
    uow: UnitOfWork,
  ): Promise<void> {
    const initialEstablishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        formEstablishment.siret,
      );

    if (!initialEstablishmentAggregate)
      throw errors.establishment.notFound({
        siret: formEstablishment.siret,
      });

    const establishmentAggregate = makeEstablishmentAggregate({
      uuidGenerator: this.#uuidGenerator,
      timeGateway: this.#timeGateway,
      nafAndNumberOfEmployee: {
        nafDto: initialEstablishmentAggregate.establishment.nafDto,
        numberEmployeesRange:
          initialEstablishmentAggregate.establishment.numberEmployeesRange,
      },
      addressesAndPosition: await Promise.all(
        formEstablishment.businessAddresses.map(async (address) =>
          rawAddressToLocation(
            this.#addressGateway,
            formEstablishment.siret,
            address,
          ),
        ),
      ),
      formEstablishment,
      score: initialEstablishmentAggregate.establishment.score,
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
