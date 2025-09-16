import type { AgencyId, AgencyKind } from "shared";
import type { UnitOfWork } from "../../domains/core/unit-of-work/ports/UnitOfWork";
import {
  insertAgencySeed,
  insertSpecificAgenciesWithUserRight,
} from "./seed.helpers";
import { seedUsers } from "./userSeed";

export const agencySeed = async (
  uow: UnitOfWork,
): Promise<Record<AgencyKind, AgencyId[]>> => {
  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.log("agencySeed start ...");

  const agenciesCountByKind = 10;

  const randomAgencies: Record<AgencyKind, AgencyId[]> = {
    "pole-emploi": await Promise.all(
      [...Array(agenciesCountByKind).keys()].map(() =>
        insertAgencySeed({
          uow,
          kind: "pole-emploi",
          userId: seedUsers.adminUser.id,
        }),
      ),
    ),
    "mission-locale": await Promise.all(
      [...Array(agenciesCountByKind).keys()].map(() =>
        insertAgencySeed({
          uow,
          kind: "mission-locale",
          userId: seedUsers.adminUser.id,
        }),
      ),
    ),
    "cap-emploi": await Promise.all(
      [...Array(agenciesCountByKind).keys()].map(() =>
        insertAgencySeed({
          uow,
          kind: "cap-emploi",
          userId: seedUsers.adminUser.id,
        }),
      ),
    ),
    "conseil-departemental": await Promise.all(
      [...Array(agenciesCountByKind).keys()].map(() =>
        insertAgencySeed({
          uow,
          kind: "conseil-departemental",
          userId: seedUsers.adminUser.id,
        }),
      ),
    ),
    "prepa-apprentissage": await Promise.all(
      [...Array(agenciesCountByKind).keys()].map(() =>
        insertAgencySeed({
          uow,
          kind: "prepa-apprentissage",
          userId: seedUsers.adminUser.id,
        }),
      ),
    ),
    "structure-IAE": await Promise.all(
      [...Array(agenciesCountByKind).keys()].map(() =>
        insertAgencySeed({
          uow,
          kind: "structure-IAE",
          userId: seedUsers.adminUser.id,
        }),
      ),
    ),
    "fonction-publique": await Promise.all(
      [...Array(agenciesCountByKind).keys()].map(() =>
        insertAgencySeed({
          uow,
          kind: "fonction-publique",
          userId: seedUsers.adminUser.id,
        }),
      ),
    ),
    cci: await Promise.all(
      [...Array(agenciesCountByKind).keys()].map(() =>
        insertAgencySeed({
          uow,
          kind: "cci",
          userId: seedUsers.adminUser.id,
        }),
      ),
    ),
    cma: await Promise.all(
      [...Array(agenciesCountByKind).keys()].map(() =>
        insertAgencySeed({
          uow,
          kind: "cma",
          userId: seedUsers.adminUser.id,
        }),
      ),
    ),
    "chambre-agriculture": await Promise.all(
      [...Array(agenciesCountByKind).keys()].map(() =>
        insertAgencySeed({
          uow,
          kind: "chambre-agriculture",
          userId: seedUsers.adminUser.id,
        }),
      ),
    ),
    autre: await Promise.all(
      [...Array(agenciesCountByKind).keys()].map(() =>
        insertAgencySeed({
          uow,
          kind: "autre",
          userId: seedUsers.adminUser.id,
        }),
      ),
    ),
    "immersion-facile": await Promise.all(
      [...Array(agenciesCountByKind).keys()].map(() =>
        insertAgencySeed({
          uow,
          kind: "immersion-facile",
          userId: seedUsers.adminUser.id,
        }),
      ),
    ),
    "operateur-cep": await Promise.all(
      [...Array(agenciesCountByKind).keys()].map(() =>
        insertAgencySeed({
          uow,
          kind: "operateur-cep",
          userId: seedUsers.adminUser.id,
        }),
      ),
    ),
  };

  const randomAndSpecificAgencyIds = insertSpecificAgenciesWithUserRight({
    uow,
    userId: seedUsers.adminUser.id,
    agencyIds: randomAgencies,
  });

  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.log("agencySeed done");

  return randomAndSpecificAgencyIds;
};
