import {
  FormEstablishmentDto,
  formEstablishmentSchema,
} from "../../../shared/FormEstablishmentDto";
import { SiretDto } from "../../../shared/siret";
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
    const featureFlags = await uow.getFeatureFlags();

    if (!featureFlags.enableByPassInseeApi) {
      await rejectsSiretIfNotAnOpenCompany(this.getSiret, dto.siret);
    }

    await uow.formEstablishmentRepo.create(dto);

    const event = this.createNewEvent({
      topic: "FormEstablishmentAdded",
      payload: dto,
      ...(featureFlags.enableByPassInseeApi ? { wasQuarantined: true } : {}),
    });

    await uow.outboxRepo.save(event);
    return dto.siret;
  }
}
