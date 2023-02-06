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
            internshipKind: "immersion",
            beneficiaryFirstName: "Charlotte",
            beneficiaryLastName: "Grondin",
            businessName: "Boulangerie de la plage",
            rejectionReason:
              "Confond les pains au chocolat et les chocolatines...",
            signature: "agence signature",
            agency: "agence de Bretagne",
            immersionProfession: "Vendeur / Vendeur",
            agencyLogoUrl: "http://a",
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
            internshipKind: "immersion",
            beneficiaryFirstName: "Charlotte",
            beneficiaryLastName: "Grondin",
            establishmentTutorName: "Erika Grandjean",
            immersionAssessmentCreationLink: "http://immersion/dsndjedfdj",
            agencyLogoUrl: "http://a",
          },
        },
        sentAt: "2022-01-07T20:00:00.000",
        error: "Wrong template. Could not send",
      },
      {
        templatedEmail: {
          type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
          recipients: ["virgina.wolf@email.com", "helene.joyeux@email.com"],
          cc: ["erika.grandjean@immersion.fr"],
          params: {
            internshipKind: "immersion",
            demandeId: "55c4872f-9537-4e8e-8102-71bd9380a0f7",
            firstName: "fgfsdgsdfg",
            lastName: "fgdfgdf",
            dateStart: "2023-01-27",
            dateEnd: "2023-02-01",
            businessName: "OPHELIE RACZ",
            agencyName: "Agence Pôle emploi GAP",
            magicLink:
              "fdslkmfjsdflksjfsdlfhjsdfohjsdfdsfoihjcfwdkxcjfchsdkjbqsedkhj.dsfsdflkjhsfdlkjhfsdgkljhbsdkljhbsdkljbhsdfdffg/dsfjsdfhsdkjwghsdqk/sfsdsfhgfjfggdqederghhrteezsdrfsdfvdfghfghr?jwt=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJhcHBsaWNhdGlvbklkIjoiNTVjNDg3MmYtOTUzNy00ZThlLTgxMDItNzFiZDkzODBhMGY3Iiwicm9sZSI6InZhbGlkYXRvciIsImlhdCI6MTY3NDY0MjU4MiwiZXhwIjoxNjc3MzIwOTgyLCJlbWFpbEhhc2giOiIzM2E1ZGVlNzI3MjNkZWI0MmQyZWFjOGJhOGRiYWQ0YSJ9.nH7fhbr44kg9tKJfRNtmijaXLOCan6woip7LGjtMlVjx5YxViBkc-l_eTMnO8w90FV6vEUplJy8J3PT_guXwKQ",
            conventionStatusLink:
              "fdslkmfjsdflksjfsdlfhjsdfohjsdfdsfoihjcfwdkxcjfchsdkjbqsedkhj.dsfsdflkjhsfdlkjhfsdgkljhbsdkljhbsdkljbhsdfdffg/dsfjsdfhsdkjwghsdqk/sfsdsfhgfjfggdqederghhrteezsdrfsdfvdfghfghr?jwt=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJhcHBsaWNhdGlvbklkIjoiNTVjNDg3MmYtOTUzNy00ZThlLTgxMDItNzFiZDkzODBhMGY3Iiwicm9sZSI6InZhbGlkYXRvciIsImlhdCI6MTY3NDY0MjU4MiwiZXhwIjoxNjc3MzIwOTgyLCJlbWFpbEhhc2giOiIzM2E1ZGVlNzI3MjNkZWI0MmQyZWFjOGJhOGRiYWQ0YSJ9.nH7fhbr44kg9tKJfRNtmijaXLOCan6woip7LGjtMlVjx5YxViBkc-l_eTMnO8w90FV6vEUplJy8J3PT_guXwKQ",
            agencyLogoUrl: "http://a",
          },
        },
        sentAt: "2022-01-07T20:00:00.000",
      },
    ]);
  }
}
