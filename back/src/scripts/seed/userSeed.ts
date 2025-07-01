import { values } from "ramda";
import { InclusionConnectedUserBuilder, UserBuilder } from "shared";
import type { KyselyDb } from "../../config/pg/kysely/kyselyUtils";

export const seedUsers = {
  icUser: new InclusionConnectedUserBuilder()
    .withIsAdmin(false)
    .withCreatedAt(new Date("2024-04-29"))
    .withEmail("recette+playwright@immersion-facile.beta.gouv.fr")
    .withFirstName("Jean")
    .withLastName("Immersion")
    .withId("e9dce090-f45e-46ce-9c58-4fbbb3e494ba")
    .withProConnectInfos({
      externalId: "e9dce090-f45e-46ce-9c58-4fbbb3e494ba",
      siret: "13003013300016",
    })
    .build(),
  adminUser: new InclusionConnectedUserBuilder()
    .withIsAdmin(true)
    .withCreatedAt(new Date("2024-04-30"))
    .withEmail("admin+playwright@immersion-facile.beta.gouv.fr")
    .withFirstName("Jean")
    .withLastName("Immersion")
    .withId("7f5cfde7-80b3-4ea1-bf3e-1711d0876161")
    .withProConnectInfos({
      externalId: "7f5cfde7-80b3-4ea1-bf3e-1711d0876161",
      siret: "13003013300016",
    })
    .build(),
  franceMerguezUser: new UserBuilder()
    .withId("11111111-2222-4000-2222-111111111111")
    .withFirstName("Daniella")
    .withLastName("Velàzquez")
    .withEmail("recette+merguez@immersion-facile.beta.gouv.fr")
    .build(),
  decathlonUser: new UserBuilder()
    .withId("cccccccc-cccc-4000-cccc-cccccccccccc")
    .withEmail("decathlon@mail.com")
    .build(),
};

export const userSeed = async (db: KyselyDb) => {
  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.log("proConnectUserSeed start ...");

  await db
    .insertInto("users")
    .values(
      values(seedUsers).map((user) => ({
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        pro_connect_sub: user.proConnect?.externalId,
        pro_connect_siret: user.proConnect?.siret,
        created_at: user.createdAt,
      })),
    )
    .execute();

  await db
    .insertInto("users_admins")
    .values({
      user_id: seedUsers.adminUser.id,
    })
    .execute();

  // biome-ignore lint/suspicious/noConsole: <explanation>
  console.log("inclusionConnectUserSeed end");
};
