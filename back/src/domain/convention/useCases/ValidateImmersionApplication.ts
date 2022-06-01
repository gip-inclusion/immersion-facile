import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import {
  ConventionId,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { ConventionEntity } from "../entities/ConventionEntity";
import { ConventionRepository } from "../ports/ConventionRepository";
import { conventionIdSchema } from "shared/src/convention/convention.schema";

export class ValidateImmersionApplication extends UseCase<
  ConventionId,
  WithConventionId
> {
  constructor(
    private readonly conventionRepository: ConventionRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {
    super();
  }

  inputSchema = conventionIdSchema;

  public async _execute(id: ConventionId): Promise<WithConventionId> {
    const conventionEntity = await this.conventionRepository.getById(id);
    if (!conventionEntity) throw new NotFoundError(id);

    if (conventionEntity.toDto().status !== "IN_REVIEW")
      throw new BadRequestError(id);

    const validatedEntity = ConventionEntity.create({
      ...conventionEntity.toDto(),
      status: "VALIDATED",
    });

    const updatedId = await this.conventionRepository.update(validatedEntity);
    if (!updatedId) throw new NotFoundError(updatedId);

    const event = this.createNewEvent({
      topic: "FinalImmersionApplicationValidationByAdmin",
      payload: validatedEntity.toDto(),
    });

    await this.outboxRepository.save(event);

    return { id: updatedId };
  }
}
