import { z } from "zod";
import { BackOfficeJwtPayload, SiretDto, siretSchema } from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

type DeleteEstablishmentPayload = {
  siret: SiretDto;
};

const deleteEstablishmentPayloadSchema: z.Schema<DeleteEstablishmentPayload> =
  z.object({
    siret: siretSchema,
  });

export class DeleteEstablishment extends TransactionalUseCase<
  DeleteEstablishmentPayload,
  void,
  BackOfficeJwtPayload
> {
  protected inputSchema = deleteEstablishmentPayloadSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    { siret }: DeleteEstablishmentPayload,
    uow: UnitOfWork,
    jwtPayload?: BackOfficeJwtPayload,
  ): Promise<void> {
    if (!jwtPayload) throw new ForbiddenError();

    const [establishmentInRepo, formEstablishmentInRepo] = await Promise.all([
      uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      ),
      await uow.formEstablishmentRepository.getBySiret(siret),
    ]);

    if (!establishmentInRepo)
      throw new NotFoundError(`Establishment with siret ${siret} not found`);
    if (!formEstablishmentInRepo)
      throw new NotFoundError(
        `Establishment form with siret ${siret} not found`,
      );

    await Promise.all([
      uow.establishmentAggregateRepository.delete(
        establishmentInRepo.establishment.siret,
      ),
      uow.formEstablishmentRepository.delete(formEstablishmentInRepo.siret),
    ]);
  }
}
