import { Pool, PoolClient } from "pg";
import { ContactEntityV2Builder } from "../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentEntityV2Builder } from "../../_testBuilders/EstablishmentEntityV2Builder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionOfferEntityV2Builder } from "../../_testBuilders/ImmersionOfferEntityV2Builder";
import { PgEstablishmentAggregateRepository } from "../../adapters/secondary/pg/PgEstablishmentAggregateRepository";
import { EstablishmentAggregate } from "../../domain/immersionOffer/entities/EstablishmentEntity";
import { PgExportQueries } from "../../adapters/secondary/pg/PgExportQueries";
import { expectObjectsToMatch } from "../../_testBuilders/test.helpers";
import {
  avenueChampsElyseesDto,
  rueBitcheDto,
  rueJacquardDto,
} from "../../_testBuilders/addressDtos";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { AgencyDtoBuilder } from "shared";
import { ConventionDtoBuilder } from "shared";
import { PgConventionRepository } from "../../adapters/secondary/pg/PgConventionRepository";
import { PgOutboxRepository } from "../../adapters/secondary/pg/PgOutboxRepository";
import { DomainEvent } from "../../domain/core/eventBus/events";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { UuidV4Generator } from "../../adapters/secondary/core/UuidGeneratorImplementations";

describe("PgExportQueries", () => {
  let pool: Pool;
  let client: PoolClient;
  let establishmentAggregateRepository: PgEstablishmentAggregateRepository;
  let agencyRepository: PgAgencyRepository;
  let exportQueries: PgExportQueries;
  let conventionRepository: PgConventionRepository;
  let outboxRepository: PgOutboxRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM outbox");
    await client.query("DELETE FROM conventions");
    await client.query("DELETE FROM agencies");
    await client.query("DELETE FROM establishments");
    await client.query("DELETE FROM immersion_contacts");

    establishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      client,
    );
    agencyRepository = new PgAgencyRepository(client);
    exportQueries = new PgExportQueries(client);
    conventionRepository = new PgConventionRepository(client);
    outboxRepository = new PgOutboxRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe("Export view_establishments_with_flatten_offers", () => {
    describe("No filter specified", () => {
      it("Retrieves all establishments exports where data_source = form", async () => {
        // Prepare
        await establishmentAggregateRepository.insertEstablishmentAggregates([
          establishmentAggregateArtusInterim(),
          establishmentAggregateMiniWorldLyon(),
        ]);

        await refreshAllMaterializedViews(client);

        // Act
        const exportables = await exportQueries.getFromExportable({
          name: "establishments_with_flatten_offers",
          filters: {},
        });

        // Assert
        const expectedExportedRowWithSiret = {
          "Date de mise à jour": "05/01/2022",
          Siret: "79158476600012",
          "Raison Sociale": "ARTUS INTERIM LA ROCHE SUR YON",
          Enseigne: null,
          Adresse: "9 PL DE LA VENDEE",
          Ville: "LA ROCHE-SUR-YON",
          "Code Postal": "85000",
          Département: "Vendée",
          Région: "Pays de la Loire",
          NAF: "7820Z",
          "Division NAF": "Activités des agences de travail temporaire",
          "Nombre d’employés": "250-499",
          "Mode de contact": "Téléphone",
          "Appartenance Réseau « Les entreprises s’engagent »": "Oui",
          Visible: "Oui",
          Origine: "immersion-facile",
          "Code Métier": "M1502",
          Métier: "Développement des ressources humaines",
          "Nombre de mise en relation pour cette entreprise": "0",
          "Nombre de convention validée pour cette entreprise": "0",
        };

        expect(exportables["establishments_with_flatten_offers"]).toHaveLength(
          6,
        );
        const actualExportedRowWithSiret = exportables[
          "establishments_with_flatten_offers"
        ].find(
          (exportable) =>
            exportable.Siret === "79158476600012" &&
            exportable["Code Métier"] === "M1502",
        );
        expect(actualExportedRowWithSiret).toBeDefined();
        expectObjectsToMatch(
          actualExportedRowWithSiret!,
          expectedExportedRowWithSiret,
        );
      });
    });
    describe("Some filter specified", () => {
      it("Allow filtering on Origine", async () => {
        // Prepare
        await establishmentAggregateRepository.insertEstablishmentAggregates([
          establishmentAggregateArtusInterim(),
          establishmentAggregateMiniWorldLyon(),
        ]);
        await refreshAllMaterializedViews(client);

        // Act
        const exportables = await exportQueries.getFromExportable({
          name: "establishments_with_flatten_offers",
          filters: { Origine: "immersion-facile" },
        });

        // Assert
        expect(exportables["establishments_with_flatten_offers"]).toHaveLength(
          2,
        );
        expect(
          exportables["establishments_with_flatten_offers"].map(
            (row) => row["Origine"],
          ),
        ).toEqual(["immersion-facile", "immersion-facile"]);
      });
    });
  });

  describe("Export view_agencies", () => {
    describe("No filter specified", () => {
      it("Retrieves all agencies exports", async () => {
        // Prepare
        const agencyInRepo = new AgencyDtoBuilder()
          .withName("Agence de Jacquard")
          .withAddress(rueJacquardDto)
          .build();
        await agencyRepository.insert(agencyInRepo);

        // Act
        const exportables = await exportQueries.getFromExportable({
          name: "agencies",
          filters: {},
        });

        // Assert
        const expectedExportedRow = {
          id: agencyInRepo.id,
          Nom: "Agence de Jacquard",
          "Code Safir": null,
          Type: "autre",
          Statut: "active",
          Adresse: "2 RUE JACQUARD",
          "Code Postal": "69120",
          "Emails des conseillers": agencyInRepo.counsellorEmails,
          "Emails des valideurs": agencyInRepo.validatorEmails,
          Département: "Rhône",
          Région: "Auvergne-Rhône-Alpes",
        };
        expect(exportables["agencies"]).toHaveLength(1);
        expectObjectsToMatch(exportables["agencies"][0], expectedExportedRow);
      });
    });
  });
  describe("Export conventions", () => {
    describe("No filter specified", () => {
      it("Retrieves all conventions exports", async () => {
        // Prepare
        const conventionInRepo = new ConventionDtoBuilder().build();
        const conventionAgency = new AgencyDtoBuilder()
          .withId(conventionInRepo.agencyId)
          .withName("La super agence sur les champs")
          .withAddress(avenueChampsElyseesDto)
          .build();
        await agencyRepository.insert(conventionAgency);
        await conventionRepository.save(conventionInRepo);

        // Act
        const exportables = await exportQueries.getFromExportable({
          name: "conventions",
          filters: {},
        });

        const { beneficiary, mentor } = conventionInRepo.signatories;

        // Assert
        const expectedExportedRow = {
          "id convention": conventionInRepo.id,
          Structure: "La super agence sur les champs",
          "Type de structure": conventionAgency.kind,
          "Département de la structure": "Paris",
          "Région de la structure": "Île-de-France",
          "Date de validation": null,
          Statut: conventionInRepo.status,
          "Accepté par le bénéficiaire": "Oui",
          "Accepté par l'entreprise": "Oui",
          "Date de début": "06/01/2021",
          "Date de fin": "15/01/2021",
          "Durée de l'immersion": 70,
          "Objectif de l'immersion": conventionInRepo.immersionObjective,
          "Métier observé": "Pilote de machines d'abattage",
          "Conditions de travail particulières":
            conventionInRepo.workConditions ?? null,
          Activités: conventionInRepo.immersionActivities,
          "Compétences développées":
            "Utilisation des pneus optimale, gestion de carburant",
          Programme:
            "Heures de travail hebdomadaires : 35\n" +
            "lundi : libre\n" +
            "mardi : libre\n" +
            "mercredi : 08:00-12:00, 13:00-16:00\n" +
            "jeudi : 08:00-12:00, 13:00-16:00\n" +
            "vendredi : 08:00-12:00, 13:00-16:00\n" +
            "samedi : 08:00-12:00, 13:00-16:00\n" +
            "dimanche : 08:00-12:00, 13:00-16:00\n" +
            "Heures de travail hebdomadaires : 35\n" +
            "lundi : 08:00-12:00, 13:00-16:00\n" +
            "mardi : 08:00-12:00, 13:00-16:00\n" +
            "mercredi : 08:00-12:00, 13:00-16:00\n" +
            "jeudi : 08:00-12:00, 13:00-16:00\n" +
            "vendredi : 08:00-12:00, 13:00-16:00\n" +
            "samedi : libre\n" +
            "dimanche : libre",
          Bénéficiaire: beneficiary.firstName + " " + beneficiary.lastName,
          "Code Postal": "75010",
          "Email bénéficiaire": beneficiary.email,
          "Téléphone bénéficiaire": beneficiary.phone,
          "Contact d'urgence": beneficiary.emergencyContact,
          "Téléphone du contact d'urgence": beneficiary.emergencyContactPhone,
          "Protection individuelle": conventionInRepo.individualProtection,
          "Prévention sanitaire": conventionInRepo.sanitaryPrevention,
          "Descriptif des préventions sanitaires":
            conventionInRepo.sanitaryPreventionDescription,
          "Identifiant Externe Pole Emploi":
            beneficiary.federatedIdentity ?? null,
          Siret: conventionInRepo.siret,
          "Référencement IF": "Non",
          Entreprise: conventionInRepo.businessName,
          Tuteur: `${mentor.firstName} ${mentor.lastName} ${mentor.job}`,
          "Téléphone du tuteur": mentor.phone,
          "Email du tuteur": mentor.email,
        };
        expect(exportables["conventions"]).toHaveLength(1);
        expectObjectsToMatch(
          exportables["conventions"][0],
          expectedExportedRow,
        );
      });
    });
  });
  describe("Export view_contact_requests", () => {
    describe("No filter specified", () => {
      it("Retrieves all contact requests exports", async () => {
        // Prepare
        const establishmentAggregate = new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityV2Builder()
              .withAddress(rueBitcheDto)
              .build(),
          )
          .build();
        const contactEvent: DomainEvent = {
          id: new UuidV4Generator().new(),
          occurredAt: "2022-01-01T12:00:00.000Z",
          topic: "ContactRequestedByBeneficiary",
          payload: {
            contactMode: "EMAIL",
            message: "Hello!",
            potentialBeneficiaryEmail: "tom@cruise.com",
            potentialBeneficiaryFirstName: "Tom",
            potentialBeneficiaryLastName: "Cruise",
            romeLabel: "Stylisme",
            siret: establishmentAggregate.establishment.siret,
          },
          publications: [],
          wasQuarantined: false,
        };
        await establishmentAggregateRepository.insertEstablishmentAggregates([
          establishmentAggregate,
        ]);
        await outboxRepository.save(contactEvent);
        await refreshAllMaterializedViews(client);

        // Act
        const exportables = await exportQueries.getFromExportable({
          name: "contact_requests",
          filters: {},
        });

        // Assert
        const expectedExportedRow = {
          "Date de la mise en relation": "01/01/2022",
          "Type de mise en relation": "EMAIL",
          Email: "tom@cruise.com",
          Siret: "78000403200019",
          Métier: "Stylisme",
          "Code métier": "B1805",
          Département: "Loire-Atlantique",
          Région: "Pays de la Loire",
        };
        expect(exportables["contact_requests"]).toHaveLength(1);
        expectObjectsToMatch(
          exportables["contact_requests"][0],
          expectedExportedRow,
        );
      });
    });
  });
});

