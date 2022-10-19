import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { SireneEstablishmentVOBuilder } from "../../../_testBuilders/SireneEstablishmentVOBuilder";
import {
  expectPromiseToFailWithError,
  expectTypeToMatchAndEqual,
} from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { ConflictError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryEstablishmentAggregateRepository } from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { GetSiretIfNotAlreadySaved } from "../../../domain/sirene/useCases/GetSiretIfNotAlreadySaved";
import { InMemorySireneGateway } from "../../../adapters/secondary/sirene/InMemorySireneGateway";

describe("GetSiretIfNotAlreadySaved", () => {
  let sireneGateway: InMemorySireneGateway;
  let getSiretIfNotAlreadySaved: GetSiretIfNotAlreadySaved;
  let uowPerformer: InMemoryUowPerformer;
  let establishmentAggregateRepo: InMemoryEstablishmentAggregateRepository;

  beforeEach(() => {
    sireneGateway = new InMemorySireneGateway();
    establishmentAggregateRepo = new InMemoryEstablishmentAggregateRepository();
    uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      establishmentAggregateRepository: establishmentAggregateRepo,
    });
    getSiretIfNotAlreadySaved = new GetSiretIfNotAlreadySaved(
      uowPerformer,
      sireneGateway,
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
    sireneGateway.setEstablishment(
      new SireneEstablishmentVOBuilder().withSiret(siretAlreadyInDb).build(),
    );

    const response = await getSiretIfNotAlreadySaved.execute({
      siret: siretAlreadyInDb,
    });
    expectTypeToMatchAndEqual(response, {
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      businessName: "MA P'TITE BOITE 2",
      isOpen: false,
      naf: { code: "8559A", nomenclature: "Ref2" },
      siret: "11112222000033",
    });
  });
});
