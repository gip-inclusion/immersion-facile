import {
  ConventionDtoWithoutExternalId,
  ConventionStatus,
  conventionWithoutExternalIdSchema,
  WithConventionIdLegacy,
} from "shared";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SiretGateway } from "../../sirene/ports/SirenGateway";
import { rejectsSiretIfNotAnOpenCompany } from "../../sirene/rejectsSiretIfNotAnOpenCompany";

export class AddConvention extends TransactionalUseCase<
  ConventionDtoWithoutExternalId,
  WithConventionIdLegacy
> {
  inputSchema = conventionWithoutExternalIdSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
    private readonly siretGateway: SiretGateway,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    createConventionParams: ConventionDtoWithoutExternalId,
    uow: UnitOfWork,
  ): Promise<WithConventionIdLegacy> {
    const minimalValidStatus: ConventionStatus = "READY_TO_SIGN";

    if (
      createConventionParams.status != "DRAFT" &&
      createConventionParams.status != minimalValidStatus
    ) {
      throw new ForbiddenError();
    }

    const featureFlags = await uow.featureFlagRepository.getAll();
    if (featureFlags.enableInseeApi.isActive) {
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
