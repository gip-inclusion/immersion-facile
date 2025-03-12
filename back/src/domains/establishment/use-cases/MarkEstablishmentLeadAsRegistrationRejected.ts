import { type ConventionJwtPayload, errors } from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../core/UseCase";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import type { EstablishmentLead } from "../entities/EstablishmentLeadEntity";

export class MarkEstablishmentLeadAsRegistrationRejected extends TransactionalUseCase<
  void,
  void,
  ConventionJwtPayload
> {
  protected inputSchema = z.void();

  #timeGateway: TimeGateway;

  constructor(uowPerformer: UnitOfWorkPerformer, timeGateway: TimeGateway) {
    super(uowPerformer);
    this.#timeGateway = timeGateway;
  }

  public async _execute(
    _: void,
    uow: UnitOfWork,
    jwtPayload: ConventionJwtPayload,
  ): Promise<void> {
    const convention = await uow.conventionRepository.getById(
      jwtPayload.applicationId,
    );

    if (!convention)
      throw errors.convention.notFound({
        conventionId: jwtPayload.applicationId,
      });

    const establishmentLead = await uow.establishmentLeadRepository.getBySiret(
      convention.siret,
    );

    if (!establishmentLead)
      throw errors.establishmentLead.notFound({ siret: convention.siret });

    if (establishmentLead.lastEventKind === "registration-refused") return;

    const { siret, events } = establishmentLead;
    const updatedEstablishmentLead: EstablishmentLead = {
      siret,
      lastEventKind: "registration-refused",
      events: [
        ...events,
        { kind: "registration-refused", occurredAt: this.#timeGateway.now() },
      ],
    };

    await uow.establishmentLeadRepository.save(updatedEstablishmentLead);
  }
}
