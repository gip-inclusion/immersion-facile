import {
  createEstablishmentMagicLinkPayload,
  SiretDto,
  siretSchema,
} from "shared";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { GenerateEditFormEstablishmentJwt } from "../../auth/jwt";
import { EmailGateway } from "../../convention/ports/EmailGateway";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class SuggestEditFormEstablishment extends TransactionalUseCase<SiretDto> {
  inputSchema = siretSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private emailGateway: EmailGateway,
    private timeGateway: TimeGateway,
    private generateEditFormEstablishmentUrl: GenerateEditFormEstablishmentJwt,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  protected async _execute(siret: SiretDto, uow: UnitOfWork) {
    const contact = (
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        siret,
      )
    )?.contact;

    if (!contact) throw Error("Email du contact introuvable.");

    const now = this.timeGateway.now();

    const payload = createEstablishmentMagicLinkPayload({
      siret,
      now,
      durationDays: 2,
    });
    const editFrontUrl = this.generateEditFormEstablishmentUrl(payload);

    try {
      await this.emailGateway.sendEmail({
        type: "SUGGEST_EDIT_FORM_ESTABLISHMENT",
        recipients: [contact.email],
        cc: contact.copyEmails,
        params: {
          editFrontUrl,
        },
      });

      const event = this.createNewEvent({
        topic: "FormEstablishmentEditLinkSent",
        payload,
      });
      await uow.outboxRepository.save(event);
    } catch (error) {
      notifyObjectDiscord(error);
    }
  }
}
