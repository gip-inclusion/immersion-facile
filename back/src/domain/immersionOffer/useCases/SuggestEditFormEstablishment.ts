import { SiretDto, siretSchema } from "shared";
import { createEstablishmentMagicLinkPayload } from "shared";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { GenerateEditFormEstablishmentUrl } from "../../auth/jwt";
import { EmailGateway } from "../../convention/ports/EmailGateway";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { Clock } from "../../core/ports/Clock";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class SuggestEditFormEstablishment extends TransactionalUseCase<SiretDto> {
  inputSchema = siretSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private emailGateway: EmailGateway,
    private clock: Clock,
    private generateEditFormEstablishmentUrl: GenerateEditFormEstablishmentUrl,
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

    const now = this.clock.now();

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
