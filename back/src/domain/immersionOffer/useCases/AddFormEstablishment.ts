import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddFormEstablishmentResponseDto,
  FormEstablishmentDto,
  formEstablishmentSchema,
} from "../../../shared/FormEstablishmentDto";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { rejectsSiretIfNotAnOpenCompany } from "../../sirene/rejectsSiretIfNotAnOpenCompany";
import { GetSiretUseCase } from "../../sirene/useCases/GetSiret";

const logger = createLogger(__filename);

export class AddFormEstablishment extends TransactionalUseCase<
  FormEstablishmentDto,
  AddFormEstablishmentResponseDto
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
  ): Promise<AddFormEstablishmentResponseDto> {
    await rejectsSiretIfNotAnOpenCompany(this.getSiret, dto.siret);

    const id = await uow.formEstablishmentRepo.save(dto);
    if (!id) throw new ConflictError("empty");

    const event = this.createNewEvent({
      topic: "FormEstablishmentAdded",
      payload: dto,
    });

    await uow.outboxRepo.save(event);
    return id;
  }
}
