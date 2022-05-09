import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { formEstablishmentSchema } from "shared/src/formEstablishment/FormEstablishment.schema";
import { makeFormEstablishmentToEstablishmentAggregate } from "../../../utils/makeFormEstablishmentToEstablishmentAggregate";
import { notifyAndThrowErrorDiscord } from "../../../utils/notifyDiscord";
import { Clock } from "../../core/ports/Clock";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
import { SireneGateway } from "../../sirene/ports/SireneGateway";
import { AdresseAPI } from "../ports/AdresseAPI";

export class UpdateEstablishmentAggregateFromForm extends TransactionalUseCase<
  FormEstablishmentDto,
  void
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly sireneGateway: SireneGateway,
    private readonly adresseAPI: AdresseAPI,
    private readonly uuidGenerator: UuidGenerator,
    private readonly clock: Clock,
  ) {
    super(uowPerformer);
  }

  inputSchema = formEstablishmentSchema;

  public async _execute(
    formEstablishment: FormEstablishmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const establishmentAlreadyExists =
      (
        await uow.establishmentAggregateRepo.getEstablishmentForSiret(
          formEstablishment.siret,
        )
      )?.dataSource === "form";
    if (!establishmentAlreadyExists)
      throw new Error(
        "Cannot update establishment from form that does not exist.",
      );

    // TODO : We should not remove the aggregate but rather update it !
    await uow.establishmentAggregateRepo.removeEstablishmentAndOffersAndContactWithSiret(
      formEstablishment.siret,
    );

    const establishmentAggregate =
      await makeFormEstablishmentToEstablishmentAggregate({
        sireneGateway: this.sireneGateway,
        adresseAPI: this.adresseAPI,
        uuidGenerator: this.uuidGenerator,
        clock: this.clock,
      })(formEstablishment);

    if (!establishmentAggregate) return;

    await uow.establishmentAggregateRepo
      .insertEstablishmentAggregates([establishmentAggregate])
      .catch((err: any) => {
        notifyAndThrowErrorDiscord(
          new Error(
            `Error when adding establishment aggregate with siret ${formEstablishment.siret} due to ${err}`,
          ),
        );
      });
  }
}
