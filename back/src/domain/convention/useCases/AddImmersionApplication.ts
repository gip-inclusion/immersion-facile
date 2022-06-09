import {
  ConflictError,
  ForbiddenError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { rejectsSiretIfNotAnOpenCompany } from "../../sirene/rejectsSiretIfNotAnOpenCompany";
import { GetSiretUseCase } from "../../sirene/useCases/GetSiret";
import {
  ConventionStatus,
  ConventionDto,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";

export class AddImmersionApplication extends TransactionalUseCase<
  ConventionDto,
  WithConventionId
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
    private readonly getSiret: GetSiretUseCase,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionSchema;

  public async _execute(
    conventionDto: ConventionDto,
    uow: UnitOfWork,
  ): Promise<WithConventionId> {
    const minimalValidStatus: ConventionStatus = "READY_TO_SIGN";

    if (
      conventionDto.status != "DRAFT" &&
      conventionDto.status != minimalValidStatus
    ) {
      throw new ForbiddenError();
    }

    const featureFlags = await uow.getFeatureFlags();
    if (featureFlags.enableInseeApi) {
      await rejectsSiretIfNotAnOpenCompany(this.getSiret, conventionDto.siret);
    }

    const id = await uow.conventionRepository.save(conventionDto);

    if (!id) throw new ConflictError(conventionDto.id);

    const event = this.createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: conventionDto,
    });
    await uow.outboxRepo.save(event);

    return { id };
  }
}
