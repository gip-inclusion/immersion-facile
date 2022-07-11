import { EmailSentDto } from "shared/email";
import { EmailGateway } from "../../../domain/convention/ports/EmailGateway";
import { InMemoryEmailGateway } from "./InMemoryEmailGateway";
import { SendinblueEmailGateway } from "./SendinblueEmailGateway";

export class HybridEmailGateway implements EmailGateway {
  constructor(
    private sendinblue: SendinblueEmailGateway,
    private inMemory: InMemoryEmailGateway,
  ) {}

  getLastSentEmailDtos(): EmailSentDto[] {
    return this.inMemory.getLastSentEmailDtos();
  }

  sendAgencyWasActivated(...params: [any, any, any?]) {
    return this.callBothImplementations("sendAgencyWasActivated", ...params);
  }

  sendBeneficiarySignatureRequestNotification(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendBeneficiarySignatureRequestNotification",
      ...params,
    );
  }

  sendContactByEmailRequest(...params: [any, any, any?]) {
    return this.callBothImplementations("sendContactByEmailRequest", ...params);
  }

  sendContactByPhoneInstructions(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendContactByPhoneInstructions",
      ...params,
    );
  }

  sendContactInPersonInstructions(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendContactInPersonInstructions",
      ...params,
    );
  }

  sendConventionModificationRequestNotification(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendConventionModificationRequestNotification",
      ...params,
    );
  }

  sendEnterpriseSignatureRequestNotification(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendEnterpriseSignatureRequestNotification",
      ...params,
    );
  }

  sendFormEstablishmentEditionSuggestion(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendFormEstablishmentEditionSuggestion",
      ...params,
    );
  }

  sendImmersionAssessmentCreationLink(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendImmersionAssessmentCreationLink",
      ...params,
    );
  }

  sendNewConventionAdminNotification(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendImmersionAssessmentCreationLink",
      ...params,
    );
  }

  sendNewConventionAgencyNotification(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendNewConventionAgencyNotification",
      ...params,
    );
  }

  sendNewConventionBeneficiaryConfirmation(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendNewConventionBeneficiaryConfirmation",
      ...params,
    );
  }

  sendNewConventionForReviewNotification(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendNewConventionForReviewNotification",
      ...params,
    );
  }

  sendNewConventionMentorConfirmation(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendNewConventionMentorConfirmation",
      ...params,
    );
  }

  sendNewEstablishmentContactConfirmation(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendNewEstablishmentContactConfirmation",
      ...params,
    );
  }

  sendRejectedConventionNotification(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendRejectedConventionNotification",
      ...params,
    );
  }

  sendRenewedMagicLink(...params: [any, any, any?]) {
    return this.callBothImplementations("sendRenewedMagicLink", ...params);
  }

  sendRequestedEditFormEstablishmentLink(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendRequestedEditFormEstablishmentLink",
      ...params,
    );
  }

  sendShareDraftConventionByLink(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendShareDraftConventionByLink",
      ...params,
    );
  }

  sendSignedByOtherPartyNotification(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendSignedByOtherPartyNotification",
      ...params,
    );
  }

  sendToPoleEmploiAdvisorOnConventionAssociation(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendToPoleEmploiAdvisorOnConventionAssociation",
      ...params,
    );
  }

  sendToPoleEmploiAdvisorOnConventionFullySigned(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendToPoleEmploiAdvisorOnConventionFullySigned",
      ...params,
    );
  }

  sendValidatedConventionFinalConfirmation(...params: [any, any, any?]) {
    return this.callBothImplementations(
      "sendValidatedConventionFinalConfirmation",
      ...params,
    );
  }

  private async callBothImplementations(
    method: keyof EmailGateway,
    ...params: [any, any, any?]
  ) {
    await Promise.all([
      this.inMemory[method](...params),
      this.sendinblue[method](...params),
    ]);
  }
}
