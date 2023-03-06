import { isAfter } from "date-fns";
import {
  createEstablishmentMagicLinkPayload,
  SiretDto,
  siretSchema,
} from "shared";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { GenerateEditFormEstablishmentJwt } from "../../auth/jwt";
import { EmailGateway } from "../../convention/ports/EmailGateway";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class RequestEditFormEstablishment extends TransactionalUseCase<SiretDto> {
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

    const payload = createEstablishmentMagicLinkPayload({
      siret,
      now,
      durationDays: 1,
    });

    const editFrontUrl = this.generateEditFormEstablishmentUrl(payload);

    await this.emailGateway.sendEmail({
      type: "EDIT_FORM_ESTABLISHMENT_LINK",
      recipients: [contact.email],
      cc: contact.copyEmails,
      params: { editFrontUrl },
    });

    const event = this.createNewEvent({
      topic: "FormEstablishmentEditLinkSent",
      payload,
    });

    await uow.outboxRepository.save(event);
  }
}
