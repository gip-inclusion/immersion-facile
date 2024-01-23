import {
  AgencyDto,
  AgencyId,
  CreateAgencyDto,
  createAgencySchema,
  Email,
  invalidAgencySiretMessage,
} from "shared";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../../core/eventBus/EventBus";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SiretGateway } from "../../../sirene/ports/SirenGateway";
import { throwConflictErrorOnSimilarAgencyFound } from "../../entities/Agency";
import { referedAgencyMissingMessage } from "../../ports/AgencyRepository";

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
      adminEmails: [],
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
          payload: { agency },
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
