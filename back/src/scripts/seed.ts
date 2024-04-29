import { addDays } from "date-fns";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  DiscussionBuilder,
  FeatureFlags,
  InclusionConnectedUserBuilder,
  cciAgencyId,
  conventionSchema,
  makeTextFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
  peParisAgencyId,
  reasonableSchedule,
} from "shared";
import { AppConfig } from "../config/bootstrap/appConfig";
import { createAppDependencies } from "../config/bootstrap/createAppDependencies";
import { KyselyDb, makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { SavedError } from "../domains/core/saved-errors/ports/SavedErrorRepository";
import { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";
import {
  ContactEntityBuilder,
  EstablishmentAggregateBuilder,
  EstablishmentEntityBuilder,
  OfferEntityBuilder,
} from "../domains/establishment/helpers/EstablishmentBuilders";
import { establishmentAggragateToFormEstablishement } from "../domains/establishment/use-cases/RetrieveFormEstablishmentFromAggregates";

/* eslint-disable no-console */
const seed = async () => {
  const config = AppConfig.createFromEnv();
  const deps = await createAppDependencies(config);

  const pool = deps.getPgPoolFn();
  const client = await pool.connect();
  const db = makeKyselyDb(pool);

  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("Reset Db start");
  await client.query("DELETE FROM feature_flags");

  await db.deleteFrom("users_ongoing_oauths").execute();
  await db.deleteFrom("users").execute();
  await db.deleteFrom("conventions").execute();
  await db.deleteFrom("agency_groups__agencies").execute();
  await db.deleteFrom("agency_groups").execute();
  await db.deleteFrom("agencies").execute();
  await db.deleteFrom("discussions").execute();
  await db.deleteFrom("establishments_contacts").execute();
  await db.deleteFrom("form_establishments").execute();
  await db.deleteFrom("establishments").execute();
  await db.deleteFrom("groups").execute();

  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("Reset Db end");

  await inclusionConnectUserSeed(db);

  await deps.uowPerformer.perform(async (uow) => {
    await featureFlagsSeed(uow);
    await agencySeed(uow);
    await establishmentSeed(uow);
    await conventionSeed(uow);
  });

  client.release();
  await pool.end();
};

const inclusionConnectUserSeed = async (db: KyselyDb) => {
  const adminUser = new InclusionConnectedUserBuilder()
    .withIsAdmin(true)
    .withEmail("admin+playwright@immersion-facile.beta.gouv.fr")
    .withFirstName("Prénom Admin")
    .withLastName("Nom Admin")
    .withId("a63dd0e5-1626-4181-97ef-1fd58278b778")
    .withExternalId("7f5cfde7-80b3-4ea1-bf3e-1711d0876161")
    .build();

  await db
    .insertInto("users")
    .values({
      id: adminUser.id,
      email: adminUser.email,
      first_name: adminUser.firstName,
      last_name: adminUser.lastName,
      external_id: adminUser.externalId,
      created_at: adminUser.createdAt,
    })
    .execute();

  await db
    .insertInto("users_admins")
    .values({
      user_id: adminUser.id,
    })
    .execute();
};

const featureFlagsSeed = async (uow: UnitOfWork) => {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("seeding feature flags...");

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

const agencySeed = async (uow: UnitOfWork) => {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("seeding agencies...");
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

const establishmentSeed = async (uow: UnitOfWork) => {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log("seeding establishments ...");
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

  const discussionId = "aaaaaaaa-9c0a-1aaa-aa6d-aaaaaaaaaaaa";
  await uow.discussionRepository.insert(
    new DiscussionBuilder()
      .withId(discussionId)
      .withSiret(franceMerguez.establishment.siret)
      .withPotentialBeneficiary({
        resumeLink: "https://www.docdroid.net/WyjIuyO/fake-resume-pdf",
      })
      .withExchanges([
        {
          sender: "potentialBeneficiary",
          recipient: "establishment",
          sentAt: new Date("2024-02-02").toISOString(),
          subject: "Présentation",
          message: "Bonjour, je me présente!",
        },
        {
          sender: "establishment",
          recipient: "potentialBeneficiary",
          sentAt: new Date("2024-02-03").toISOString(),
          subject: "Réponse entreprise",
          message: "Allez viens on est bien.",
        },
      ])
      .build(),
  );

  Promise.all(
    [franceMerguez, decathlon].map(async (establishmentAggregate) => {
      const offersAsAppellationDto =
        await uow.establishmentAggregateRepository.getOffersAsAppellationDtoEstablishment(
          establishmentAggregate.establishment.siret,
        );
      await uow.formEstablishmentRepository.create(
        establishmentAggragateToFormEstablishement(
          establishmentAggregate,
          offersAsAppellationDto,
        ),
      );
    }),
  );

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
    consumerId: null,
    consumerName: "Fake consumer",
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
