import { EmailSentDto } from "shared/email";
import { EmailGateway } from "../../../domain/convention/ports/EmailGateway";
import { InMemoryEmailGateway } from "./InMemoryEmailGateway";
import { SendinblueEmailGateway } from "./SendinblueEmailGateway";

type ParamsToPass = [any, any, any?];

export class HybridEmailGateway implements EmailGateway {
  constructor(
    private sendinblue: SendinblueEmailGateway,
    private inMemory: InMemoryEmailGateway,
  ) {}

  getLastSentEmailDtos(): EmailSentDto[] {
    return this.inMemory.getLastSentEmailDtos();
  }

  sendAgencyWasActivated(...params: ParamsToPass) {
    return this.callBothImplementations("sendAgencyWasActivated", ...params);
  }

  sendBeneficiarySignatureRequestNotification(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendBeneficiarySignatureRequestNotification",
      ...params,
    );
  }

  sendContactByEmailRequest(...params: ParamsToPass) {
    return this.callBothImplementations("sendContactByEmailRequest", ...params);
  }

  sendContactByPhoneInstructions(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendContactByPhoneInstructions",
      ...params,
    );
  }

  sendContactInPersonInstructions(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendContactInPersonInstructions",
      ...params,
    );
  }

  sendConventionModificationRequestNotification(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendConventionModificationRequestNotification",
      ...params,
    );
  }

  sendEnterpriseSignatureRequestNotification(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendEnterpriseSignatureRequestNotification",
      ...params,
    );
  }

  sendFormEstablishmentEditionSuggestion(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendFormEstablishmentEditionSuggestion",
      ...params,
    );
  }

  sendImmersionAssessmentCreationLink(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendImmersionAssessmentCreationLink",
      ...params,
    );
  }

  sendNewConventionAdminNotification(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendImmersionAssessmentCreationLink",
      ...params,
    );
  }

  sendNewConventionAgencyNotification(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendNewConventionAgencyNotification",
      ...params,
    );
  }

  sendNewConventionBeneficiaryConfirmation(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendNewConventionBeneficiaryConfirmation",
      ...params,
    );
  }

  sendNewConventionForReviewNotification(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendNewConventionForReviewNotification",
      ...params,
    );
  }

  sendNewConventionMentorConfirmation(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendNewConventionMentorConfirmation",
      ...params,
    );
  }

  sendNewEstablishmentContactConfirmation(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendNewEstablishmentContactConfirmation",
      ...params,
    );
  }

  sendRejectedConventionNotification(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendRejectedConventionNotification",
      ...params,
    );
  }

  sendRenewedMagicLink(...params: ParamsToPass) {
    return this.callBothImplementations("sendRenewedMagicLink", ...params);
  }

  sendRequestedEditFormEstablishmentLink(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendRequestedEditFormEstablishmentLink",
      ...params,
    );
  }

  sendShareDraftConventionByLink(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendShareDraftConventionByLink",
      ...params,
    );
  }

  sendSignedByOtherPartyNotification(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendSignedByOtherPartyNotification",
      ...params,
    );
  }

  sendToPoleEmploiAdvisorOnConventionAssociation(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendToPoleEmploiAdvisorOnConventionAssociation",
      ...params,
    );
  }

  sendToPoleEmploiAdvisorOnConventionFullySigned(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendToPoleEmploiAdvisorOnConventionFullySigned",
      ...params,
    );
  }

  sendValidatedConventionFinalConfirmation(...params: ParamsToPass) {
    return this.callBothImplementations(
      "sendValidatedConventionFinalConfirmation",
      ...params,
    );
  }

  private async callBothImplementations(
    method: keyof EmailGateway,
    ...params: ParamsToPass
  ) {
    await Promise.all([
      this.inMemory[method](...params),
      this.sendinblue[method](...params),
    ]);
  }
}
