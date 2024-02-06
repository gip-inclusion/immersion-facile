import { WithFormEstablishmentDto, withFormEstablishmentSchema } from "shared";
import { getAddressAndPosition } from "../../../utils/address";
import { TransactionalUseCase } from "../../core/UseCase";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { AddressGateway } from "../ports/AddressGateway";
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
          getAddressAndPosition(
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
