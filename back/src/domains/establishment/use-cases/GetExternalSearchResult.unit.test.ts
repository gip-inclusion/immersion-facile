import {
  AppellationAndRomeDto,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryLaBonneBoiteGateway } from "../adapters/la-bonne-boite/InMemoryLaBonneBoiteGateway";
import { LaBonneBoiteCompanyDtoBuilder } from "../adapters/la-bonne-boite/LaBonneBoiteCompanyDtoBuilder";
import {
  GetExternalSearchResult,
  makeGetExternalSearchResult,
} from "./GetExternalSearchResult";

describe("GetExternalSearchResult", () => {
  const lbbResult = new LaBonneBoiteCompanyDtoBuilder().build();
  const searchedAppellation: AppellationAndRomeDto = {
    appellationCode: "19365",
    romeLabel: "Boulanger / boulangère",
    romeCode: "D1102",
    appellationLabel: "Boulanger / boulangère",
  };
  const searchResult = lbbResult.toSearchResult({
    romeCode: searchedAppellation.romeCode,
    romeLabel: searchedAppellation.romeLabel,
  });
  let uow: InMemoryUnitOfWork;
  let getExternalSearchResult: GetExternalSearchResult;
  let laBonneBoiteGateway: InMemoryLaBonneBoiteGateway;
  beforeEach(() => {
    laBonneBoiteGateway = new InMemoryLaBonneBoiteGateway();
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    getExternalSearchResult = makeGetExternalSearchResult({
      uowPerformer,
      deps: {
        laBonneBoiteGateway,
      },
    });
  });
  describe("Wrong paths", () => {
    it("throws a not found error if the siret is not found in gateway", async () => {
      uow.romeRepository.appellations = [searchedAppellation];
      expectPromiseToFailWithError(
        getExternalSearchResult.execute({
          siret: "12345678901234",
          appellationCode: searchedAppellation.appellationCode,
        }),
        errors.establishment.notFound({ siret: "12345678901234" }),
      );
    });

    it("throws a not found error if the appellations doesn't refers to a rome", async () => {
      laBonneBoiteGateway.setNextResults([lbbResult]);
      expectPromiseToFailWithError(
        getExternalSearchResult.execute({
          siret: lbbResult.siret,
          appellationCode: searchedAppellation.appellationCode,
        }),
        errors.establishment.offerMissing({
          siret: lbbResult.siret,
          appellationCode: searchedAppellation.appellationCode,
          mode: "not found",
        }),
      );
    });

    it("throws a not found error if the siret refers to a deleted establishment", async () => {
      laBonneBoiteGateway.setNextResults([lbbResult]);
      uow.romeRepository.appellations = [searchedAppellation];
      uow.deletedEstablishmentRepository.deletedEstablishments = [
        {
          createdAt: new Date(),
          siret: lbbResult.siret,
          deletedAt: new Date(),
        },
      ];
      expectPromiseToFailWithError(
        getExternalSearchResult.execute({
          siret: lbbResult.siret,
          appellationCode: searchedAppellation.appellationCode,
        }),
        errors.establishment.notFound({ siret: lbbResult.siret }),
      );
    });
  });

  describe("Right paths", () => {
    it("returns the search result", async () => {
      laBonneBoiteGateway.setNextResults([lbbResult]);
      uow.romeRepository.appellations = [searchedAppellation];
      expectToEqual(
        await getExternalSearchResult.execute({
          siret: lbbResult.siret,
          appellationCode: searchedAppellation.appellationCode,
        }),
        searchResult,
      );
    });
  });
});
