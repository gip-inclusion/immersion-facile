import { ConventionJwtPayload } from "shared";
import { z } from "zod";
import { NotFoundError } from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { EstablishmentLead } from "../entities/EstablishmentLeadEntity";

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
      throw new NotFoundError(
        `No convention were found with id ${jwtPayload.applicationId}`,
      );

    const establishmentLead = await uow.establishmentLeadRepository.getBySiret(
      convention.siret,
    );

    if (!establishmentLead)
      throw new NotFoundError(
        `No establishment lead were found with siret ${convention.siret}`,
      );

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