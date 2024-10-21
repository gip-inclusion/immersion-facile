import {
  AgencyDto,
  AgencyId,
  CreateAgencyDto,
  Email,
  createAgencySchema,
  errors,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { SiretGateway } from "../../core/sirene/ports/SirenGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwConflictErrorOnSimilarAgencyFound } from "../entities/Agency";

export class AddAgency extends TransactionalUseCase<CreateAgencyDto, void> {
  protected inputSchema = createAgencySchema;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    private siretGateway: SiretGateway,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
  }

  protected async _execute(
    params: CreateAgencyDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency: AgencyDto = {
      ...params,
      validatorEmails: params.refersToAgencyId
        ? await this.#getReferedAgencyValidatorEmails(
            uow,
            params.refersToAgencyId,
          )
        : params.validatorEmails,
      status: "needsReview",
      questionnaireUrl: params.questionnaireUrl,
      codeSafir: null,
      rejectionJustification: null,
    };

    await throwConflictErrorOnSimilarAgencyFound({ uow, agency });

    const siretEstablishmentDto =
      agency.agencySiret &&
      (await this.siretGateway.getEstablishmentBySiret(agency.agencySiret));

    if (!siretEstablishmentDto)
      throw errors.agency.invalidSiret({ siret: agency.agencySiret });

    await Promise.all([
      uow.agencyRepository.insert(agency),
      uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "NewAgencyAdded",
          payload: { agencyId: agency.id, triggeredBy: null },
        }),
      ),
    ]);
  }

  async #getReferedAgencyValidatorEmails(
    uow: UnitOfWork,
    refersToAgencyId: AgencyId,
  ): Promise<Email[]> {
    const referedAgency = await uow.agencyRepository.getById(refersToAgencyId);
    if (!referedAgency)
      throw errors.agency.notFound({ agencyId: refersToAgencyId });
    return referedAgency.validatorEmails;
  }
}
