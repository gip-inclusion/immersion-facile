import {
  FormEstablishmentDto,
  formEstablishmentSchema,
  SiretDto,
} from "shared";
import { ConflictError } from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { rejectsSiretIfNotAnOpenCompany } from "../../sirene/rejectsSiretIfNotAnOpenCompany";
import { GetSiretUseCase } from "../../sirene/useCases/GetSiret";

export class AddFormEstablishment extends TransactionalUseCase<
  FormEstablishmentDto,
  SiretDto
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
    private readonly getSiret: GetSiretUseCase,
  ) {
    super(uowPerformer);
  }

  inputSchema = formEstablishmentSchema;

  public async _execute(
    dto: FormEstablishmentDto,
    uow: UnitOfWork,
  ): Promise<SiretDto> {
    const featureFlags = await uow.featureFlagRepository.getAll();

    const existingFormEstablishment =
      await uow.formEstablishmentRepository.getBySiret(dto.siret);

    if (existingFormEstablishment) {
      throw new ConflictError(
        `Establishment with siret ${dto.siret} already exists`,
      );
    }

    if (featureFlags.enableInseeApi) {
      await rejectsSiretIfNotAnOpenCompany(this.getSiret, dto.siret);
    }

    const event = this.createNewEvent({
      topic: "FormEstablishmentAdded",
      payload: dto,
      ...(featureFlags.enableInseeApi ? {} : { wasQuarantined: true }),
    });

    await Promise.all([
      uow.formEstablishmentRepository.create(dto),
      uow.outboxRepository.save(event),
    ]);

    return dto.siret;
  }
}
