import { createFetchSharedClient } from "shared-routes/fetch";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { crispRoutes } from "./crispRoutes";
import { HttpCrispGateway } from "./HttpCrispGateway";

describe("HttpCrispGateway", () => {
  const config = AppConfig.createFromEnv();
  let crispApi: HttpCrispGateway;
  const johnDoeEmail = "john.doe@gmail.com";
  const conventionFromTally = "123-conv-id-123";

  beforeEach(() => {
    const httpClient = createFetchSharedClient(crispRoutes, fetch);
    crispApi = new HttpCrispGateway(httpClient, config.crispConfig);
  });

  describe("initiate conversation", () => {
    it("should initiate a conversation", async () => {
      await crispApi.initiateConversation({
        message: "Test tech IF - vous inquiétez pas au support 😉",
        metadata: {
          email: johnDoeEmail,
          segments: [
            "email",
            "entreprise",
            "suppression-entreprise",
            "immersion",
          ],
        },
        helperNote: `Liens magiques (de la personne écrivant au support):
https://metabase.immersion-facile.beta.gouv.fr/dashboard/102?filtrer_par_email=${johnDoeEmail}

-----------
Convention ID: ${conventionFromTally}
Type de convention: immersion

Pilotage admin:
https://immersion-facile.beta.gouv.fr/admin/conventions/${conventionFromTally}

Liste de conventions:
https://metabase.immersion-facile.beta.gouv.fr/dashboard/5?id_de_convention=${conventionFromTally}

Liens magiques de cette convention:
https://metabase.immersion-facile.beta.gouv.fr/dashboard/102?filtrer_par_numero_de_convention=${conventionFromTally}

-----------
Retrouver la convention par Email de bénéficiaire:
https://metabase.immersion-facile.beta.gouv.fr/dashboard/5?email_b%25C3%25A9n%25C3%25A9ficiaire=${johnDoeEmail}
`,
      });

      // should not throw, go check for this message in CRISP
    });
  });
});
