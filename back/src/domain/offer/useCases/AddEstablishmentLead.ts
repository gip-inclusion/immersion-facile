import { WithConventionDto, withConventionSchema } from "shared";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
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
      throw new BadRequestError(
        `La convention ${convention.id} n'est pas validée. Son status est : ${convention.status}`,
      );

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
