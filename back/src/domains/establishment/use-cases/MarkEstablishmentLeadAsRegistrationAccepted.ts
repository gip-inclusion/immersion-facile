import { WithFormEstablishmentDto, withFormEstablishmentSchema } from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { EstablishmentLead } from "../entities/EstablishmentLeadEntity";

export class MarkEstablishmentLeadAsRegistrationAccepted extends TransactionalUseCase<WithFormEstablishmentDto> {
  protected inputSchema = withFormEstablishmentSchema;

  #timeGateway: TimeGateway;

  constructor(uowPerformer: UnitOfWorkPerformer, timeGateway: TimeGateway) {
    super(uowPerformer);
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    { formEstablishment }: WithFormEstablishmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const alreadyExistingLead =
      await uow.establishmentLeadRepository.getBySiret(formEstablishment.siret);

    if (!alreadyExistingLead) return;

    const establishmentLead: EstablishmentLead = {
      siret: formEstablishment.siret,
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
