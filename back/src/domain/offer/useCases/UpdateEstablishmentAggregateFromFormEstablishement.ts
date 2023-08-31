import { FormEstablishmentDto, formEstablishmentSchema } from "shared";
import { makeUpdateEstablishmentAggregateFromFormEstablishment } from "../../../utils/makeFormEstablishmentToEstablishmentAggregate";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
import { AddressGateway } from "../ports/AddressGateway";

export class UpdateEstablishmentAggregateFromForm extends TransactionalUseCase<
  FormEstablishmentDto,
  void
> {
  protected inputSchema = formEstablishmentSchema;

  readonly #addressAPI: AddressGateway;

  readonly #uuidGenerator: UuidGenerator;

  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    addressAPI: AddressGateway,
    uuidGenerator: UuidGenerator,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);

    this.#addressAPI = addressAPI;
    this.#timeGateway = timeGateway;
    this.#uuidGenerator = uuidGenerator;
  }

  public async _execute(
    formEstablishment: FormEstablishmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const initialEstablishmentAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        formEstablishment.siret,
      );

    if (!initialEstablishmentAggregate)
      throw new Error("Cannot update establishment that does not exist.");

    const establishmentAggregate =
      await makeUpdateEstablishmentAggregateFromFormEstablishment({
        addressGateway: this.#addressAPI,
        uuidGenerator: this.#uuidGenerator,
        timeGateway: this.#timeGateway,
      })(initialEstablishmentAggregate, formEstablishment);

    if (!establishmentAggregate) return;

    await uow.establishmentAggregateRepository.updateEstablishmentAggregate(
      establishmentAggregate,
      this.#timeGateway.now(),
    );
  }
}
