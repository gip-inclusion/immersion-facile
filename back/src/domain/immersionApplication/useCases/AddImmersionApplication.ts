import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddImmersionApplicationResponseDto,
  ImmersionApplicationDto,
} from "../../../shared/ImmersionApplicationDto";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";

const logger = createLogger(__filename);

export class AddImmersionApplication
  implements
    UseCase<ImmersionApplicationDto, AddImmersionApplicationResponseDto>
{
  constructor(
    private readonly applicationRepository: ImmersionApplicationRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  public async execute(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<AddImmersionApplicationResponseDto> {
    const applicationEntity = ImmersionApplicationEntity.create(
      immersionApplicationDto,
    );
    const id = await this.applicationRepository.save(applicationEntity);
    if (!id) throw new ConflictError(applicationEntity.id);

    const event = this.createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplicationDto,
    });

    await this.outboxRepository.save(event);

    return { id };
  }
}
