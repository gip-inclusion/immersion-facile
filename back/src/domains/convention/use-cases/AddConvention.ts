import {
  type AddConventionInput,
  addConventionInputSchema,
  type ConventionStatus,
  errors,
  type WithConventionIdLegacy,
} from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { rejectsSiretIfNotAnOpenCompany } from "../../core/sirene/helpers/rejectsSiretIfNotAnOpenCompany";
import type { SiretGateway } from "../../core/sirene/ports/SiretGateway";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class AddConvention extends TransactionalUseCase<
  AddConventionInput,
  WithConventionIdLegacy
> {
  protected inputSchema = addConventionInputSchema;

  readonly #createNewEvent: CreateNewEvent;

  readonly #siretGateway: SiretGateway;

  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    siretGateway: SiretGateway,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#siretGateway = siretGateway;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    { convention, discussionId }: AddConventionInput,
    uow: UnitOfWork,
  ): Promise<WithConventionIdLegacy> {
    const minimalValidStatus: ConventionStatus = "READY_TO_SIGN";

    if (convention.status !== minimalValidStatus) {
      throw errors.convention.forbiddenStatus({
        status: convention.status,
      });
    }

    await rejectsSiretIfNotAnOpenCompany(this.#siretGateway, convention.siret);

    await uow.conventionRepository.save({
      conventionDto: convention,
      phoneIds: {
        beneficiary: await uow.phoneNumberRepository.getIdByPhoneNumber(
          convention.signatories.beneficiary.phone,
          this.#timeGateway.now(),
        ),
        establishmentRepresentative:
          await uow.phoneNumberRepository.getIdByPhoneNumber(
            convention.signatories.establishmentRepresentative.phone,
            this.#timeGateway.now(),
          ),
        establishmentTutor: await uow.phoneNumberRepository.getIdByPhoneNumber(
          convention.establishmentTutor.phone,
          this.#timeGateway.now(),
        ),
        beneficiaryRepresentative: convention.signatories
          .beneficiaryRepresentative
          ? await uow.phoneNumberRepository.getIdByPhoneNumber(
              convention.signatories.beneficiaryRepresentative.phone,
              this.#timeGateway.now(),
            )
          : undefined,
        beneficiaryCurrentEmployer: convention.signatories
          .beneficiaryCurrentEmployer
          ? await uow.phoneNumberRepository.getIdByPhoneNumber(
              convention.signatories.beneficiaryCurrentEmployer.phone,
              this.#timeGateway.now(),
            )
          : undefined,
      },
    });
    await uow.conventionExternalIdRepository.save(convention.id);

    const event = this.#createNewEvent({
      topic: "ConventionSubmittedByBeneficiary",
      payload: {
        convention,
        triggeredBy: null,
        ...(discussionId ? { discussionId } : {}),
      },
    });

    await uow.outboxRepository.save(event);

    return { id: convention.id };
  }
}
