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
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly addressAPI: AddressGateway,
    private readonly uuidGenerator: UuidGenerator,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = formEstablishmentSchema;

  public async _execute(
    formEstablishment: FormEstablishmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const initialEstablishementAggregate =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        formEstablishment.siret,
      );
    const establishmentAlreadyExists =
      initialEstablishementAggregate?.establishment?.dataSource === "form";
    if (!establishmentAlreadyExists)
      throw new Error(
        "Cannot update establishment from form that does not exist.",
      );

    const establishmentAggregate =
      await makeUpdateEstablishmentAggregateFromFormEstablishment({
        addressGateway: this.addressAPI,
        uuidGenerator: this.uuidGenerator,
        timeGateway: this.timeGateway,
      })(initialEstablishementAggregate, formEstablishment);

    if (!establishmentAggregate) return;

    await uow.establishmentAggregateRepository.updateEstablishmentAggregate(
      establishmentAggregate,
      this.timeGateway.now(),
    );
  }
}
