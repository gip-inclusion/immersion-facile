import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { AssociateFederatedIdentityPeConnect } from "../../../domain/peConnect/useCases/AssociateFederatedIdentityPeConnect";

describe("LinkPoleEmploiAdvisorAndRedirectToConvention", () => {
  let _associateFederatedIdentityPeConnect: AssociateFederatedIdentityPeConnect;
  let uowPerformer: InMemoryUowPerformer;
  let _conventionPoleEmploiAdvisorRepo: InMemoryConventionPoleEmploiAdvisorRepository;

  const _userPeExternalId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";
  const _emptyConventionId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";

  beforeEach(() => {
    const uow = createInMemoryUow();
    _conventionPoleEmploiAdvisorRepo = uow.conventionPoleEmploiAdvisorRepo;
    uowPerformer = new InMemoryUowPerformer({
      ...uow,
    });

    _associateFederatedIdentityPeConnect =
      new AssociateFederatedIdentityPeConnect(uowPerformer);
  });

  it.todo("should .");
});
