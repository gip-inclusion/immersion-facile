import { AgencyDto, CreateAgencyDto } from "shared/src/agency/agency.dto";
import { createAgencySchema } from "shared/src/agency/agency.schema";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export const defaultQuestionnaireUrl =
  "https://docs.google.com/document/d/1pjsCZbu0CarBCR0GVJ1AmIgwkxGIsD6T/edit";

export class AddAgency extends TransactionalUseCase<CreateAgencyDto, void> {
  inputSchema = createAgencySchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
    private defaultAdminEmail: string,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    params: CreateAgencyDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency: AgencyDto = {
      ...params,
      adminEmails: [this.defaultAdminEmail],
      status: "needsReview",
      questionnaireUrl: params.questionnaireUrl || defaultQuestionnaireUrl,
    };

    const newAgencyAddEvent = this.createNewEvent({
      topic: "NewAgencyAdded",
      payload: agency,
    });

    await Promise.all([
      uow.agencyRepo.insert(agency),
      uow.outboxRepo.save(newAgencyAddEvent),
    ]);
  }
}
