import { expectPromiseToFailWithError, expectToEqual } from "shared";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/establishmentAggregate.test.helpers";
import { SirenEstablishmentDtoBuilder } from "../../../_testBuilders/SirenEstablishmentDtoBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { ConflictError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemorySiretGateway } from "../../../adapters/secondary/siret/InMemorySiretGateway";
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
        .build(),
    ];

    await expectPromiseToFailWithError(
      getSiretIfNotAlreadySaved.execute({
        siret: siretAlreadyInDb,
      }),
      new ConflictError(
        "Establishment with siret 11112222000033 already in db",
      ),
    );
  });

  it("returns the establishment info if not already in DB", async () => {
    const siretAlreadyInDb = "11112222000033";
    establishmentAggregateRepo.establishmentAggregates = [];
    const siretRawEstablishment = new SirenEstablishmentDtoBuilder()
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
