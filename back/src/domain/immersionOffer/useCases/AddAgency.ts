import {
  AgencyConfig,
  CreateAgencyConfig,
} from "../../../shared/agency/agency.dto";
import { agencyConfigSchema } from "../../../shared/agency/agency.schema";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export const defaultQuestionnaireUrl =
  "https://docs.google.com/document/d/1pjsCZbu0CarBCR0GVJ1AmIgwkxGIsD6T/edit";

export class AddAgency extends TransactionalUseCase<CreateAgencyConfig, void> {
  inputSchema = agencyConfigSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
    private defaultAdminEmail: string,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    params: CreateAgencyConfig,
    uow: UnitOfWork,
  ): Promise<void> {
    const agencyConfig: AgencyConfig = {
      ...params,
      adminEmails: [this.defaultAdminEmail],
      status: "needsReview",
      questionnaireUrl: params.questionnaireUrl || defaultQuestionnaireUrl,
    };

    const newAgencyAddEvent = this.createNewEvent({
      topic: "NewAgencyAdded",
      payload: agencyConfig,
    });

    await Promise.all([
      uow.agencyRepo.insert(agencyConfig),
      uow.outboxRepo.save(newAgencyAddEvent),
    ]);
  }
}
