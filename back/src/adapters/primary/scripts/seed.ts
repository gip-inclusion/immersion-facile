import { PoolClient } from "pg";
import { keys } from "ramda";
import { AgencyDtoBuilder, FeatureFlags } from "shared";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { UnitOfWork } from "../../../domain/core/ports/UnitOfWork";
import { AppConfig } from "../config/appConfig";
import { createAppDependencies } from "../config/createAppDependencies";

/* eslint-disable no-console */
const seed = async () => {
  const config = AppConfig.createFromEnv();
  const deps = await createAppDependencies(config);

  const pool = deps.getPgPoolFn();
  const client = await pool.connect();

  await deps.uowPerformer.perform(async (uow) => {
    await featureFlagsSeed(uow, client);
    await agencySeed(uow, client);
    await establishmentAggregateSeed(uow, client);
  });

  client.release();
};

const featureFlagsSeed = async (uow: UnitOfWork, client: PoolClient) => {
  console.log("seeding feature flags...");
  await client.query("DELETE FROM feature_flags");
  const featureFlags: FeatureFlags = {
    enableInseeApi: true,
    enableLogoUpload: true,
    enableMaintenance: false,
    enableMaxContactPerWeek: true,
    enablePeConnectApi: true,
    enablePeConventionBroadcast: true,
    enableTemporaryOperation: false,
  };

  await Promise.all(
    keys(featureFlags).map((flagName) =>
      uow.featureFlagRepository.set({
        flagName,
        value: featureFlags[flagName],
      }),
    ),
  );
  console.log("done");
};

const agencySeed = async (uow: UnitOfWork, client: PoolClient) => {
  console.log("seeding agencies...");
  await client.query("DELETE FROM conventions");
  await client.query("DELETE FROM agencies");
  const peParisAgency = new AgencyDtoBuilder()
    .withName("Agence Pôle Emploi Paris")
    .withKind("pole-emploi")
    .withStatus("active")
    .withAddress({
      city: "Paris",
      departmentCode: "75",
      postcode: "75001",
      streetNumberAndAddress: "1 rue de Rivoli",
    })
    .build();

  await uow.agencyRepository.insert(peParisAgency);
  console.log("done");
};

const establishmentAggregateSeed = async (
  uow: UnitOfWork,
  client: PoolClient,
) => {
  console.log("seeding establishment aggregates...");
  await client.query("DELETE FROM discussions");
  await client.query("DELETE FROM immersion_contacts");
  await client.query("DELETE FROM establishments CASCADE");
  const franceMerguez = new EstablishmentAggregateBuilder()
    .withEstablishment(
      new EstablishmentEntityBuilder()
        .withSiret("34493368400021")
        .withName("France Merguez Distribution")
        .build(),
    )
    .withImmersionOffers([
      new ImmersionOfferEntityV2Builder()
        .withAppellationCode("11569")
        .withAppellationLabel("Boucher-charcutier / Bouchère-charcutière")
        .withRomeCode("D1101")
        .build(),
    ])
    .withContact(new ContactEntityBuilder().build())
    .build();

  await uow.establishmentAggregateRepository.insertEstablishmentAggregates([
    franceMerguez,
  ]);
  console.log("done");
};

seed()
  .then(() => {
    console.log("Seeding script ended !");
  })
  .catch((err) => {
    console.error("Something went wrong with seed script : ", err);
    process.exit(1);
  });