const establishmentAggregateArtusInterim = (): EstablishmentAggregate => ({
  establishment: new EstablishmentEntityV2Builder()
    .withSiret("79158476600012")
    .withAddress({
      streetNumberAndAddress: "9 PL DE LA VENDEE",
      city: "LA ROCHE-SUR-YON",
      postcode: "85000",
      departmentCode: "85",
    })
    .withName("ARTUS INTERIM LA ROCHE SUR YON")
    .withDataSource("form")
    .withSourceProvider("immersion-facile")
    .withNafDto({ code: "7820Z", nomenclature: "NAFRev2" })
    .withNumberOfEmployeeRange("250-499")
    .withIsCommited(true)
    .build(),
  immersionOffers: [
    new ImmersionOfferEntityV2Builder()
      .withRomeCode("M1502")
      .withAppellationCode("11863")
      .build(),
    new ImmersionOfferEntityV2Builder()
      .withRomeCode("A1205")
      .withAppellationCode("17537")
      .build(),
  ],
  contact: new ContactEntityV2Builder()
    .withFirstname("Lauren")
    .withLastname("SCHEBUR")
    .withEmail("contact@artusinterim.world")
    .withPhone("0358339542")
    .withContactMethod("PHONE")
    .build(),
});

const establishmentAggregateMiniWorldLyon = (): EstablishmentAggregate => ({
  establishment: new EstablishmentEntityV2Builder()
    .withSiret("79341726200037")
    .withAddress(rueJacquardDto)
    .withName("MINI WORLD LYON")
    .withDataSource("form")
    .withSourceProvider("cci")
    .withNafDto({ code: "9321Z", nomenclature: "NAFRev2" })
    .withNumberOfEmployeeRange("250-499")
    .withIsCommited(false)
    .build(),
  immersionOffers: [
    new ImmersionOfferEntityV2Builder()
      .withRomeCode("I1304")
      .withAppellationCode("19871")
      .build(),
    new ImmersionOfferEntityV2Builder()
      .withRomeCode("G1205")
      .withAppellationCode("10705")
      .build(),
    new ImmersionOfferEntityV2Builder()
      .withRomeCode("G1205")
      .withAppellationCode("10705")
      .build(),
    new ImmersionOfferEntityV2Builder()
      .withRomeCode("I1304")
      .withAppellationCode("19825")
      .build(),
  ],
  contact: new ContactEntityV2Builder()
    .withId("88401348-bad9-4933-87c6-405b8a8fe4bb")
    .withFirstname("Max")
    .withLastname("BOYBAR")
    .withEmail("rec@miniworld-lyon.com")
    .withPhone("0938339542")
    .withContactMethod("EMAIL")
    .build(),
});

const refreshAllMaterializedViews = async (client: PoolClient) => {
  const materializedViews = [
    "view_siret_with_department_region",
    "view_contact_requests",
    "view_establishments",
    "view_establishments_with_flatten_offers",
    "view_establishments_with_aggregated_offers",
  ];
  for (const materializedView of materializedViews) {
    await client.query(`REFRESH MATERIALIZED VIEW ${materializedView};`);
  }
};
