import { Pool, PoolClient } from "pg";
import { ContactEntityV2Builder } from "../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentEntityV2Builder } from "../../_testBuilders/EstablishmentEntityV2Builder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionOfferEntityV2Builder } from "../../_testBuilders/ImmersionOfferEntityV2Builder";
import { PgEstablishmentAggregateRepository } from "../../adapters/secondary/pg/PgEstablishmentAggregateRepository";
import { EstablishmentAggregate } from "../../domain/immersionOffer/entities/EstablishmentEntity";
import { PgExportQueries } from "../../adapters/secondary/pg/PgExportQueries";
import { expectObjectsToMatch } from "../../_testBuilders/test.helpers";
import { rueJacquardDto } from "../../_testBuilders/addressDtos";

describe("PgExportQueries", () => {
  let pool: Pool;
  let client: PoolClient;
  let establishmentAggregateRepository: PgEstablishmentAggregateRepository;
  let exportQueries: PgExportQueries;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM establishments");
    await client.query("DELETE FROM immersion_contacts");

    establishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      client,
    );
    exportQueries = new PgExportQueries(client);
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
          Visible: true,
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
