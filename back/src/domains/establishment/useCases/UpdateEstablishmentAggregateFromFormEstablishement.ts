import { WithFormEstablishmentDto, withFormEstablishmentSchema } from "shared";
import { rawAddressToLocation } from "../../../utils/address";
import { TransactionalUseCase } from "../../core/UseCase";
import { AddressGateway } from "../../core/address/ports/AddressGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import { makeEstablishmentAggregate } from "../service/makeEstablishmentAggregate";

export class UpdateEstablishmentAggregateFromForm extends TransactionalUseCase<
  WithFormEstablishmentDto,
  void
> {
  protected inputSchema = withFormEstablishmentSchema;

  readonly #addressGateway: AddressGateway;

  readonly #uuidGenerator: UuidGenerator;

  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    addressAPI: AddressGateway,
    uuidGenerator: UuidGenerator,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);

    this.#addressGateway = addressAPI;
    this.#timeGateway = timeGateway;
    this.#uuidGenerator = uuidGenerator;
  }

  public async _execute(
    { formEstablishment }: WithFormEstablishmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const initialEstablishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        formEstablishment.siret,
      );

    if (!initialEstablishmentAggregate)
      throw new Error("Cannot update establishment that does not exist.");

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
    });

    await uow.establishmentAggregateRepository.updateEstablishmentAggregate(
      establishmentAggregate,
      this.#timeGateway.now(),
    );
  }
}
