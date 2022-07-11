import { SentEmailGateway } from "src/core-logic/ports/SentEmailGateway";
import { EmailSentDto } from "src/../../shared/email";
import { AdminToken } from "src/../../shared/src/admin/admin.dto";

export class InMemorySentEmailGateway implements SentEmailGateway {
  public async getLatest(_adminToken: AdminToken): Promise<EmailSentDto[]> {
    return [
      {
        template: {
          type: "REJECTED_CONVENTION_NOTIFICATION",
          recipients: ["tom.cruise@email.com"],
          cc: ["emilie.cooper@immersion.fr"],
          params: {
            beneficiaryFirstName: "Charlotte",
            beneficiaryLastName: "Grondin",
            businessName: "Boulangerie de la plage",
            rejectionReason:
              "Confond les pains au chocolat et les chocolatines...",
            signature: "agence signature",
            agency: "agence de Bretagne",
            immersionProfession: "Vendeur / Vendeur",
          },
        },
        sentAt: "2022-01-07T19:00:00.000",
      },
      {
        template: {
          type: "CREATE_IMMERSION_ASSESSMENT",
          recipients: ["virgina.wolf@email.com", "helene.joyeux@email.com"],
          cc: ["erika.grandjean@immersion.fr"],
          params: {
            beneficiaryFirstName: "Charlotte",
            beneficiaryLastName: "Grondin",
            mentorName: "Erika Grandjean",
            immersionAssessmentCreationLink: "http://immersion/dsndjedfdj",
          },
        },
        sentAt: "2022-01-07T20:00:00.000",
        error: "Wrong template. Could not send",
      },
    ];
  }
}
