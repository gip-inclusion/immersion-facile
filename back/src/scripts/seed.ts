import { addDays } from "date-fns";
import { PoolClient } from "pg";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  FeatureFlags,
  cciAgencyId,
  conventionSchema,
  makeTextFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
  peParisAgencyId,
  reasonableSchedule,
} from "shared";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createAppDependencies } from "../config/bootstrap/createAppDependencies";
import { SavedError } from "../domains/core/saved-errors/ports/SavedErrorRepository";
import { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../domains/establishment/helpers/EstablishmentBuilders";

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
    await conventionSeed(uow);
  });

  client.release();
  await pool.end();
};

const featureFlagsSeed = async (uow: UnitOfWork, client: PoolClient) => {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("seeding feature flags...");
  await client.query("DELETE FROM feature_flags");

  const featureFlags: FeatureFlags = {
    enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
      message: "message",
      imageUrl: "https://imageUrl",
      redirectUrl: "https://redirectUrl",
      imageAlt: "",
      title: "",
      overtitle: "",
    }),
    enableMaintenance: makeTextFeatureFlag(false, {
      message: "Mon message de maintenance",
    }),
  };

  await uow.featureFlagRepository.insertAll(featureFlags);
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("done");
};

const agencySeed = async (uow: UnitOfWork, client: PoolClient) => {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("seeding agencies...");
  await client.query("DELETE FROM conventions");
  await client.query("DELETE FROM agencies");
  const peParisAgency = new AgencyDtoBuilder()
    .withId(peParisAgencyId)
    .withName("Agence Pôle Emploi Paris")
    .withQuestionnaireUrl("https://questionnaire.seed")
    .withSignature("Seed signature")
    .withKind("pole-emploi")
    .withStatus("active")
    .withAddress({
      city: "Paris",
      departmentCode: "75",
      postcode: "75001",
      streetNumberAndAddress: "1 rue de Rivoli",
    })
    .build();

  const cciAgency = new AgencyDtoBuilder()
    .withId(cciAgencyId)
    .withName("CCI Carnac")
    .withQuestionnaireUrl("https://questionnaire.seed")
    .withSignature("Seed signature")
    .withKind("cci")
    .withStatus("active")
    .withAddress({
      city: "Plouharnel",
      departmentCode: "56",
      postcode: "56340",
      streetNumberAndAddress: "5 Kerhueno",
    })
    .build();

  await Promise.all([
    uow.agencyRepository.insert(peParisAgency),
    uow.agencyRepository.insert(cciAgency),
  ]);
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("done");
};

const establishmentAggregateSeed = async (
  uow: UnitOfWork,
  client: PoolClient,
) => {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("seeding establishment aggregates...");
  await client.query("DELETE FROM discussions");
  await client.query("DELETE FROM immersion_contacts");
  await client.query("DELETE FROM form_establishments");
  await client.query("DELETE FROM establishments CASCADE");
  await client.query("DELETE FROM groups CASCADE");
  const franceMerguez = new EstablishmentAggregateBuilder()
    .withEstablishment(
      new EstablishmentEntityBuilder()
        .withLocations([
          {
            id: "bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aa01",
            address: {
              city: "Villetaneuse",
              postcode: "93430",
              streetNumberAndAddress: "6 RUE RAYMOND BROSSE",
              departmentCode: "93",
            },
            position: { lat: 48.956, lon: 2.345 },
          },
          {
            id: "bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aa02",
            address: {
              city: "Paris",
              postcode: "75001",
              streetNumberAndAddress: "1 rue de Rivoli",
              departmentCode: "75",
            },
            position: { lat: 48.8566, lon: 2.3522 },
          },
        ])
        .withSiret("34493368400021")
        .withName("France Merguez Distribution")
        .build(),
    )
    .withOffers([
      new OfferEntityBuilder()
        .withAppellationCode("11569")
        .withAppellationLabel("Boucher-charcutier / Bouchère-charcutière")
        .withRomeCode("D1101")
        .build(),
    ])
    .withContact(
      new ContactEntityBuilder()
        .withEmail("recette+merguez@immersion-facile.beta.gouv.fr")
        .build(),
    )
    .build();

  const decathlon = new EstablishmentAggregateBuilder()
    .withEstablishment(
      new EstablishmentEntityBuilder()
        .withSiret("50056940501696")
        .withName("Decathlon france")
        .build(),
    )
    .withOffers([
      new OfferEntityBuilder()
        .withAppellationCode("20552")
        .withAppellationLabel("Vendeur / Vendeuse en articles de sport")
        .withRomeCode("D1211")
        .build(),
    ])
    .withContact(
      new ContactEntityBuilder()
        .withId("cccccccc-cccc-caaa-cccc-cccccccccccc")
        .build(),
    )
    .build();

  await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
    franceMerguez,
  );
  await uow.establishmentAggregateRepository.insertEstablishmentAggregate(
    decathlon,
  );

  await uow.groupRepository.save({
    slug: "decathlon",
    sirets: [decathlon.establishment.siret],
    options: {
      heroHeader: {
        title: "Bienvenue chez Decathlon",
        description: "À fond la forme !",
      },
      tintColor: "#007DBC",
    },
    name: "Decathlon",
  });
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("done");
};

