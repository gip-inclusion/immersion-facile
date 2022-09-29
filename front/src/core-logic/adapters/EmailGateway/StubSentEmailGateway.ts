import { Observable, of } from "rxjs";
import { AdminToken, EmailSentDto } from "shared";

export class StubSentEmailGateway implements StubSentEmailGateway {
  public getLatest(_adminToken: AdminToken): Observable<EmailSentDto[]> {
    return of([
      {
        templatedEmail: {
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
        templatedEmail: {
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
    ]);
  }
}
