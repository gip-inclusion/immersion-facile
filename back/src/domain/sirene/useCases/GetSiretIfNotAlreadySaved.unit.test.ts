import { expectPromiseToFailWithError, expectToEqual } from "shared";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { SirenApiRawEstablishmentBuilder } from "../../../_testBuilders/SirenApiRawEstablishmentBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { ConflictError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemorySirenGateway } from "../../../adapters/secondary/sirene/InMemorySirenGateway";
import { GetSiretIfNotAlreadySaved } from "./GetSiretIfNotAlreadySaved";

describe("GetSiretIfNotAlreadySaved", () => {
  let sirenGateway: InMemorySirenGateway;
  let getSiretIfNotAlreadySaved: GetSiretIfNotAlreadySaved;
  let uowPerformer: InMemoryUowPerformer;
  let establishmentAggregateRepo: InMemoryEstablishmentAggregateRepository;

  beforeEach(() => {
    sirenGateway = new InMemorySirenGateway();
    establishmentAggregateRepo = new InMemoryEstablishmentAggregateRepository();
    uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      establishmentAggregateRepository: establishmentAggregateRepo,
    });
    getSiretIfNotAlreadySaved = new GetSiretIfNotAlreadySaved(
      uowPerformer,
      sirenGateway,
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
    const sirenRawEstablishment = new SirenApiRawEstablishmentBuilder()
      .withSiret(siretAlreadyInDb)
      .withAdresseEtablissement({
        numeroVoieEtablissement: "20",
        typeVoieEtablissement: "AVENUE",
        libelleVoieEtablissement: "DE SEGUR",
        codePostalEtablissement: "75007",
        libelleCommuneEtablissement: "PARIS 7",
      })
      .withBusinessName("MA P'TITE BOITE 2")
      .withNafDto({ code: "8559A", nomenclature: "Ref2" })
      .withIsActive(true)
      .build();
    sirenGateway.setRawEstablishment(sirenRawEstablishment);

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
