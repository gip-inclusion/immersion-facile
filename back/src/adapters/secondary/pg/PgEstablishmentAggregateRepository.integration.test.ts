import { DataSource } from "aws-sdk/clients/discovery";
import { Pool, PoolClient } from "pg";
import { prop, sortBy } from "ramda";
import {
  AddressDto,
  AppellationDto,
  ContactMethod,
  defaultMaxContactsPerWeek,
  expectArraysToEqualIgnoringOrder,
  expectObjectsToMatch,
  expectPromiseToFailWith,
  expectToEqual,
  expectTypeToMatchAndEqual,
  FormEstablishmentSource,
  GeoPositionDto,
  NumberEmployeesRange,
  SearchImmersionResultDto,
} from "shared";
import {
  rueBitcheDto,
  rueGuillaumeTellDto,
  rueJacquardDto,
} from "../../../_testBuilders/addressDtos";
import { ContactEntityBuilder } from "../../../_testBuilders/ContactEntityBuilder";
import { createDiscussionAggregate } from "../../../_testBuilders/DiscussionAggregateBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../../_testBuilders/EstablishmentEntityBuilder";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { SearchMade } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { PgDiscussionAggregateRepository } from "./PgDiscussionAggregateRepository";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";

const testUid1 = "11111111-a2a5-430a-b558-ed3e2f03512d";
const testUid2 = "22222222-a2a5-430a-b558-ed3e2f03512d";

