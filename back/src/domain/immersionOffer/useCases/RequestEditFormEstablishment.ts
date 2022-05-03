import { SiretDto, siretSchema } from "../../../shared/siret";
import { createEstablishmentJwtPayload } from "../../../shared/tokens/MagicLinkPayload";
import { GenerateEditFormEstablishmentUrl } from "../../auth/jwt";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { Clock } from "../../core/ports/Clock";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { EmailGateway } from "../../immersionApplication/ports/EmailGateway";
import { isAfter } from "date-fns";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";
import { ContactEntityV2 } from "../entities/ContactEntity";

export class RequestEditFormEstablishment extends TransactionalUseCase<SiretDto> {
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
    const contact: ContactEntityV2 | undefined =
      await uow.establishmentAggregateRepo.getContactForEstablishmentSiret(
        siret,
      );

    if (!contact) throw Error("Email du contact introuvable.");

    const now = this.clock.now();
    const lastPayload =
      await uow.outboxQueries.getLastPayloadOfFormEstablishmentEditLinkSentWithSiret(
        siret,
      );
    if (lastPayload) {
      const editLinkIsExpired = isAfter(new Date(lastPayload.exp), now);
      if (editLinkIsExpired) {
        const editLinkSentAt = new Date(lastPayload.iat);
        throw new BadRequestError(
          `Un email a déjà été envoyé au contact référent de l'établissement le ${editLinkSentAt.toLocaleDateString(
            "fr-FR",
          )}`,
        );
      }
    }

    const payload = createEstablishmentJwtPayload({
      siret,
      now,
      durationDays: 2,
    });

    const editFrontUrl = this.generateEditFormEstablishmentUrl(payload);

    try {
      await this.emailGateway.sendRequestedEditFormEstablishmentLink(
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
