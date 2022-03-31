import {
  ConflictError,
  ForbiddenError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { rejectsSiretIfNotAnOpenCompany } from "../../sirene/rejectsSiretIfNotAnOpenCompany";
import { GetSiretUseCase } from "../../sirene/useCases/GetSiret";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
  WithImmersionApplicationId,
} from "../../../shared/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "../../../shared/ImmersionApplication/immersionApplication.schema";

export class AddImmersionApplication extends TransactionalUseCase<
  ImmersionApplicationDto,
  WithImmersionApplicationId
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
    private readonly getSiret: GetSiretUseCase,
  ) {
    super(uowPerformer);
  }

  inputSchema = immersionApplicationSchema;

  public async _execute(
    immersionApplicationDto: ImmersionApplicationDto,
    uow: UnitOfWork,
  ): Promise<WithImmersionApplicationId> {
    const minimalValidStatus: ApplicationStatus = "READY_TO_SIGN";

    if (
      immersionApplicationDto.status != "DRAFT" &&
      immersionApplicationDto.status != minimalValidStatus
    ) {
      throw new ForbiddenError();
    }

    const applicationEntity = ImmersionApplicationEntity.create(
      immersionApplicationDto,
    );

    const featureFlags = await uow.getFeatureFlags();
    if (featureFlags.enableInseeApi) {
      await rejectsSiretIfNotAnOpenCompany(
        this.getSiret,
        immersionApplicationDto.siret,
      );
    }

    const id = await uow.immersionApplicationRepo.save(applicationEntity);
    if (!id) throw new ConflictError(applicationEntity.id);

    const event = this.createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplicationDto,
    });

    await uow.outboxRepo.save(event);

    return { id };
  }
}
