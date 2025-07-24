import { errors, expectPromiseToFailWithError, expectToEqual } from "shared";
import { InMemoryEstablishmentAggregateRepository } from "../../../establishment/adapters/InMemoryEstablishmentAggregateRepository";
import { EstablishmentAggregateBuilder } from "../../../establishment/helpers/EstablishmentBuilders";
import { createInMemoryUow } from "../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemorySiretGateway,
  SiretEstablishmentDtoBuilder,
} from "../adapters/InMemorySiretGateway";
import { GetSiretIfNotAlreadySaved } from "./GetSiretIfNotAlreadySaved";

describe("GetSiretIfNotAlreadySaved", () => {
  let siretGateway: InMemorySiretGateway;
  let getSiretIfNotAlreadySaved: GetSiretIfNotAlreadySaved;
  let uowPerformer: InMemoryUowPerformer;
  let establishmentAggregateRepo: InMemoryEstablishmentAggregateRepository;

  beforeEach(() => {
    siretGateway = new InMemorySiretGateway();
    establishmentAggregateRepo = new InMemoryEstablishmentAggregateRepository();
    uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      establishmentAggregateRepository: establishmentAggregateRepo,
    });
    getSiretIfNotAlreadySaved = new GetSiretIfNotAlreadySaved(
      uowPerformer,
      siretGateway,
    );
  });

  it("throws an error if the siret is already saved", async () => {
    const siretAlreadyInDb = "11112222000033";
    establishmentAggregateRepo.establishmentAggregates = [
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(siretAlreadyInDb)
        .withUserRights([
          {
            role: "establishment-admin",
            job: "",
            phone: "",
            userId: "osef",
            shouldReceiveDiscussionNotifications: true,
          },
        ])
        .build(),
    ];

    await expectPromiseToFailWithError(
      getSiretIfNotAlreadySaved.execute({
        siret: siretAlreadyInDb,
      }),
      errors.establishment.conflictError({ siret: siretAlreadyInDb }),
    );
  });

  it("returns the establishment info if not already in DB", async () => {
    const siretAlreadyInDb = "11112222000033";
    establishmentAggregateRepo.establishmentAggregates = [];
    const siretRawEstablishment = new SiretEstablishmentDtoBuilder()
      .withSiret(siretAlreadyInDb)
      .withBusinessAddress("20 AVENUE DE SEGUR 75007 PARIS 7")
      .withBusinessName("MA P'TITE BOITE 2")
      .withNafDto({ code: "8559A", nomenclature: "Ref2" })
      .withIsActive(true)
      .withNumberEmployeesRange("1-2")
      .build();
    siretGateway.setSirenEstablishment(siretRawEstablishment);

    const response = await getSiretIfNotAlreadySaved.execute({
      siret: siretAlreadyInDb,
    });
    expectToEqual(response, {
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      businessName: "MA P'TITE BOITE 2",
      isOpen: true,
      nafDto: { code: "8559A", nomenclature: "Ref2" },
      numberEmployeesRange: "1-2",
      siret: siretAlreadyInDb,
    });
  });
});
