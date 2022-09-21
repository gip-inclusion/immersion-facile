import {
  ConventionDtoWithoutExternalId,
  ConventionStatus,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import { conventionWithoutExternalIdSchema } from "shared/src/convention/convention.schema";
import {
  ConflictError,
  ForbiddenError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { rejectsSiretIfNotAnOpenCompany } from "../../sirene/rejectsSiretIfNotAnOpenCompany";
import { GetSiretUseCase } from "../../sirene/useCases/GetSiret";

export class AddConvention extends TransactionalUseCase<
  ConventionDtoWithoutExternalId,
  WithConventionId
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
    private readonly getSiret: GetSiretUseCase,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionWithoutExternalIdSchema;

  public async _execute(
    createConventionParams: ConventionDtoWithoutExternalId,
    uow: UnitOfWork,
  ): Promise<WithConventionId> {
    const minimalValidStatus: ConventionStatus = "READY_TO_SIGN";

    if (
      createConventionParams.status != "DRAFT" &&
      createConventionParams.status != minimalValidStatus
    ) {
      throw new ForbiddenError();
    }

    const featureFlags = await uow.featureFlagRepository.getAll();
    if (featureFlags.enableInseeApi) {
      await rejectsSiretIfNotAnOpenCompany(
        this.getSiret,
        createConventionParams.siret,
      );
    }

    const externalId = await uow.conventionRepository.save(
      createConventionParams,
    );
    if (!externalId) throw new ConflictError(createConventionParams.id);

    const event = this.createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: { ...createConventionParams, externalId },
    });

    await uow.outboxRepository.save(event);

    return { id: createConventionParams.id };
  }
}
