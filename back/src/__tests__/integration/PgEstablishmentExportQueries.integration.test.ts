import { Pool, PoolClient } from "pg";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { PgEstablishmentAggregateRepository } from "../../adapters/secondary/pg/PgEstablishmentAggregateRepository";
import { EstablishmentAggregate } from "../../domain/immersionOffer/entities/EstablishmentEntity";
import { EstablishmentEntityV2Builder } from "../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../_testBuilders/ImmersionOfferEntityV2Builder";
import { ContactEntityV2Builder } from "../../_testBuilders/ContactEntityV2Builder";
import { PgEstablishmentExportQueries } from "../../adapters/secondary/pg/PgEstablishmentExportQueries";
import { format } from "date-fns";
import { EstablishmentRawProps } from "../../domain/establishment/valueObjects/EstablishmentRawBeforeExportVO";

describe("PgEstablishmentExportQueries", () => {
  let pool: Pool;
  let client: PoolClient;
  let establishmentAggregateRepository: PgEstablishmentAggregateRepository;
  let establismentExportQueries: PgEstablishmentExportQueries;

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
    establismentExportQueries = new PgEstablishmentExportQueries(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe("Get establishments for export", () => {
    it("Retrieves all establishments exports where data_source = form", async () => {
      await establishmentAggregateRepository.insertEstablishmentAggregates([
        establishmentAggregateArtusInterim(),
        establishmentAggregateMiniWorldLyon(),
      ]);

      const establishmentsExportRaw =
        await establismentExportQueries.getAllEstablishmentsForExport();

      const expected: EstablishmentRawProps[] = [
        {
          address: "9 PL DE LA VENDEE 85000 LA ROCHE-SUR-YON",
          createdAt: format(new Date(), "dd/MM/yyyy"),
          customizedName: undefined,
          isCommited: true,
          nafCode: "7820Z",
          name: "ARTUS INTERIM LA ROCHE SUR YON",
          numberEmployeesRange: "250-499",
          preferredContactMethods: "PHONE",
          professions: "M1502 - Chargé / Chargée de recrutement",
          siret: "79158476600012",
          contactEmail: "contact@artusinterim.world",
          contactPhone: "0358339542",
        },
        {
          address: "9 PL DE LA VENDEE 85000 LA ROCHE-SUR-YON",
          createdAt: format(new Date(), "dd/MM/yyyy"),
          customizedName: undefined,
          isCommited: true,
          nafCode: "7820Z",
          name: "ARTUS INTERIM LA ROCHE SUR YON",
          numberEmployeesRange: "250-499",
          preferredContactMethods: "PHONE",
          professions: "A1205 - Ouvrier sylviculteur / Ouvrière sylvicutrice",
          siret: "79158476600012",
          contactEmail: "contact@artusinterim.world",
          contactPhone: "0358339542",
        },
        {
          address: "2 RUE JACQUARD 69120 VAULX-EN-VELIN",
          createdAt: format(new Date(), "dd/MM/yyyy"),
          customizedName: undefined,
          isCommited: false,
          nafCode: "9321Z",
          name: "MINI WORLD LYON",
          numberEmployeesRange: "250-499",
          preferredContactMethods: "EMAIL",
          professions:
            "I1304 - Technicien(ne) de maintenance industrielle polyvalente",
          siret: "79341726200037",
          contactEmail: "rec@miniworld-lyon.com",
          contactPhone: "0938339542",
        },
        {
          address: "2 RUE JACQUARD 69120 VAULX-EN-VELIN",
          createdAt: format(new Date(), "dd/MM/yyyy"),
          customizedName: undefined,
          isCommited: false,
          nafCode: "9321Z",
          name: "MINI WORLD LYON",
          numberEmployeesRange: "250-499",
          preferredContactMethods: "EMAIL",
          professions: "G1205 - Agent / Agente d'exploitation des attractions",
          siret: "79341726200037",
          contactEmail: "rec@miniworld-lyon.com",
          contactPhone: "0938339542",
        },
        {
          address: "2 RUE JACQUARD 69120 VAULX-EN-VELIN",
          createdAt: format(new Date(), "dd/MM/yyyy"),
          customizedName: undefined,
          isCommited: false,
          nafCode: "9321Z",
          name: "MINI WORLD LYON",
          numberEmployeesRange: "250-499",
          preferredContactMethods: "EMAIL",
          professions: "G1205 - Agent / Agente d'exploitation des attractions",
          siret: "79341726200037",
          contactEmail: "rec@miniworld-lyon.com",
          contactPhone: "0938339542",
        },
        {
          address: "2 RUE JACQUARD 69120 VAULX-EN-VELIN",
          createdAt: format(new Date(), "dd/MM/yyyy"),
          customizedName: undefined,
          isCommited: false,
          nafCode: "9321Z",
          name: "MINI WORLD LYON",
          numberEmployeesRange: "250-499",
          preferredContactMethods: "EMAIL",
          professions:
            "I1304 - Technicien(ne) maintenance d'équipnts de parcs d'attractions",
          siret: "79341726200037",
          contactEmail: "rec@miniworld-lyon.com",
          contactPhone: "0938339542",
        },
      ];

      expect(establishmentsExportRaw).toHaveLength(6);
      expect(establishmentsExportRaw).toStrictEqual(
        expect.arrayContaining<EstablishmentRawProps>(expected),
      );
    });

    it("Retrieves establishments with 'cci' sourceProvider exports where data_source = form", async () => {
      await establishmentAggregateRepository.insertEstablishmentAggregates([
        establishmentAggregateArtusInterim(),
        establishmentAggregateMiniWorldLyon(),
      ]);

      const establishmentsExportRaw =
        await establismentExportQueries.getEstablishmentsBySourceProviderForExport(
          "cci",
        );

      expect(establishmentsExportRaw).toHaveLength(4);
      expect(establishmentsExportRaw).toStrictEqual(
        expect.arrayContaining<EstablishmentRawProps>([
          {
            address: "2 RUE JACQUARD 69120 VAULX-EN-VELIN",
            createdAt: format(new Date(), "dd/MM/yyyy"),
            customizedName: undefined,
            isCommited: false,
            nafCode: "9321Z",
            name: "MINI WORLD LYON",
            numberEmployeesRange: "250-499",
            preferredContactMethods: "EMAIL",
            professions:
              "I1304 - Technicien(ne) de maintenance industrielle polyvalente",
            siret: "79341726200037",
            contactEmail: "rec@miniworld-lyon.com",
            contactPhone: "0938339542",
          },
          {
            address: "2 RUE JACQUARD 69120 VAULX-EN-VELIN",
            createdAt: format(new Date(), "dd/MM/yyyy"),
            customizedName: undefined,
            isCommited: false,
            nafCode: "9321Z",
            name: "MINI WORLD LYON",
            numberEmployeesRange: "250-499",
            preferredContactMethods: "EMAIL",
            professions:
              "G1205 - Agent / Agente d'exploitation des attractions",
            siret: "79341726200037",
            contactEmail: "rec@miniworld-lyon.com",
            contactPhone: "0938339542",
          },
          {
            address: "2 RUE JACQUARD 69120 VAULX-EN-VELIN",
            createdAt: format(new Date(), "dd/MM/yyyy"),
            customizedName: undefined,
            isCommited: false,
            nafCode: "9321Z",
            name: "MINI WORLD LYON",
            numberEmployeesRange: "250-499",
            preferredContactMethods: "EMAIL",
            professions:
              "G1205 - Agent / Agente d'exploitation des attractions",
            siret: "79341726200037",
            contactEmail: "rec@miniworld-lyon.com",
            contactPhone: "0938339542",
          },
          {
            address: "2 RUE JACQUARD 69120 VAULX-EN-VELIN",
            createdAt: format(new Date(), "dd/MM/yyyy"),
            customizedName: undefined,
            isCommited: false,
            nafCode: "9321Z",
            name: "MINI WORLD LYON",
            numberEmployeesRange: "250-499",
            preferredContactMethods: "EMAIL",
            professions:
              "I1304 - Technicien(ne) maintenance d'équipnts de parcs d'attractions",
            siret: "79341726200037",
            contactEmail: "rec@miniworld-lyon.com",
            contactPhone: "0938339542",
          },
        ]),
      );
    });
  });
});

const establishmentAggregateArtusInterim = (): EstablishmentAggregate => ({
  establishment: new EstablishmentEntityV2Builder()
    .withSiret("79158476600012")
    .withAddress("9 PL DE LA VENDEE 85000 LA ROCHE-SUR-YON")
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
    .withAddress("2 RUE JACQUARD 69120 VAULX-EN-VELIN")
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
