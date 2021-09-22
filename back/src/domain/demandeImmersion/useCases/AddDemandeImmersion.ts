import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddDemandeImmersionResponseDto,
  DemandeImmersionDto,
} from "../../../shared/DemandeImmersionDto";
import { logger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";

export class AddDemandeImmersion
  implements UseCase<DemandeImmersionDto, AddDemandeImmersionResponseDto>
{
  private readonly logger = logger.child({ logsource: "AddDemandeImmersion" });

  constructor(
    private readonly applicationRepository: DemandeImmersionRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  public async execute(
    demandeImmersionDto: DemandeImmersionDto,
  ): Promise<AddDemandeImmersionResponseDto> {
    const applicationEntity =
      DemandeImmersionEntity.create(demandeImmersionDto);
    const id = await this.applicationRepository.save(applicationEntity);
    if (!id) throw new ConflictError(applicationEntity.id);

    const event = this.createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: demandeImmersionDto,
    });

    await this.outboxRepository.save(event);

    return { id };
  }
}
