import { z } from "zod";
import { BackOfficeJwtPayload, SiretDto, siretSchema } from "shared";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
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

    const groupsWithSiret =
      await uow.establishmentGroupRepository.groupsWithSiret(siret);

    const groupsUpdatedWithoutSiret = groupsWithSiret.map((group) => ({
      ...group,
      sirets: group.sirets.filter((groupSiret) => groupSiret !== siret),
    }));

    await Promise.all([
      uow.establishmentAggregateRepository.delete(siret),
      uow.formEstablishmentRepository.delete(siret),
      ...groupsUpdatedWithoutSiret.map((group) =>
        uow.establishmentGroupRepository.save(group),
      ),
    ]);
  }
}
