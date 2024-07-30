import { WithConventionDto, errors, withConventionSchema } from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { EstablishmentLead } from "../entities/EstablishmentLeadEntity";

export class AddEstablishmentLead extends TransactionalUseCase<WithConventionDto> {
  protected inputSchema = withConventionSchema;

  readonly #timeGateway: TimeGateway;

  constructor(uowPerformer: UnitOfWorkPerformer, timeGateway: TimeGateway) {
    super(uowPerformer);

    this.#timeGateway = timeGateway;
  }

  public async _execute(
    { convention }: WithConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    if (convention.status !== "ACCEPTED_BY_VALIDATOR")
      throw errors.convention.notValidated({ convention });

    const alreadyExistingLead =
      await uow.establishmentLeadRepository.getBySiret(convention.siret);

    const existingEstablishment =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        convention.siret,
      );

    if (alreadyExistingLead || existingEstablishment) return;

    const establishmentLead: EstablishmentLead = {
      siret: convention.siret,
      lastEventKind: "to-be-reminded",
      events: [
        {
          conventionId: convention.id,
          occurredAt: this.#timeGateway.now(),
          kind: "to-be-reminded",
        },
      ],
    };
    await uow.establishmentLeadRepository.save(establishmentLead);
  }
}
