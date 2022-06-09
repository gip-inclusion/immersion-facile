import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import {
  ConventionDto,
  ConventionId,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
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
    const convention = await this.conventionRepository.getById(id);
    if (!convention) throw new NotFoundError(id);

    if (convention.status !== "IN_REVIEW") throw new BadRequestError(id);

    const validatedConvention: ConventionDto = {
      ...convention,
      status: "VALIDATED",
    };

    const updatedId = await this.conventionRepository.update(
      validatedConvention,
    );
    if (!updatedId) throw new NotFoundError(updatedId);

    const event = this.createNewEvent({
      topic: "FinalImmersionApplicationValidationByAdmin",
      payload: validatedConvention,
    });

    await this.outboxRepository.save(event);

    return { id: updatedId };
  }
}
