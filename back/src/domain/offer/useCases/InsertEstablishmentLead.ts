import { WithConventionDto, withConventionSchema } from "shared";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { EstablishmentLead } from "../entities/EstablishmentLeadEntity";

export class InsertEstablishmentLead extends TransactionalUseCase<WithConventionDto> {
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
    const establishmentLead: EstablishmentLead = {
      siret: convention.siret,
      lastEventKind: "to-be-reminded",
      events: [
        {
          conventionId: convention.id,
          occuredAt: this.#timeGateway.now(),
          kind: "to-be-reminded",
        },
      ],
    };
    await uow.establishmentLeadRepository.save(establishmentLead);
  }
}
