import {
  ConflictError,
  ForbiddenError,
} from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddImmersionApplicationResponseDto,
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../../shared/ImmersionApplicationDto";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { rejectsSiretIfNotAnOpenCompany } from "../../sirene/rejectsSiretIfNotAnOpenCompany";
import { GetSiretUseCase } from "../../sirene/useCases/GetSiret";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";
import { FeatureFlags } from "../../../shared/featureFlags";

const logger = createLogger(__filename);

export class AddImmersionApplication extends UseCase<
  ImmersionApplicationDto,
  AddImmersionApplicationResponseDto
> {
  constructor(
    private readonly applicationRepository: ImmersionApplicationRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
    private readonly getSiret: GetSiretUseCase,
    private readonly featureFlags: FeatureFlags,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<AddImmersionApplicationResponseDto> {
    const minimalValidStatus = this.featureFlags.enableEnterpriseSignature
      ? "READY_TO_SIGN"
      : "IN_REVIEW";
    if (
      immersionApplicationDto.status != "DRAFT" &&
      immersionApplicationDto.status != minimalValidStatus
    ) {
      throw new ForbiddenError();
    }

    const applicationEntity = ImmersionApplicationEntity.create(
      immersionApplicationDto,
    );

    await rejectsSiretIfNotAnOpenCompany(
      this.getSiret,
      immersionApplicationDto.siret,
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
