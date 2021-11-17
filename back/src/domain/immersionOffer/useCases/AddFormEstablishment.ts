import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddFormEstablishmentResponseDto,
  FormEstablishmentDto,
  formEstablishmentSchema,
} from "../../../shared/FormEstablishmentDto";
import { createLogger } from "../../../utils/logger";
import { UseCase } from "../../core/UseCase";
import { FormEstablishmentRepository } from "../ports/FormEstablishmentRepository";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { CreateNewEvent } from "../../core/eventBus/EventBus";

const logger = createLogger(__filename);

export class AddFormEstablishment extends UseCase<
  FormEstablishmentDto,
  AddFormEstablishmentResponseDto
> {
  constructor(
    private readonly formEstablishmentRepository: FormEstablishmentRepository,
    private createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {
    super();
  }

  inputSchema = formEstablishmentSchema;

  public async _execute(
    dto: FormEstablishmentDto,
  ): Promise<AddFormEstablishmentResponseDto> {
    const id = await this.formEstablishmentRepository.save(dto);
    if (!id) throw new ConflictError("empty");

    const event = this.createNewEvent({
      topic: "FormEstablishmentAdded",
      payload: dto,
    });

    await this.outboxRepository.save(event);
    return id;
  }
}
