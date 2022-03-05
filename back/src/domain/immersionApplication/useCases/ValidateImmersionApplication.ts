import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import {
  ImmersionApplicationId,
  immersionApplicationIdSchema,
  WithImmersionApplicationId,
} from "../../../shared/ImmersionApplicationDto";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";

const logger = createLogger(__filename);

export class ValidateImmersionApplication extends UseCase<
  ImmersionApplicationId,
  WithImmersionApplicationId
> {
  constructor(
    private readonly immersionApplicationRepository: ImmersionApplicationRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {
    super();
  }

  inputSchema = immersionApplicationIdSchema;

  public async _execute(
    id: ImmersionApplicationId,
  ): Promise<WithImmersionApplicationId> {
    const immersionApplicationEntity =
      await this.immersionApplicationRepository.getById(id);
    if (!immersionApplicationEntity) throw new NotFoundError(id);

    if (immersionApplicationEntity.toDto().status !== "IN_REVIEW")
      throw new BadRequestError(id);

    const validatedEntity = ImmersionApplicationEntity.create({
      ...immersionApplicationEntity.toDto(),
      status: "VALIDATED",
    });

    const updatedId =
      await this.immersionApplicationRepository.updateImmersionApplication(
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
