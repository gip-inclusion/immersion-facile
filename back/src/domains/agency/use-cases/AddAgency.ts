import {
  AgencyDto,
  AgencyId,
  CreateAgencyDto,
  Email,
  createAgencySchema,
  invalidAgencySiretMessage,
} from "shared";
import { NotFoundError } from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { SiretGateway } from "../../core/sirene/ports/SirenGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwConflictErrorOnSimilarAgencyFound } from "../entities/Agency";
import { referedAgencyMissingMessage } from "../ports/AgencyRepository";

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
      throw new NotFoundError(invalidAgencySiretMessage);

    await Promise.all([
      uow.agencyRepository.insert(agency),
      uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "NewAgencyAdded",
          payload: { agency, triggeredBy: null },
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
      throw new NotFoundError(referedAgencyMissingMessage(refersToAgencyId));
    return referedAgency.validatorEmails;
  }
}
