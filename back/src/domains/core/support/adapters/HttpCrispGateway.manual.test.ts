import { createFetchSharedClient } from "shared-routes/fetch";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { HttpCrispGateway, crispRoutes } from "./HttpCrispGateway";

describe("HttpCrispGateway", () => {
  const config = AppConfig.createFromEnv();
  let crispApi: HttpCrispGateway;

  beforeEach(() => {
    const httpClient = createFetchSharedClient(crispRoutes, fetch);
    crispApi = new HttpCrispGateway(httpClient, config.crispConfig);
  });

  describe("initiate conversation", () => {
    it("should initiate a conversation", async () => {
      await crispApi.initiateConversation({
        message: "Test tech IF - vous inquiétez pas au support.",
        metadata: {
          email: "john.doe@immersion-facile.beta.gouv.fr",
          segments: [],
          nickname: "John Doe",
          subject: "Test tech IF Yay",
        },
        helperNote: `Des super notes ! 
        
        Avec des liens de ouf genre :
        https://immersion-facile.beta.gouv.fr
        
        A+ la team IF !
        `,
      });

      // should not throw, go check for this message in CRISP
    });
  });
});
