import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  DemandeImmersionId,
  ValidateDemandeImmersionRequestDto,
  ValidateDemandeImmersionResponseDto,
} from "../../../shared/DemandeImmersionDto";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";

const logger = createLogger(__filename);

export class ValidateDemandeImmersion
  implements
    UseCase<
      ValidateDemandeImmersionRequestDto,
      ValidateDemandeImmersionResponseDto
    >
{
  constructor(
    private readonly demandeImmersionRepository: DemandeImmersionRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  public async execute(
    id: DemandeImmersionId,
  ): Promise<ValidateDemandeImmersionResponseDto> {
    const demandeImmersionEntity =
      await this.demandeImmersionRepository.getById(id);
    if (!demandeImmersionEntity) throw new NotFoundError(id);

    if (demandeImmersionEntity.toDto().status !== "IN_REVIEW")
      throw new BadRequestError(id);

    const validatedEntity = DemandeImmersionEntity.create({
      ...demandeImmersionEntity.toDto(),
      status: "VALIDATED",
    });

    const updatedId =
      await this.demandeImmersionRepository.updateDemandeImmersion(
        validatedEntity,
      );
    if (!updatedId) throw new NotFoundError(updatedId);

    const event = this.createNewEvent({
      topic: "FinalImmersionApplicationValidationByAdmin",
      payload: validatedEntity.toDto(),
    });

    await this.outboxRepository.save(event);

    return { id: updatedId };
  }
}
