import { SiretDto, siretSchema } from "../../../shared/siret";
import { createEstablishmentJwtPayload } from "../../../shared/tokens/MagicLinkPayload";
import { GenerateEditFormEstablishmentUrl } from "../../auth/jwt";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { Clock } from "../../core/ports/Clock";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { EmailGateway } from "../../immersionApplication/ports/EmailGateway";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";

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
    const contact =
      await uow.establishmentAggregateRepo.getContactForEstablishmentSiret(
        siret,
      );

    if (!contact) throw Error("Email du contact introuvable.");

    const now = this.clock.now();

    const payload = createEstablishmentJwtPayload({
      siret,
      now,
      durationDays: 2,
    });
    const editFrontUrl = this.generateEditFormEstablishmentUrl(payload);

    try {
      await this.emailGateway.sendFormEstablishmentEditionSuggestion(
        contact.email,
        contact.copyEmails,
        {
          editFrontUrl,
        },
      );

      const event = this.createNewEvent({
        topic: "FormEstablishmentEditLinkSent",
        payload,
      });
      await uow.outboxRepo.save(event);
    } catch (error) {
      notifyObjectDiscord(error);
    }
  }
}
