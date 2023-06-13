import {
  ConventionDtoWithoutExternalId,
  ConventionStatus,
  conventionWithoutExternalIdSchema,
  WithConventionId,
} from "shared";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SiretGateway } from "../../sirene/ports/SirenGateway";
import { rejectsSiretIfNotAnOpenCompany } from "../../sirene/rejectsSiretIfNotAnOpenCompany";

export class AddConvention extends TransactionalUseCase<
  ConventionDtoWithoutExternalId,
  WithConventionId
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
    private readonly siretGateway: SiretGateway,
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
        this.siretGateway,
        createConventionParams.siret,
      );
    }

    const externalId = await uow.conventionRepository.save(
      createConventionParams,
    );

    const event = this.createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: { ...createConventionParams, externalId },
    });

    await uow.outboxRepository.save(event);

    return { id: createConventionParams.id };
  }
}
