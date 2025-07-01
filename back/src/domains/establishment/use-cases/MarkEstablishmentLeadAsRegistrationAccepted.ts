import { type WithSiretDto, withSiretSchema } from "shared";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { EstablishmentLead } from "../entities/EstablishmentLeadEntity";

export class MarkEstablishmentLeadAsRegistrationAccepted extends TransactionalUseCase<WithSiretDto> {
  protected inputSchema = withSiretSchema;

  #timeGateway: TimeGateway;

  constructor(uowPerformer: UnitOfWorkPerformer, timeGateway: TimeGateway) {
    super(uowPerformer);
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    { siret }: WithSiretDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const alreadyExistingLead =
      await uow.establishmentLeadRepository.getBySiret(siret);

    if (!alreadyExistingLead) return;

    const establishmentLead: EstablishmentLead = {
      siret,
      lastEventKind: "registration-accepted",
      events: [
        ...alreadyExistingLead.events,
        {
          occurredAt: this.#timeGateway.now(),
          kind: "registration-accepted",
        },
      ],
    };

    await uow.establishmentLeadRepository.save(establishmentLead);
  }
}
