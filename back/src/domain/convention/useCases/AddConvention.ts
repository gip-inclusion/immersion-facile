import {
  ConventionDto,
  conventionSchema,
  ConventionStatus,
  WithConventionIdLegacy,
} from "shared";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { SiretGateway } from "../../sirene/ports/SirenGateway";
import { rejectsSiretIfNotAnOpenCompany } from "../../sirene/rejectsSiretIfNotAnOpenCompany";

export class AddConvention extends TransactionalUseCase<
  ConventionDto,
  WithConventionIdLegacy
> {
  protected inputSchema = conventionSchema;

  readonly #createNewEvent: CreateNewEvent;

  readonly #siretGateway: SiretGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    siretGateway: SiretGateway,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#siretGateway = siretGateway;
  }

  protected async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<WithConventionIdLegacy> {
    const minimalValidStatus: ConventionStatus = "READY_TO_SIGN";

    if (
      convention.status != "DRAFT" &&
      convention.status != minimalValidStatus
    ) {
      throw new ForbiddenError();
    }

    const featureFlags = await uow.featureFlagRepository.getAll();
    if (featureFlags.enableInseeApi.isActive) {
      await rejectsSiretIfNotAnOpenCompany(
        this.#siretGateway,
        convention.siret,
      );
    }

    await uow.conventionRepository.save(convention);
    await uow.conventionExternalIdRepository.save(convention.id);

    const event = this.#createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: convention,
    });

    await uow.outboxRepository.save(event);

    return { id: convention.id };
  }
}
