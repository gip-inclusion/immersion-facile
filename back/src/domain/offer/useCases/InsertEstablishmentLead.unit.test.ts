import {
  ConventionDto,
  ConventionDtoBuilder,
  expectArraysToEqual,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryEstablishmentLeadRepository } from "../../../adapters/secondary/offer/InMemoryEstablishmentLeadRepository";
import { InsertEstablishmentLead } from "./InsertEstablishmentLead";

describe("InsertEstablishmentLead", () => {
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let insertEstablishmentLeadUsecase: InsertEstablishmentLead;
  let establishmentLeadRepository: InMemoryEstablishmentLeadRepository;

  beforeEach(() => {
    uow = createInMemoryUow();

    timeGateway = new CustomTimeGateway();
    insertEstablishmentLeadUsecase = new InsertEstablishmentLead(
      new InMemoryUowPerformer(uow),
      timeGateway,
    );
    establishmentLeadRepository = uow.establishmentLeadRepository;
  });

  // Est ce qu'on veut vérifier que le status de la convention est bien valide sachant que ce usecase sera trigger par l'event accepted by validator

  it("insert a new establishment lead event", async () => {
    const convention: ConventionDto = new ConventionDtoBuilder().build();
    const siret = convention.siret;

    await insertEstablishmentLeadUsecase.execute({ convention });

    expectArraysToEqual(establishmentLeadRepository.getBySiret(siret), [
      {
        siret,
        lastEventKind: "to-be-reminded",
        events: [
          {
            conventionId: convention.id,
            occuredAt: timeGateway.now(),
            kind: "to-be-reminded",
          },
        ],
      },
    ]);
  });
});
