import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  ImmersionApplicationId,
  ValidateImmersionApplicationRequestDto,
  ValidateImmersionApplicationResponseDto,
} from "../../../shared/ImmersionApplicationDto";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";

const logger = createLogger(__filename);

export class ValidateImmersionApplication
  implements
    UseCase<
      ValidateImmersionApplicationRequestDto,
      ValidateImmersionApplicationResponseDto
    >
{
  constructor(
    private readonly demandeImmersionRepository: ImmersionApplicationRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  public async execute(
    id: ImmersionApplicationId,
  ): Promise<ValidateImmersionApplicationResponseDto> {
    const demandeImmersionEntity =
      await this.demandeImmersionRepository.getById(id);
    if (!demandeImmersionEntity) throw new NotFoundError(id);

    if (demandeImmersionEntity.toDto().status !== "IN_REVIEW")
      throw new BadRequestError(id);

    const validatedEntity = ImmersionApplicationEntity.create({
      ...demandeImmersionEntity.toDto(),
      status: "VALIDATED",
    });

    const updatedId =
      await this.demandeImmersionRepository.updateImmersionApplication(
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
