import { SiretDto, siretSchema } from "../../../shared/siret";
import { EditFormEstablishementPayload } from "../../../shared/tokens/MagicLinkPayload";
import { GenerateEditFormEstablishmentUrl } from "../../auth/jwt";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { Clock } from "../../core/ports/Clock";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { EmailGateway } from "../../immersionApplication/ports/EmailGateway";
import { addHours, isAfter } from "date-fns";

export class RequestEditFormEstablishment extends TransactionalUseCase<
  SiretDto,
  void
> {
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
    const contactEmail = await uow.immersionOfferRepo.getContactEmailFromSiret(
      siret,
    );

    if (!contactEmail) throw Error("Email du contact introuvable.");

    const now = this.clock.now();
    const lastPayload =
      await uow.outboxRepo.getLastPayloadOfFormEstablishmentEditLinkSentWithSiret(
        siret,
      );
    if (lastPayload) {
      const editLinkIsExpired = isAfter(new Date(lastPayload.expiredAt), now);
      if (editLinkIsExpired) {
        const editLinkSentAt = new Date(lastPayload.issuedAt);
        throw Error(
          `Un email a déjà été envoyé au contact référent de l'établissement le ${editLinkSentAt.toLocaleDateString(
            "fr-FR",
          )}`,
        );
      }
    }

    const expDate = addHours(now, 24);

    const payload: EditFormEstablishementPayload = {
      siret,
      issuedAt: now.getTime(),
      expiredAt: expDate.getTime(),
    };
    const editFrontUrl = this.generateEditFormEstablishmentUrl(payload);

    try {
      this.emailGateway.sendEditFormEstablishmentLink(contactEmail, {
        editFrontUrl,
      });

      const event = this.createNewEvent({
        topic: "FormEstablishmentEditLinkSent",
        payload,
      });
      await uow.outboxRepo.save(event);
    } catch (error) {}
  }
}
