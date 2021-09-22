import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  DemandeImmersionId,
  ValidateDemandeImmersionRequestDto,
  ValidateDemandeImmersionResponseDto,
} from "../../../shared/DemandeImmersionDto";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { logger } from "../../../utils/logger";

export class ValidateDemandeImmersion
  implements
    UseCase<
      ValidateDemandeImmersionRequestDto,
      ValidateDemandeImmersionResponseDto
    >
{
  private readonly logger = logger.child({
    logsource: "ValidateDemandeImmersion",
  });

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
