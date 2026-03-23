import {
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { EstablishmentAggregateBuilder } from "../helpers/EstablishmentBuilders";
import {
  type GetEstablishmentPublicOptionsByFilters,
  makeGetEstablishmentPublicOptionsByFilters,
  toEstablishmentPublicOption,
} from "./GetEstablishmentPublicOptionsByFilters";

describe("GetEstablishmentPublicOptionsByFilters", () => {
  let uow: InMemoryUnitOfWork;
  let uowPerformer: InMemoryUowPerformer;

  let getEstablishmentPublicOptionsByFilters: GetEstablishmentPublicOptionsByFilters;

  const connectedUser = new ConnectedUserBuilder().build();
  const establishmentAggregateToKeepOnSiret =
    new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("10000000000000")
      .withUserRights([
        {
          userId: connectedUser.id,
          role: "establishment-admin",
          status: "ACCEPTED",
          shouldReceiveDiscussionNotifications: true,
          job: "osef",
          phone: "osef",
          isMainContactByPhone: false,
        },
      ])
      .build();
  const establishmentAggregateToKeepOnName1 =
    new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("10000000000001")
      .withEstablishmentName("La kig ha farz de la mère kergadec")
      .withUserRights([
        {
          userId: connectedUser.id,
          role: "establishment-admin",
          status: "ACCEPTED",
          shouldReceiveDiscussionNotifications: true,
          job: "osef",
          phone: "osef",
          isMainContactByPhone: false,
        },
      ])
      .build();
  const establishmentAggregateToKeepOnName2 =
    new EstablishmentAggregateBuilder()
      .withEstablishmentSiret("10000000000002")
      .withEstablishmentName("La kig ha farz de la mère Plougelac'h")
      .withUserRights([
        {
          userId: connectedUser.id,
          role: "establishment-admin",
          status: "ACCEPTED",
          shouldReceiveDiscussionNotifications: true,
          job: "osef",
          phone: "osef",
          isMainContactByPhone: false,
        },
      ])
      .build();

  beforeAll(() => {
    uow = createInMemoryUow();
    uowPerformer = new InMemoryUowPerformer(uow);
  });

  beforeEach(() => {
    getEstablishmentPublicOptionsByFilters =
      makeGetEstablishmentPublicOptionsByFilters({ uowPerformer });

    uow.establishmentAggregateRepository.establishmentAggregates = [
      establishmentAggregateToKeepOnSiret,
      establishmentAggregateToKeepOnName1,
      establishmentAggregateToKeepOnName2,
    ];
    uow.userRepository.users = [connectedUser];
  });

  describe("Wrong paths", () => {
    it("throws unauthorized if user is not connected", () => {
      expectPromiseToFailWithError(
        getEstablishmentPublicOptionsByFilters.execute({}, undefined),
        errors.user.unauthorized(),
      );
    });
  });

  describe("Right paths", () => {
    it("return empty array establishment if filters does not match any establishment", async () => {
      const establishmentPublicOptionsWithUnknownName =
        await getEstablishmentPublicOptionsByFilters.execute(
          { nameIncludes: "les crêpiers du finistère nord" },
          connectedUser,
        );

      const establishmentPublicOptionsWithUnknownSiret =
        await getEstablishmentPublicOptionsByFilters.execute(
          { siret: "70000000000000" },
          connectedUser,
        );

      expectToEqual(establishmentPublicOptionsWithUnknownName, []);
      expectToEqual(establishmentPublicOptionsWithUnknownSiret, []);
    });
    it("gets establishment public options by name includes", async () => {
      const resultsByNameWide =
        await getEstablishmentPublicOptionsByFilters.execute(
          { nameIncludes: "La kig ha farz" },
          connectedUser,
        );

      expectToEqual(resultsByNameWide, [
        toEstablishmentPublicOption(establishmentAggregateToKeepOnName1),
        toEstablishmentPublicOption(establishmentAggregateToKeepOnName2),
      ]);

      const resultsByNameNarrow =
        await getEstablishmentPublicOptionsByFilters.execute(
          { nameIncludes: "kergadec" },
          connectedUser,
        );

      expectToEqual(resultsByNameNarrow, [
        toEstablishmentPublicOption(establishmentAggregateToKeepOnName1),
      ]);
    });
    it("gets establishment public options by sirets", async () => {
      const resultsBySiret =
        await getEstablishmentPublicOptionsByFilters.execute(
          { siret: "10000000000000" },
          connectedUser,
        );

      expectToEqual(resultsBySiret, [
        toEstablishmentPublicOption(establishmentAggregateToKeepOnSiret),
      ]);
    });
    it("gets establishment public options by name includes and sirets", async () => {
      const resultsByNameAndSiret =
        await getEstablishmentPublicOptionsByFilters.execute(
          { nameIncludes: "La kig ha farz", siret: "10000000000001" },
          connectedUser,
        );

      expectToEqual(resultsByNameAndSiret, [
        toEstablishmentPublicOption(establishmentAggregateToKeepOnName1),
      ]);
    });
  });
});
