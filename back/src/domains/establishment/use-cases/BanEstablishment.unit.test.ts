import {
  type BannedEstablishment,
  type ConnectedUser,
  ConnectedUserBuilder,
  expectArraysToEqual,
} from "shared";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  type BanEstablishment,
  makeBanEstablishment,
} from "./BanEstablishment";

describe("BanEstablishment", () => {
  let uow: InMemoryUnitOfWork;
  let uowPerformer: InMemoryUowPerformer;
  let banEstablishment: BanEstablishment;

  const connectedNonAdminUser: ConnectedUser =
    new ConnectedUserBuilder().build();
  const connectedAdminUser: ConnectedUser = new ConnectedUserBuilder()
    .withIsAdmin(true)
    .build();

  const bannedEstablishment: BannedEstablishment = {
    siret: "12345678901234",
    bannishmentJustification: "Le cidre n'est pas breton",
  };

  beforeEach(() => {
    uow = createInMemoryUow();
    uowPerformer = new InMemoryUowPerformer(uow);
    banEstablishment = makeBanEstablishment({ uowPerformer });
  });

  it("bans an establishment", async () => {
    await banEstablishment.execute(
      {
        siret: bannedEstablishment.siret,
        bannishmentJustification: bannedEstablishment.bannishmentJustification,
      },
      connectedAdminUser,
    );

    expectArraysToEqual(
      uow.bannedEstablishmentRepository.bannedEstablishments,
      [bannedEstablishment],
    );
  });

  it("throws if establishment is already banned", async () => {
    await banEstablishment.execute(
      {
        siret: bannedEstablishment.siret,
        bannishmentJustification: bannedEstablishment.bannishmentJustification,
      },
      connectedAdminUser,
    );

    await expect(
      banEstablishment.execute(
        {
          siret: bannedEstablishment.siret,
          bannishmentJustification:
            bannedEstablishment.bannishmentJustification,
        },
        connectedAdminUser,
      ),
    ).rejects.toThrow(
      `L'établissement avec le siret '${bannedEstablishment.siret}' est déjà banni.`,
    );
  });

  it("throws if the user is not a back office admin", async () => {
    await expect(
      banEstablishment.execute(
        {
          siret: bannedEstablishment.siret,
          bannishmentJustification:
            bannedEstablishment.bannishmentJustification,
        },
        connectedNonAdminUser,
      ),
    ).rejects.toThrow(
      `L'utilisateur qui a l'identifiant "${connectedNonAdminUser.id}" n'a pas le droit d'accéder à cette ressource.`,
    );
  });
});