describe("Postgres implementation of immersion offer repository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM immersion_contacts");
    await client.query("DELETE FROM discussions");
    await client.query("DELETE FROM establishments");

    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      client,
    );
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe("Pg implementation of method getSearchImmersionResultDtoFromSearchMade", () => {
    const informationGeographiqueRome = "M1808"; // "Information géographique"
    const analysteEnGeomatiqueAppellation = "10946";
    const cartographeAppellation = "11704";

    const searchedPosition = { lat: 49, lon: 6 };
    const notMatchingRome = "B1805";
    const farFromSearchedPosition = { lat: 32, lon: 89 };
    const searchMadeWithRome: SearchMade = {
      rome: informationGeographiqueRome,
      ...searchedPosition,
      distance_km: 30,
      sortedBy: "distance",
    };
    const searchMadeWithoutRome: SearchMade = {
      ...searchedPosition,
      distance_km: 30,
      sortedBy: "distance",
    };
    it("returns empty list when repo is empty", async () => {
      // Act
      const searchWithNoRomeResult =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          { searchMade: searchMadeWithRome },
        );
      // Assert
      expect(searchWithNoRomeResult).toHaveLength(0);
    });

    const insertActiveEstablishmentAndOfferAndEventuallyContact = async ({
      siret,
      rome,
      establishmentPosition,
      appellationCode,
      offerContactUid,
      dataSource = "form",
      sourceProvider = "immersion-facile",
      address,
      nafCode,
      numberEmployeesRange,
      offerCreatedAt,
      fitForDisabledWorkers,
    }: {
      siret: string;
      rome: string;
      establishmentPosition: GeoPositionDto;
      appellationCode?: string;
      offerContactUid?: string;
      dataSource?: DataSource;
      sourceProvider?: FormEstablishmentSource;
      address?: AddressDto;
      nafCode?: string;
      numberEmployeesRange?: NumberEmployeesRange;
      offerCreatedAt?: Date;
      fitForDisabledWorkers?: boolean;
    }) => {
      await insertEstablishment({
        siret,
        isActive: true,
        position: establishmentPosition,
        dataSource,
        sourceProvider,
        address,
        nafCode,
        numberEmployeesRange,
        fitForDisabledWorkers,
      });
      if (offerContactUid) {
        await insertImmersionContact({
          uuid: offerContactUid,
          siret_establishment: siret,
        });
      }
      await insertImmersionOffer({
        siret,
        romeCode: rome,
        romeAppellation: appellationCode,
        offerCreatedAt,
      });
    };
    describe("if parameter `maxResults` is given", () => {
      it("returns at most `maxResults` establishments", async () => {
        // Prepare
        /// Two establishments match
        await insertActiveEstablishmentAndOfferAndEventuallyContact(
          {
            siret: "78000403200029",
            rome: "A1101",
            establishmentPosition: searchedPosition,
          }, // Position matching
        );
        await insertActiveEstablishmentAndOfferAndEventuallyContact(
          {
            siret: "79000403200029",
            rome: "A1201",
            establishmentPosition: searchedPosition,
          }, // Position matching
        );

        // Act
        const searchResult: SearchImmersionResultDto[] =
          await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
            {
              searchMade: searchMadeWithoutRome,
              withContactDetails: false,
              maxResults: 1,
            },
          );

        // Assert : one match and defined contact details
        expect(searchResult).toHaveLength(1);
      });
    });
    describe("if no rome code is given", () => {
      it("returns all establishments within geographical area", async () => {
        // Prepare
        /// Two establishments located inside geographical area
        await insertActiveEstablishmentAndOfferAndEventuallyContact(
          {
            siret: "78000403200029",
            rome: "A1101",
            establishmentPosition: searchedPosition,
            appellationCode: "20404",
          }, // Appellation : Tractoriste agricole; Tractoriste agricole
        );
        await insertImmersionOffer({
          romeCode: "A1101", // Same rome and establishment as offer
          siret: "78000403200029",
          romeAppellation: "17751", // Appellation : Pilote de machines d'abattage;Pilote de machines d'abattage
        });

        await insertActiveEstablishmentAndOfferAndEventuallyContact(
          {
            siret: "79000403200029",
            rome: "A1201",
            establishmentPosition: searchedPosition,
            appellationCode: undefined,
          }, // No appellation given
        );
        /// Establishment oustide geographical area
        await insertActiveEstablishmentAndOfferAndEventuallyContact(
          {
            siret: "99000403200029",
            rome: "A1101",
            establishmentPosition: farFromSearchedPosition,
          }, // Position not matching
        );

        // Act
        const searchResult: SearchImmersionResultDto[] =
          await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
            { searchMade: searchMadeWithoutRome },
          );

        // Assert : one match and defined contact details
        expect(searchResult).toHaveLength(2);

        const expectedResult: Partial<SearchImmersionResultDto>[] = [
          {
            rome: "A1101",
            siret: "78000403200029",
            distance_m: 0,
            appellationLabels: [
              "Pilote de machines d'abattage",
              "Tractoriste agricole",
            ],
          },
          {
            rome: "A1201",
            siret: "79000403200029",
            distance_m: 0,
            appellationLabels: [],
          },
        ];

        expect(sortBy(prop("rome"), searchResult)).toMatchObject(
          expectedResult,
        );
      });
    });

    it("returns active establishments only", async () => {
      // Prepare : establishment in geographical area but not active
      const notActiveSiret = "78000403200029";

      await insertEstablishment({
        siret: notActiveSiret,
        isActive: false,
        position: searchedPosition,
      });
      await insertImmersionOffer({
        romeCode: informationGeographiqueRome,
        romeAppellation: undefined, // Appellation
        siret: notActiveSiret,
      });

      await insertImmersionOffer({
        romeCode: informationGeographiqueRome,
        romeAppellation: undefined, // Appellation
        siret: notActiveSiret,
      });

      // Act
      const searchWithNoRomeResult =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          { searchMade: searchMadeWithRome },
        );
      // Assert
      expect(searchWithNoRomeResult).toHaveLength(0);
    });

    it("returns searchable establishments only", async () => {
      // Prepare : establishment in geographical area but not active
      const notSearchableSiret = "78000403200029";

      await insertEstablishment({
        siret: notSearchableSiret,
        isSearchable: false,
        position: searchedPosition,
      });
      await insertImmersionOffer({
        romeCode: informationGeographiqueRome,
        romeAppellation: undefined, // Appellation
        siret: notSearchableSiret,
      });

      await insertImmersionOffer({
        romeCode: informationGeographiqueRome,
        romeAppellation: undefined, // Appellation
        siret: notSearchableSiret,
      });

      // Act
      const searchWithNoRomeResult =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          { searchMade: searchMadeWithRome },
        );
      // Assert
      expect(searchWithNoRomeResult).toHaveLength(0);
    });

    it("returns one search DTO by establishment, with offers matching rome and geographical area", async () => {
      // Prepare
      /// Establishment with offer inside geographical area with searched rome
      const siretMatchingToSearch = "78000403200029";
      const matchingEstablishmentAddress = rueBitcheDto;
      const matchingNaf = "8622B";
      const matchingNumberOfEmployeeRange = "1-2";
      const matchingNafLabel = "Activité des médecins spécialistes";
      await insertActiveEstablishmentAndOfferAndEventuallyContact({
        siret: siretMatchingToSearch,
        rome: informationGeographiqueRome,
        establishmentPosition: searchedPosition,
        appellationCode: cartographeAppellation,
        offerContactUid: undefined,
        dataSource: "form",
        sourceProvider: "immersion-facile",
        address: matchingEstablishmentAddress,
        nafCode: matchingNaf,
        numberEmployeesRange: matchingNumberOfEmployeeRange,
        fitForDisabledWorkers: true,
      });

      await insertImmersionOffer({
        siret: siretMatchingToSearch,
        romeCode: informationGeographiqueRome,
        romeAppellation: analysteEnGeomatiqueAppellation,
      });

      /// Establishment with offer inside geographical area but an other rome
      await insertActiveEstablishmentAndOfferAndEventuallyContact({
        siret: "88000403200029",
        rome: notMatchingRome,
        establishmentPosition: searchedPosition,
      });

      // Establishment with offer with searched rome but oustide geographical area
      await insertActiveEstablishmentAndOfferAndEventuallyContact({
        siret: "99000403200029",
        rome: informationGeographiqueRome,
        establishmentPosition: farFromSearchedPosition,
      });

      // Act
      const searchResult: SearchImmersionResultDto[] =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          { searchMade: searchMadeWithRome },
        );

      // Assert : one match and defined contact details
      expect(searchResult).toHaveLength(1);

      const expectedResult: Partial<SearchImmersionResultDto> = {
        rome: informationGeographiqueRome,
        romeLabel: "Information géographique",
        appellationLabels: ["Analyste en géomatique", "Cartographe"],
        siret: siretMatchingToSearch,
        distance_m: 0,
        voluntaryToImmersion: true,
        contactMode: undefined,
        address: matchingEstablishmentAddress,
        numberOfEmployeeRange: "1-2",
        naf: matchingNaf,
        nafLabel: matchingNafLabel,
        position: searchedPosition,
        fitForDisabledWorkers: true,
      };

      expect(searchResult).toMatchObject([expectedResult]);
    });
    it("returns Form establishments before LBB establishments", async () => {
      // Prepare : establishment in geographical area but not active
      const formSiret = "99000403200029";
      const lbbSiret1 = "11000403200029";

      await insertActiveEstablishmentAndOfferAndEventuallyContact(
        {
          siret: lbbSiret1,
          rome: informationGeographiqueRome,
          establishmentPosition: searchedPosition,
          appellationCode: cartographeAppellation,
          offerContactUid: undefined,
          dataSource: "api_labonneboite",
        }, // data source
      );

      await insertActiveEstablishmentAndOfferAndEventuallyContact(
        {
          siret: formSiret,
          rome: informationGeographiqueRome,
          establishmentPosition: searchedPosition,
          appellationCode: cartographeAppellation,
          offerContactUid: undefined,
          dataSource: "form",
        }, // data source
      );

      // Act
      const searchResult =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          { searchMade: searchMadeWithRome, maxResults: 2 },
        );
      // Assert
      expect(searchResult).toHaveLength(2);
      expect(searchResult[0].siret).toEqual(formSiret);
      expect(searchResult[0].voluntaryToImmersion).toBe(true);
      expect(searchResult[1].siret).toEqual(lbbSiret1);
      expect(searchResult[1].voluntaryToImmersion).toBe(false);
    });
    it("if sorted=distance, returns closest establishments in first", async () => {
      // Prepare : establishment in geographical area but not active
      const closeSiret = "99000403200029";
      const farSiret = "11000403200029";

      await insertEstablishment({
        siret: closeSiret,
        position: searchedPosition,
      });
      await insertEstablishment({
        siret: farSiret,
        position: {
          lon: searchedPosition.lon + 0.01,
          lat: searchedPosition.lat + 0.01,
        },
      });
      await insertImmersionOffer({
        romeCode: searchMadeWithRome.rome!,
        siret: closeSiret,
      });
      await insertImmersionOffer({
        romeCode: searchMadeWithRome.rome!,
        siret: farSiret,
      });
      // Act
      const searchResult =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          {
            searchMade: { ...searchMadeWithRome, sortedBy: "distance" },
            maxResults: 2,
          },
        );
      // Assert
      expect(searchResult[0].siret).toEqual(closeSiret);
      expect(searchResult[1].siret).toEqual(farSiret);
    });
    it("if sorted=date, returns latest offers in first", async () => {
      // Prepare : establishment in geographical area but not active
      const recentOfferSiret = "99000403200029";
      const oldOfferSiret = "11000403200029";

      await Promise.all([
        insertEstablishment({
          siret: recentOfferSiret,
          position: searchedPosition,
        }),
        insertEstablishment({
          siret: oldOfferSiret,
          position: searchedPosition,
        }),
      ]);

      await Promise.all([
        insertImmersionOffer({
          romeCode: searchMadeWithRome.rome!,
          siret: recentOfferSiret,
          offerCreatedAt: new Date("2022-05-05"),
        }),
        insertImmersionOffer({
          romeCode: searchMadeWithRome.rome!,
          siret: oldOfferSiret,
          offerCreatedAt: new Date("2022-05-02"),
        }),
      ]);

      // Act
      const searchResult =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          {
            searchMade: { ...searchMadeWithRome, sortedBy: "date" },
            maxResults: 2,
          },
        );
      // Assert
      expect(searchResult[0].siret).toEqual(recentOfferSiret);
      expect(searchResult[1].siret).toEqual(oldOfferSiret);
    });
    it("returns also contact details if offer has contact uuid and flag is True", async () => {
      // Prepare
      /// Establishment with offer inside geographical area with searched rome
      const siretMatchingToSearch = "78000403200029";
      const contactUidOfOfferMatchingSearch = testUid1;

      await insertActiveEstablishmentAndOfferAndEventuallyContact({
        siret: siretMatchingToSearch,
        rome: informationGeographiqueRome,
        establishmentPosition: searchedPosition,
        appellationCode: undefined,
        offerContactUid: contactUidOfOfferMatchingSearch,
      });

      // With multiple contacts
      await insertImmersionContact({
        uuid: testUid2,
        lastName: "Dupont",
        email: "jean@dupont",
        siret_establishment: siretMatchingToSearch,
      });

      // Act
      const searchResult: SearchImmersionResultDto[] =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          { searchMade: searchMadeWithRome, withContactDetails: true },
        );

      // Assert : one match and defined contact details
      expect(searchResult).toHaveLength(1);
      expect(searchResult[0].contactDetails?.id).toEqual(
        contactUidOfOfferMatchingSearch,
      );
    });
    it("if sorted is not given, returns establishments from form in first (in random order)", async () => {
      // Prepare : establishment
      const fromFormSiret = "99000403200029";
      const fromLBBSiret = "11000403200029";

      await Promise.all([
        insertEstablishment({
          position: searchedPosition,
          siret: fromFormSiret,
          dataSource: "form",
        }),
        insertEstablishment({
          position: searchedPosition,
          siret: fromLBBSiret,
          dataSource: "api_labonneboite",
        }),
      ]);

      await Promise.all([
        insertImmersionOffer({
          romeCode: searchMadeWithRome.rome!,
          siret: fromFormSiret,
        }),
        await insertImmersionOffer({
          romeCode: searchMadeWithRome.rome!,
          siret: fromLBBSiret,
        }),
      ]);
      // Act
      const searchResult =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          {
            searchMade: {
              ...searchMadeWithRome,
              sortedBy: "distance",
              voluntaryToImmersion: undefined,
            },
            maxResults: 2,
          },
        );
      // Assert
      expect(searchResult).toHaveLength(2);
      expect(searchResult[0].siret).toEqual(fromFormSiret);
      expect(searchResult[1].siret).toEqual(fromLBBSiret);
    });
    it("returns only form establishments if voluntaryOnly is true", async () => {
      // Prepare : establishment in geographical area but not active
      const formSiret = "11000403200029";
      const lbbSiret = "22000403200029";

      await Promise.all([
        insertEstablishment({
          siret: formSiret,
          isActive: true,
          position: searchedPosition,
          dataSource: "form",
        }),
        insertEstablishment({
          siret: lbbSiret,
          isActive: true,
          position: searchedPosition,
          dataSource: "api_labonneboite",
        }),
      ]);
      await Promise.all([
        insertImmersionOffer({
          romeCode: informationGeographiqueRome,
          siret: formSiret,
        }),

        insertImmersionOffer({
          romeCode: informationGeographiqueRome,
          siret: lbbSiret,
        }),
      ]);
      // Act
      const searchWithVoluntaryOnly =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
          {
            searchMade: { ...searchMadeWithRome, voluntaryToImmersion: true },
          },
        );
      // Assert
      expect(searchWithVoluntaryOnly).toHaveLength(1);
      expect(searchWithVoluntaryOnly[0].siret).toEqual(formSiret);
    });
  });

  describe("Pg implementation of method updateEstablishment", () => {
    const position = { lon: 2, lat: 3 };
    it("Updates the parameter `updatedAt`, `fitForDisabledWorkers` and `isActive if given", async () => {
      // Prepare
      const siretOfEstablishmentToUpdate = "78000403200021";

      await insertEstablishment({
        siret: siretOfEstablishmentToUpdate,
        updatedAt: new Date("2020-04-14T12:00:00.000"),
        isActive: true,
        fitForDisabledWorkers: false,
        position,
      });

      // Act
      const updatedAt = new Date("2020-05-15T12:00:00.000");
      await pgEstablishmentAggregateRepository.updateEstablishment({
        siret: siretOfEstablishmentToUpdate,
        isActive: false,
        fitForDisabledWorkers: true,
        updatedAt,
      });

      // Assert
      const establishmentRowInDB = await retrieveEstablishmentWithSiret(
        siretOfEstablishmentToUpdate,
      );

      expectObjectsToMatch(establishmentRowInDB, {
        is_active: false,
        update_date: updatedAt,
        fit_for_disabled_workers: true,
      });
    });

    it("updates parameters `nafDto`, `nb of employe`, `address` and `position` if given and `updatedAt`", async () => {
      // Prepare
      const siretOfEstablishmentToUpdate = "78000403200021";

      const updateProps: Pick<
        EstablishmentEntity,
        "address" | "nafDto" | "numberEmployeesRange" | "position"
      > = {
        nafDto: { code: "8722B", nomenclature: "nomenc" },
        numberEmployeesRange: "1-2",
        position: { lon: 21, lat: 23 },
        address: rueBitcheDto,
      };
      await insertEstablishment({
        siret: siretOfEstablishmentToUpdate,
        updatedAt: new Date("2020-04-14T12:00:00.000"),
        isActive: true,
        position,
      });

      // Act
      const updatedAt = new Date("2020-05-15T12:00:00.000");
      await pgEstablishmentAggregateRepository.updateEstablishment({
        ...updateProps,
        siret: siretOfEstablishmentToUpdate,
        updatedAt,
      });

      // Assert
      const actualEstablishmentRowInDB = await retrieveEstablishmentWithSiret(
        siretOfEstablishmentToUpdate,
      );
      const partialExpectedEstablishmentRowInDB: Partial<PgEstablishmentRowWithGeo> =
        {
          update_date: updatedAt,
          naf_code: updateProps.nafDto.code,
          naf_nomenclature: updateProps.nafDto.nomenclature,
          number_employees: updateProps.numberEmployeesRange,
          street_number_and_address: updateProps.address.streetNumberAndAddress,
          city: updateProps.address.city,
          post_code: updateProps.address.postcode,
          department_code: updateProps.address.departmentCode,
          longitude: updateProps.position.lon,
          latitude: updateProps.position.lat,
        };
      expect(actualEstablishmentRowInDB).toMatchObject(
        partialExpectedEstablishmentRowInDB,
      );
    });
  });

  describe("pg implementation of method insertEstablishmentAggregates", () => {
    const siret1 = "11111111111111";
    const siret2 = "22222222222222";
    describe("create new establishments", () => {
      it("does nothing if empty list given", async () => {
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates(
          [],
        );
        expect(await getAllEstablishmentsRows()).toHaveLength(0);
      });
      it("adds the establishment values in `establishments` table when one new establishment is given", async () => {
        // Prepare
        const establishmentToInsert = new EstablishmentEntityBuilder()
          .withMaxContactsPerWeek(7)
          .build();

        // Act;
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withEstablishment(establishmentToInsert)
            .build(),
        ]);

        // Assert
        const expectedEstablishmentRow: Partial<PgEstablishmentRow> = {
          siret: establishmentToInsert.siret,
          name: establishmentToInsert.name,
          customized_name: establishmentToInsert.customizedName ?? null,
          is_commited: establishmentToInsert.isCommited ?? null,
          street_number_and_address:
            establishmentToInsert.address.streetNumberAndAddress,
          post_code: establishmentToInsert.address.postcode,
          city: establishmentToInsert.address.city,
          department_code: establishmentToInsert.address.departmentCode,
          number_employees: establishmentToInsert.numberEmployeesRange,
          naf_code: establishmentToInsert.nafDto.code,
          naf_nomenclature: establishmentToInsert.nafDto.nomenclature,
          data_source: establishmentToInsert.dataSource,
          update_date: establishmentToInsert.updatedAt,
          is_active: establishmentToInsert.isActive,
          max_contacts_per_week: establishmentToInsert.maxContactsPerWeek,
        };
        const actualEstablishmentRows = await getAllEstablishmentsRows();
        expect(actualEstablishmentRows).toHaveLength(1);
        expect(actualEstablishmentRows[0]).toMatchObject(
          expectedEstablishmentRow,
        );
      });
      it("adds one new row per establishment in `establishments` table when multiple establishments are given", async () => {
        // Act
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret1)
            .withImmersionOffers([new ImmersionOfferEntityV2Builder().build()])
            .build(),
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret2)
            .withImmersionOffers([new ImmersionOfferEntityV2Builder().build()])
            .withGeneratedContactId()
            .build(),
        ]);
        // Assert
        const establishmentsRows = await getAllEstablishmentsRows();
        expect(establishmentsRows).toHaveLength(2);
        expect(establishmentsRows.map((row) => row.siret)).toEqual([
          siret1,
          siret2,
        ]);
      });
      it("adds a new row in contact table with contact referencing the establishment siret", async () => {
        // Prepare
        const contactId = "3ca6e619-d654-4d0d-8fa6-2febefbe953d";
        const contact = new ContactEntityBuilder()
          .withId(contactId)
          .withContactMethod("EMAIL")
          .build();

        // Act
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret1)
            .withContact(contact)
            .build(),
        ]);

        // Assert
        const actualImmersionContactRows = await getAllImmersionContactsRows();
        expect(actualImmersionContactRows).toHaveLength(1);
        const expectedImmersionContactRow: PgImmersionContactWithSiretRow = {
          uuid: contact.id,
          email: contact.email,
          phone: contact.phone,
          lastname: contact.lastName,
          firstname: contact.firstName,
          job: contact.job,
          establishment_siret: siret1,
          contact_mode: "EMAIL",
          copy_emails: contact.copyEmails,
        };
        expect(actualImmersionContactRows[0]).toMatchObject(
          expectedImmersionContactRow,
        );
      });
      it("adds as many row as immersion offers in table `immersion_offers`, each referencing the establishment siret and the contact uuid", async () => {
        // Act
        const offer1 = new ImmersionOfferEntityV2Builder()
          .withRomeCode("A1101")
          .build();
        const offer2 = new ImmersionOfferEntityV2Builder()
          .withRomeCode("A1201")
          .build();

        const contactId = "3ca6e619-d654-4d0d-8fa6-2febefbe953d";
        const establishmentAggregateToInsert =
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret1)
            .withImmersionOffers([offer1, offer2])
            .withContactId(contactId)
            .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          establishmentAggregateToInsert,
        ]);

        // Assert
        const actualImmersionOfferRows = await getAllImmersionOfferRows();
        expect(actualImmersionOfferRows).toHaveLength(2);

        const expectedFirstImmersionOfferRow: Partial<PgImmersionOfferRow> = {
          rome_code: offer1.romeCode,
          score: offer1.score,
          siret: siret1,
        };
        expect(actualImmersionOfferRows[0]).toMatchObject(
          expectedFirstImmersionOfferRow,
        );
      });
    });
    describe("when the establishment siret already exists and active", () => {
      const existingSiret = "88888888888888";
      const existingUpdateAt = new Date("2021-01-01T10:10:00.000Z");
      const existingEstablishmentAddress = rueGuillaumeTellDto;
      const insertExistingEstablishmentWithDataSource = async (
        dataSource: DataSource,
      ) => {
        await insertEstablishment({
          siret: existingSiret,
          isActive: true,
          position: { lat: 88, lon: 3 },
          address: existingEstablishmentAddress,
          nafCode: "1032Z",
          numberEmployeesRange: "1-2",
          updatedAt: existingUpdateAt,
          dataSource,
        });
      };
      describe("existing establishment's data source is `form` and new data source is `api_labonneboite`", () => {
        it("adds a new offer with source `api_labonneboite` and contact_uid null (even if an offer with same rome and siret already exists)", async () => {
          // Prepare : this establishment has once been inserted with an offer through source `form`
          const offer1Rome = "A1101";
          await insertExistingEstablishmentWithDataSource("form");
          await insertImmersionOffer({
            romeCode: offer1Rome,
            siret: existingSiret,
          });

          // Act : An aggregate with same siret and rome offer needs to be inserted from source `api_labonneboite`
          const offer2Rome = "A1201";
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregates(
            [
              new EstablishmentAggregateBuilder()
                .withEstablishment(
                  new EstablishmentEntityBuilder()
                    .withSiret(existingSiret)
                    .withDataSource("api_labonneboite")
                    .withAddress({
                      streetNumberAndAddress: "LBB address should be ignored",
                      postcode: "",
                      city: "",
                      departmentCode: "",
                    })
                    .build(),
                )
                .withImmersionOffers([
                  new ImmersionOfferEntityV2Builder()
                    .withRomeCode(offer2Rome)
                    .build(),
                ])
                .build(),
            ],
          );

          // Assert : establishment is not updated, but
          /// Update date and address should not have changed
          const actualEstablishmentRowInDB = await getEstablishmentsRowsBySiret(
            existingSiret,
          );
          expect(actualEstablishmentRowInDB?.update_date).toEqual(
            existingUpdateAt,
          );
          expect(actualEstablishmentRowInDB?.street_number_and_address).toEqual(
            existingEstablishmentAddress.streetNumberAndAddress,
          );

          /// Offer should have been added
          const actualImmersionOfferRows = await getAllImmersionOfferRows();
          expect(actualImmersionOfferRows).toHaveLength(2);
          expect(actualImmersionOfferRows[0]?.rome_code).toEqual(offer1Rome);
          expect(actualImmersionOfferRows[1]?.rome_code).toEqual(offer2Rome);

          // /// Contact should not have been added
          // expect(await getAllImmersionContactsRows()).toHaveLength(0); // TODO : fix me ?
        });
      });
      describe("existing establishment's data source is `api_labonneboite` and new data source is also `api_labonneboite`", () => {
        it("updates the data in the establishments table", async () => {
          // Prepare
          await insertExistingEstablishmentWithDataSource("api_labonneboite");

          // Act
          const newAddress = rueBitcheDto;
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregates(
            [
              new EstablishmentAggregateBuilder()
                .withEstablishment(
                  new EstablishmentEntityBuilder()
                    .withSiret(existingSiret)
                    .withAddress(newAddress)
                    .withDataSource("api_labonneboite")
                    .build(),
                )
                .withImmersionOffers([
                  new ImmersionOfferEntityV2Builder().build(),
                ])
                .build(),
            ],
          );
          // Assert
          /// Address (amongst other fields) should have been updated
          expect(
            (await getEstablishmentsRowsBySiret(existingSiret))
              ?.street_number_and_address,
          ).toEqual(newAddress.streetNumberAndAddress);
          expect(
            (await getEstablishmentsRowsBySiret(existingSiret))?.post_code,
          ).toEqual(newAddress.postcode);
          /// Offer should have been added
          expect(await getAllImmersionOfferRows()).toHaveLength(1);
        });
      });
      describe("existing establishment's data source is `api_labonneboite` and new data source is `form`", () => {
        it("updates the data in the establishments table (dataSource, ...), contact table and adds the offers (no matter if same rome, siret already has offer) .", async () => {
          // Prepare : an establishment with offer rome A1101 and no contact has previously been inserted by source La Bonne Boite
          const offerRome = "A1101";
          await insertExistingEstablishmentWithDataSource("api_labonneboite");
          await insertImmersionOffer({
            romeCode: offerRome,
            siret: existingSiret,
          });
          // Act : an establishment aggregate with this siret is inserted by source Form
          await pgEstablishmentAggregateRepository.insertEstablishmentAggregates(
            [
              new EstablishmentAggregateBuilder()
                .withEstablishment(
                  new EstablishmentEntityBuilder()
                    .withSiret(existingSiret)
                    .withDataSource("form")
                    .build(),
                )
                .withImmersionOffers([
                  new ImmersionOfferEntityV2Builder().build(),
                ])
                .build(),
            ],
          );
          // Assert
          /// Data Source (amongst other fields) should have been updated
          expect(
            (await getEstablishmentsRowsBySiret(existingSiret))?.data_source,
          ).toBe("form");
          /// Offer should have been added
          const allImmersionOffeRows = await getAllImmersionOfferRows();
          expect(allImmersionOffeRows).toHaveLength(2);
        });
      });
    });
  });

  describe("Pg implementation of method hasEstablishmentFromFormWithSiret", () => {
    const siret = "12345678901234";
    it("returns false if no establishment from form with given siret exists", async () => {
      // Prepare
      await insertEstablishment({
        siret,
        dataSource: "api_labonneboite",
      });
      // Act and assert
      expect(
        await pgEstablishmentAggregateRepository.hasEstablishmentFromFormWithSiret(
          siret,
        ),
      ).toBe(false);
    });
    it("returns true if an establishment from form with given siret exists", async () => {
      // Prepare
      await insertEstablishment({
        siret,
        dataSource: "form",
      });
      // Act and assert
      expect(
        await pgEstablishmentAggregateRepository.hasEstablishmentFromFormWithSiret(
          siret,
        ),
      ).toBe(true);
    });
  });

  describe("Pg implementation of method getSiretsOfEstablishmentsWithRomeCode", () => {
    it("Returns a list of establishment sirets that have an offer with given rome", async () => {
      // Prepare
      const romeCode = "A1101";
      const siretWithRomeCodeOffer = "11111111111111";
      const siretWithoutRomeCodeOffer = "22222222222222";
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siretWithRomeCodeOffer)
          .withImmersionOffers([
            new ImmersionOfferEntityV2Builder().withRomeCode(romeCode).build(),
          ])
          .build(),
        new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siretWithoutRomeCodeOffer)
          .withContactId("12233432-1111-2222-3333-123456789123")
          .build(),
      ]);

      // Act
      const actualSiretOfEstablishmentsWithRomeCode =
        await pgEstablishmentAggregateRepository.getSiretsOfEstablishmentsWithRomeCode(
          romeCode,
        );
      // Assert
      expect(actualSiretOfEstablishmentsWithRomeCode).toEqual([
        siretWithRomeCodeOffer,
      ]);
    });
  });
  describe("Pg implementation of method createImmersionOffersToEstablishments", () => {
    it("Creates offer related to an establishment siret", async () => {
      // Prepare : create establishment
      const siret = "1234567890123";
      const newOffer = new ImmersionOfferEntityV2Builder().build();
      await insertEstablishment({ siret });
      // Act
      await pgEstablishmentAggregateRepository.createImmersionOffersToEstablishments(
        [{ ...newOffer, siret }],
      );
      // Assert : establishment aggregate has a new offer
      const updatedAggregate =
        await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
          siret,
        );
      expect(updatedAggregate?.immersionOffers).toEqual([newOffer]);
    });
  });
  describe("Pg implementation of method removeEstablishmentAndOffersWithSiret", () => {
    it("Removes only establishment with given siret and its offers", async () => {
      // Prepare
      const siretToRemove = "11111111111111";
      const siretToKeep = "22222222222222";

      await Promise.all([
        insertEstablishment({
          siret: siretToRemove,
        }),
        insertEstablishment({
          siret: siretToKeep,
        }),
      ]);
      await Promise.all([
        insertImmersionOffer({
          romeCode: "A1401",
          siret: siretToRemove,
        }),
        insertImmersionOffer({
          romeCode: "A1405",
          siret: siretToRemove,
        }),
        insertImmersionOffer({
          romeCode: "A1405",
          siret: siretToKeep,
        }),
      ]);

      // Act
      await pgEstablishmentAggregateRepository.removeEstablishmentAndOffersAndContactWithSiret(
        siretToRemove,
      );
      // Assert
      //   Establishment has been removed
      expect(await getEstablishmentsRowsBySiret(siretToRemove)).toBeUndefined();
      expect(await getEstablishmentsRowsBySiret(siretToKeep)).toBeDefined();
      //   Offers of this establishment have been removed
      const immersionOfferRows = await getAllImmersionOfferRows();
      expect(immersionOfferRows).toHaveLength(1);
      expect(immersionOfferRows[0].siret).toEqual(siretToKeep);
    });
  });

  describe("Pg implementation of method  getOffersAsAppelationDtoForFormEstablishment", () => {
    const siretInTable = "12345678901234";
    const establishment = new EstablishmentEntityBuilder()
      .withSiret(siretInTable)
      .withAddress(rueGuillaumeTellDto)
      .build();
    const contact = new ContactEntityBuilder()
      .withEmail("toto@gmail.com")
      .build();
    const offers = [
      new ImmersionOfferEntityV2Builder()
        .withRomeCode("A1101") // Code only, no appellation
        .withAppellationCode("11987")
        .build(),
      new ImmersionOfferEntityV2Builder()
        .withRomeCode("A1101")
        .withAppellationCode("12862")
        .build(),
    ];
    beforeEach(async () => {
      const aggregate = new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withImmersionOffers(offers)
        .build();
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
        aggregate,
      ]);
    });
    it("returns an empty list if no establishment found with this siret", async () => {
      const siretNotInTable = "11111111111111";

      expect(
        await pgEstablishmentAggregateRepository.getOffersAsAppelationDtoForFormEstablishment(
          siretNotInTable,
        ),
      ).toHaveLength(0);
    });
    it("returns a list with offers from offers as AppellationDto of given siret", async () => {
      const expectedOffersAsAppelationDto: AppellationDto[] = [
        {
          romeCode: offers[0].romeCode,
          romeLabel: "Conduite d'engins agricoles et forestiers",
          appellationCode: offers[0].appellationCode!.toString(),
          appellationLabel: "Chauffeur / Chauffeuse de machines agricoles",
        },
        {
          romeCode: offers[1].romeCode,
          romeLabel: "Conduite d'engins agricoles et forestiers",
          appellationCode: offers[1].appellationCode!.toString(),
          appellationLabel: "Conducteur / Conductrice d'abatteuses",
        },
      ];
      const actualOffersAsAppelationDto =
        await pgEstablishmentAggregateRepository.getOffersAsAppelationDtoForFormEstablishment(
          siretInTable,
        );
      expectArraysToEqualIgnoringOrder(
        actualOffersAsAppelationDto,
        expectedOffersAsAppelationDto,
      );
    });
  });
  describe("Pg implementation of method getSearchImmersionResultDtoBySiretAndRome", () => {
    it("Returns undefined when no matching establishment", async () => {
      const siretNotInTable = "11111111111111";

      expect(
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySiretAndRome(
          siretNotInTable,
          "A1401",
        ),
      ).toBeUndefined();
    });
    it("Returns reconstructed SearchImmersionResultDto for given siret and rome when appellation is specified", async () => {
      // Prepare
      const siret = "12345678901234";
      const boulangerRome = "D1102";
      const establishment = new EstablishmentEntityBuilder()
        .withSiret(siret)
        .withCustomizedName("La boulangerie de Lucie")
        .withNafDto({ code: "1071Z", nomenclature: "NAFRev2" })
        .withAddress(rueJacquardDto)
        .build();
      const boulangerOffer1 = new ImmersionOfferEntityV2Builder()
        .withRomeCode(boulangerRome)
        .withAppellationCode("10868") // Aide-boulanger / Aide-boulangère
        .build();
      const boulangerOffer2 = new ImmersionOfferEntityV2Builder()
        .withRomeCode(boulangerRome)
        .withAppellationCode("12006") // Chef boulanger / boulangère
        .build();
      const otherOffer = new ImmersionOfferEntityV2Builder()
        .withRomeCode("H2102")
        .build();
      const contact = new ContactEntityBuilder()
        .withGeneratedContactId()
        .build();

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(establishment)
          .withImmersionOffers([boulangerOffer1, boulangerOffer2, otherOffer])
          .withContact(contact)
          .build(),
      ]);

      // Act
      const actualSearchResultDto =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySiretAndRome(
          siret,
          boulangerRome,
        );
      // Assert
      expectToEqual(actualSearchResultDto, {
        rome: boulangerRome,
        romeLabel: "Boulangerie - viennoiserie",
        appellationLabels: [
          "Aide-boulanger / Aide-boulangère",
          "Chef boulanger / boulangère",
        ],
        naf: establishment.nafDto.code,
        nafLabel: "Fabrication de pain et de pâtisserie fraîche",
        siret,
        name: establishment.name,
        customizedName: establishment.customizedName,
        website: establishment.website,
        additionalInformation: establishment.additionalInformation,
        voluntaryToImmersion: establishment.voluntaryToImmersion,
        fitForDisabledWorkers: establishment.fitForDisabledWorkers,
        position: establishment.position,
        address: establishment.address,
        numberOfEmployeeRange: establishment.numberEmployeesRange,
        contactMode: contact.contactMethod,
        distance_m: undefined,
        // contactDetails: undefined,
      });
    });
    it("Returns reconstructed SearchImmersionResultDto for given siret and rome when no appellation and no contact is specified", async () => {
      // Prepare
      const siret = "12345678901234";
      const establishment = new EstablishmentEntityBuilder()
        .withSiret(siret)
        .withCustomizedName("La boulangerie de Lucie")
        .withNafDto({ code: "1071Z", nomenclature: "NAFRev2" })
        .withAddress(rueJacquardDto)
        .build();
      const offerWithRomeButNoAppellation = new ImmersionOfferEntityV2Builder()
        .withRomeCode("H2102")
        .build();
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(establishment)
          .withImmersionOffers([offerWithRomeButNoAppellation])
          .withoutContact()
          .build(),
      ]);

      // Act
      const actualSearchResultDto =
        await pgEstablishmentAggregateRepository.getSearchImmersionResultDtoBySiretAndRome(
          siret,
          "H2102",
        );

      // Assert
      expectTypeToMatchAndEqual(actualSearchResultDto, {
        rome: "H2102",
        romeLabel: "Conduite d'équipement de production alimentaire",
        appellationLabels: [],
        naf: establishment.nafDto.code,
        nafLabel: "Fabrication de pain et de pâtisserie fraîche",
        siret,
        name: establishment.name,
        customizedName: establishment.customizedName,
        website: establishment.website,
        additionalInformation: establishment.additionalInformation,
        voluntaryToImmersion: establishment.voluntaryToImmersion,
        fitForDisabledWorkers: undefined,
        position: establishment.position,
        address: establishment.address,
        numberOfEmployeeRange: establishment.numberEmployeesRange,
        contactMode: undefined,
        distance_m: undefined,
        contactDetails: undefined,
      });
    });

    describe("Pg implementation of method  getEstablishmentAggregateBySiret", () => {
      const siret = "12345678901234";
      it("Returns undefined if no aggregate exists with given siret", async () => {
        // Act
        const retrievedAggregate =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            siret,
          );
        // Assert
        expect(retrievedAggregate).toBeUndefined();
      });
      it("Retrieves an existing aggregate given its siret", async () => {
        // Prepare
        const establishmentAggregate = new EstablishmentAggregateBuilder()
          .withEstablishment(
            new EstablishmentEntityBuilder()
              .withSiret(siret)
              .withUpdatedAt(new Date("2020-01-05T23:00:00"))
              .build(),
          )
          .withImmersionOffers([
            new ImmersionOfferEntityV2Builder()
              .withAppellationCode("10900") // Appellation given
              .withAppellationLabel("Aide-viticulteur / Aide-viticultrice")
              .withRomeCode("A1401")
              .build(),
            new ImmersionOfferEntityV2Builder().withRomeCode("A1402").build(), // No appellation
          ])
          .build();
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          establishmentAggregate,
        ]);
        // Act
        const retrievedAggregate =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            siret,
          );
        // Assert
        expect(retrievedAggregate).toBeDefined();
        expectAggregateEqual(retrievedAggregate!, establishmentAggregate);
      });
    });

    describe("Pg implementation of method updateEstablishmentAggregate", () => {
      const updatedAt = new Date("2022-01-05T23:00:00.000Z");
      const existingSiret = "12345678901234";
      const existingEstablishmentAggregate = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(existingSiret)
        .withImmersionOffers([
          new ImmersionOfferEntityV2Builder() // Offer with code A1402 without an appellation
            .withAppellationCode(undefined)
            .withRomeCode("A1402")
            .build(),
          new ImmersionOfferEntityV2Builder() // Offer with code A1401 and an appellation
            .withAppellationCode("10806")
            .withAppellationLabel("Aide agricole en arboriculture")
            .withRomeCode("A1401")
            .build(),
          new ImmersionOfferEntityV2Builder() // Offer with code A1401 and an appellation
            .withAppellationCode("10900")
            .withAppellationLabel("Aide-viticulteur / Aide-viticultrice")
            .withRomeCode("A1401")
            .build(),
        ])
        .build();

      beforeEach(async () => {
        // Prepare: insert an existing aggregate
        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          existingEstablishmentAggregate,
        ]);
      });
      it("Throws if the siret does not exist in base", async () => {
        const aggregateNotInBase = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret("11111111111111")
          .build();

        await expectPromiseToFailWith(
          pgEstablishmentAggregateRepository.updateEstablishmentAggregate(
            aggregateNotInBase,
            updatedAt,
          ),
          `We do not have an establishment with siret 11111111111111 to update`,
        );
      });
      it("Updates offers: removes some and creates some", async () => {
        // Act
        const updatedAggregate: EstablishmentAggregate = {
          ...existingEstablishmentAggregate,
          immersionOffers: [
            existingEstablishmentAggregate.immersionOffers[2], // Existing offer to keep
            new ImmersionOfferEntityV2Builder() // New offer to create
              .withAppellationCode("17892")
              .withAppellationLabel("Porteur / Porteuse de hottes")
              .withRomeCode("A1401")
              .build(),
          ],
        };
        await pgEstablishmentAggregateRepository.updateEstablishmentAggregate(
          updatedAggregate,
          updatedAt,
        );

        // Assert
        const retrievedAggregate =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            existingSiret,
          );
        expect(retrievedAggregate).toBeDefined();
        expectAggregateEqual(retrievedAggregate!, updatedAggregate);
      });
      it("Updates establishment informations", async () => {
        // Act
        const updatedAggregate: EstablishmentAggregate = {
          ...existingEstablishmentAggregate,
          establishment: {
            siret: existingSiret,
            name: "New name",
            address: rueGuillaumeTellDto,
            customizedName: "a new customize name",
            isCommited: true,
            dataSource: "form",
            sourceProvider: "immersion-facile",
            voluntaryToImmersion: true,
            position: { lat: 8, lon: 30 },
            nafDto: { code: "8539B", nomenclature: "NAFRev3" },
            numberEmployeesRange: "100-199",
            isActive: true,
            isSearchable: false,
            website: "www.updated-website.fr",
            additionalInformation: "Some additional informations",
            maxContactsPerWeek: 7,
          },
        };
        await pgEstablishmentAggregateRepository.updateEstablishmentAggregate(
          updatedAggregate,
          updatedAt,
        );
        // Assert
        const retrievedAggregate =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            existingSiret,
          );
        expect(retrievedAggregate).toBeDefined();
        const expectedAggregate = {
          ...updatedAggregate,
          establishment: { ...updatedAggregate.establishment, updatedAt },
        };
        expectAggregateEqual(retrievedAggregate!, expectedAggregate);
      });
      it("Updates immersion contact but keeps the same id", async () => {
        // Act
        const updatedAggregate: EstablishmentAggregate = {
          ...existingEstablishmentAggregate,
          contact: {
            id: "11111111-d654-4d0d-8fa6-2febefbe953d",
            lastName: "Boitier",
            firstName: "Anne",
            email: "anne.boitier@email.fr",
            job: "la big boss",
            phone: "0600335980",
            contactMethod: "PHONE",
            copyEmails: ["olivia.baini@email.fr"],
          },
        };
        await pgEstablishmentAggregateRepository.updateEstablishmentAggregate(
          updatedAggregate,
          updatedAt,
        );
        // Assert
        const retrievedAggregate =
          await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
            existingSiret,
          );

        expect(retrievedAggregate).toBeDefined();
        const expectedAggregate = {
          ...updatedAggregate,
          contact: {
            ...updatedAggregate.contact!,
            id: existingEstablishmentAggregate.contact!.id,
          },
        };
        expectAggregateEqual(retrievedAggregate!, expectedAggregate);
      });
    });

    describe("markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek", () => {
      let pgDiscussionRepository: PgDiscussionAggregateRepository;
      const siret1 = "11110000111100";
      const siret2 = "22220000222200";
      const siret3 = "33330000333300";
      const siret4 = "44440000444400";
      const since = new Date("2021-01-02T00:00:00.000Z");

      beforeEach(async () => {
        await client.query("DELETE FROM discussions");
        pgDiscussionRepository = new PgDiscussionAggregateRepository(client);
        const establishment1 = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siret1)
          .withIsSearchable(false)
          .withMaxContactsPerWeek(4)
          .build();
        const establishment2 = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siret2)
          .withContactId("11111111-1111-1111-1111-111111111111")
          .withIsSearchable(false)
          .withMaxContactsPerWeek(2)
          .build();
        const establishment3 = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siret3)
          .withContactId("22222222-2222-2222-2222-222222222222")
          .withIsSearchable(false)
          .withMaxContactsPerWeek(2)
          .build();
        const establishment4 = new EstablishmentAggregateBuilder()
          .withEstablishmentSiret(siret4)
          .withContactId("33333333-3333-3333-3333-333333333333")
          .withIsSearchable(false)
          .withMaxContactsPerWeek(1)
          .build();

        await pgEstablishmentAggregateRepository.insertEstablishmentAggregates([
          establishment1,
          establishment2,
          establishment3,
          establishment4,
        ]);

        await Promise.all([
          pgDiscussionRepository.insertDiscussionAggregate(
            createDiscussionAggregate({
              id: "00001111-1111-1111-1111-000000000000",
              siret: siret1,
              createdAt: new Date("2021-01-01T00:00:00.000Z"),
            }),
          ),
          pgDiscussionRepository.insertDiscussionAggregate(
            createDiscussionAggregate({
              id: "11111111-1111-1111-1111-000000000000",
              siret: siret2,
              createdAt: new Date("2021-01-11T00:00:00.000Z"),
            }),
          ),
          pgDiscussionRepository.insertDiscussionAggregate(
            createDiscussionAggregate({
              id: "22222222-2222-2222-2222-000000000000",
              siret: siret2,
              createdAt: new Date("2021-01-11T00:00:00.000Z"),
            }),
          ),
          pgDiscussionRepository.insertDiscussionAggregate(
            createDiscussionAggregate({
              id: "33333333-3333-3333-3333-000000000000",
              siret: siret3,
              createdAt: new Date("2021-01-09T00:00:00.000Z"),
            }),
          ),
          pgDiscussionRepository.insertDiscussionAggregate(
            createDiscussionAggregate({
              id: "33333333-8888-3333-3333-000000000000",
              siret: siret3,
              createdAt: new Date("2021-01-01T00:00:00.000Z"),
            }),
          ),
          pgDiscussionRepository.insertDiscussionAggregate(
            createDiscussionAggregate({
              id: "44444444-4444-4444-4444-000000000000",
              siret: siret4,
              createdAt: new Date("2021-01-03T00:00:00.000Z"),
            }),
          ),
        ]);
      });

      it("updates establishments back to is_searchable when discussion are old enough", async () => {
        const numberOfEstablishmentUpdated =
          await pgEstablishmentAggregateRepository.markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek(
            since,
          );

        expect(numberOfEstablishmentUpdated).toBe(2);

        const expectEstablishmentToHaveIsSearchable = async (
          siret: string,
          isSearchable: boolean,
        ) => {
          const establishmentAfterUpdate =
            await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
              siret,
            );
          expect(establishmentAfterUpdate!.establishment.isSearchable).toBe(
            isSearchable,
          );
        };

        await expectEstablishmentToHaveIsSearchable(siret1, true);
        await expectEstablishmentToHaveIsSearchable(siret2, false);
        await expectEstablishmentToHaveIsSearchable(siret3, true);
        await expectEstablishmentToHaveIsSearchable(siret4, false);
      });
    });
  });

  type PgEstablishmentRow = {
    siret: string;
    name: string;
    customized_name?: string | null;
    street_number_and_address: string;
    post_code: string;
    department_code: string;
    city: string;
    number_employees: string;
    naf_code: string;
    naf_nomenclature: string;
    data_source: string;
    gps: string;
    update_date?: Date;
    is_active: boolean;
    is_commited?: boolean | null;
    fit_for_disabled_workers: boolean | null;
    max_contacts_per_week: number;
  };

  const getAllEstablishmentsRows = async (): Promise<PgEstablishmentRow[]> =>
    client.query("SELECT * FROM establishments").then((res) => res.rows);

  const getEstablishmentsRowsBySiret = async (
    siret: string,
  ): Promise<PgEstablishmentRow | undefined> =>
    client
      .query("SELECT * FROM establishments WHERE siret=$1", [siret])
      .then((res) => res.rows[0]);

  type PgImmersionContactWithSiretRow = {
    uuid: string;
    lastname: string;
    firstname: string;
    job: string;
    email: string;
    phone: string;
    establishment_siret: string;
    contact_mode: ContactMethod;
    copy_emails: string[];
  };

  const getAllImmersionContactsRows = async (): Promise<
    PgImmersionContactWithSiretRow[]
  > =>
    client
      .query(
        `SELECT * FROM immersion_contacts AS ic JOIN establishments__immersion_contacts AS eic
         ON ic.uuid = eic.contact_uuid WHERE contact_uuid IS NOT NULL`,
      )
      .then((res) => res.rows);

  type PgImmersionOfferRow = {
    rome_code: string;
    rome_nomenclature: number;
    siret: string;
    score: number;
  };

  const getAllImmersionOfferRows = async (): Promise<PgImmersionOfferRow[]> =>
    client.query("SELECT * FROM immersion_offers").then((res) => res.rows);

  type PgEstablishmentRowWithGeo = PgEstablishmentRow & {
    longitude: number;
    latitude: number;
  };

  const retrieveEstablishmentWithSiret = async (
    siret: string,
  ): Promise<PgEstablishmentRowWithGeo | undefined> => {
    const pgResult = await client.query(
      `SELECT *, ST_X(gps::geometry) AS longitude, ST_Y(gps::geometry) AS latitude 
       FROM establishments WHERE siret='${siret}' LIMIT 1;`,
    );
    return pgResult.rows[0] ?? (pgResult.rows[0] as PgEstablishmentRowWithGeo);
  };
  const insertEstablishment = async (props: {
    siret: string;
    updatedAt?: Date;
    isActive?: boolean;
    isSearchable?: boolean;
    nafCode?: string;
    numberEmployeesRange?: NumberEmployeesRange;
    address?: AddressDto;
    dataSource?: DataSource;
    sourceProvider?: FormEstablishmentSource;
    position?: GeoPositionDto;
    fitForDisabledWorkers?: boolean;
    maxContactsPerWeek?: number;
  }) => {
    const defaultPosition = { lon: 12.2, lat: 2.1 };
    const position = props.position ?? defaultPosition;
    const insertQuery = `
    INSERT INTO establishments (
      siret, name, street_number_and_address, post_code, city, department_code, number_employees, naf_code, data_source, source_provider, update_date, is_active, is_searchable, fit_for_disabled_workers, gps, lon, lat, max_contacts_per_week
    ) VALUES ($1, '', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, ST_GeographyFromText('POINT(${position.lon} ${position.lat})'), $14, $15, $16)`;
    const addressDto = props.address ?? rueGuillaumeTellDto;
    await client.query(insertQuery, [
      props.siret,
      addressDto.streetNumberAndAddress,
      addressDto.postcode,
      addressDto.city,
      addressDto.departmentCode,
      props.numberEmployeesRange ?? null,
      props.nafCode ?? "8622B",
      props.dataSource ?? "api_labonneboite",
      props.sourceProvider ?? "api_labonneboite",
      props.updatedAt ? `'${props.updatedAt.toISOString()}'` : null,
      props.isActive ?? true,
      props.isSearchable ?? true,
      props.fitForDisabledWorkers,
      position.lon,
      position.lat,
      props.maxContactsPerWeek ?? defaultMaxContactsPerWeek,
    ]);
  };
  const insertImmersionOffer = async (props: {
    romeCode: string;
    siret: string;
    romeAppellation?: string;
    offerCreatedAt?: Date;
  }) => {
    const insertQuery = `INSERT INTO immersion_offers (
    rome_code, siret, score, rome_appellation, created_at
    ) VALUES
     ($1, $2, $3, $4, $5)`;
    const defaultScore = 4;
    const defaultOfferCreatedAt = new Date("2022-01-08");

    await client.query(insertQuery, [
      props.romeCode,
      props.siret,
      defaultScore,
      props.romeAppellation ?? null,
      props.offerCreatedAt ?? defaultOfferCreatedAt,
    ]);
  };
  const insertImmersionContact = async (props: {
    uuid: string;
    lastName?: string;
    email?: string;
    siret_establishment: string;
  }) => {
    await client.query(
      `
    INSERT INTO immersion_contacts (
    uuid, lastname, firstname, job, email, phone, contact_mode
  ) VALUES
   ($1, $2, '', '', $3, '', 'EMAIL');`,
      [
        props.uuid,
        props.lastName ?? "Jacques",
        props.email ?? "jacques@gmail.com",
      ],
    );

    await client.query(
      `INSERT INTO establishments__immersion_contacts (establishment_siret, contact_uuid) VALUES ($1, $2)`,
      [props.siret_establishment, props.uuid],
    );
  };
  const expectAggregateEqual = (
    actual: EstablishmentAggregate,
    expected: EstablishmentAggregate,
  ) => {
    expect(JSON.parse(JSON.stringify(actual))).toEqual(
      JSON.parse(JSON.stringify(expected)),
    ); // parse and stringify to avoid comparing no key vs. undefined key (Does not work with clone() from ramda)
  };
});