const conventionSeed = async (uow: UnitOfWork) => {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("seeding conventions...");

  const peConvention = new ConventionDtoBuilder()
    .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aa01")
    .withInternshipKind("immersion")
    .withDateStart(new Date("2023-03-27").toISOString())
    .withDateEnd(new Date("2023-03-28").toISOString())
    .withStatus("READY_TO_SIGN")
    .withAgencyId(peParisAgencyId)
    .withSchedule(reasonableSchedule)
    .build();

  conventionSchema.parse(peConvention);

  const cciConvention = new ConventionDtoBuilder()
    .withId("4d7f9ded-fa25-462a-a290-caeaa192c555")
    .withInternshipKind("mini-stage-cci")
    .withDateStart(new Date("2023-05-01").toISOString())
    .withDateEnd(new Date("2023-05-03").toISOString())
    .withStatus("READY_TO_SIGN")
    .withAgencyId(cciAgencyId)
    .withSchedule(reasonableSchedule)
    .build();

  conventionSchema.parse(cciConvention);

  await Promise.all([
    uow.conventionRepository.save(peConvention),
    uow.conventionRepository.save(cciConvention),
  ]);

  const savedError: SavedError = {
    handledByAgency: false,
    message: "message de la seed",
    occurredAt: addDays(new Date(peConvention.dateSubmission), 2),
    serviceName: "PoleEmploiGateway.notifyOnConventionUpdated",
    params: { httpStatus: 404, conventionId: peConvention.id },
  };
  await uow.errorRepository.save(savedError);

  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("done");
};

seed()
  .then(() => {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log("Seeding script ended !");
  })
  .catch((err) => {
    console.error("Something went wrong with seed script : ", err);
    process.exit(1);
  });

// un lien rapide pour pas remplir le formulaire à la main en local (avec le siret france merguez, et l'agence pole emploi paris défini dans cette seed)
// http://localhost:3000/demande-immersion?email=john.doe%40mail.mo&firstName=John&lastName=Doe&phone=0202020202&financiaryHelp=&emergencyContact=&emergencyContactPhone=&isRqth=false&birthdate=2000-10-10&agencyDepartment=75&siret=34493368400021&businessName=FRANCE%20MERGUEZ%20DISTRIBUTION&businessAdvantages=&etFirstName=Bob&etLastName=Le%20tuteur&etJob=Tuteur&etPhone=0303030303&etEmail=bob.letuteur%40mail.com&erFirstName=Bob&erLastName=Le%20tuteur&erPhone=0303030303&erEmail=bob.letuteur%40mail.com&immersionAddress=ZI%20VILLETANEUSE%206%20RUE%20RAYMOND%20BROSSE%2093430%20VILLETANEUSE&agencyId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&immersionObjective=Confirmer%20un%20projet%20professionnel&immersionActivities=Charcuttage%20de%20comp%C3%AAt.&immersionSkills=&sanitaryPreventionDescription=&workConditions=&sanitaryPrevention=false&individualProtection=false&dateStart=2023-06-09&dateEnd=2023-06-10T00%3A00%3A00.000Z&schedule=%7B%22totalHours%22%3A6%2C%22workedDays%22%3A2%2C%22isSimple%22%3Atrue%2C%22selectedIndex%22%3A0%2C%22complexSchedule%22%3A%5B%7B%22date%22%3A%222023-06-09T00%3A00%3A00.000Z%22%2C%22timePeriods%22%3A%5B%7B%22start%22%3A%2209%3A00%22%2C%22end%22%3A%2212%3A00%22%7D%5D%7D%2C%7B%22date%22%3A%222023-06-10T00%3A00%3A00.000Z%22%2C%22timePeriods%22%3A%5B%7B%22start%22%3A%2209%3A00%22%2C%22end%22%3A%2212%3A00%22%7D%5D%7D%5D%7D&immersionAppellation=%7B%22romeCode%22%3A%22D1103%22%2C%22romeLabel%22%3A%22Charcuterie%20-%20traiteur%22%2C%22appellationCode%22%3A%2211741%22%2C%22appellationLabel%22%3A%22Charcutier%20%2F%20Charcuti%C3%A8re%22%7D
