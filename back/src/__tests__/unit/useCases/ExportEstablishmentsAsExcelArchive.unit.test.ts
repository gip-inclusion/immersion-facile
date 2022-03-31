import {
  establishmentsExportByZoneColumnsOptions,
  addZonesDelimiters,
  aggregateProfessionsIfNeeded,
  EstablishmentExportConfig,
  getEstablishmentsForExport,
} from "../../../domain/establishment/useCases/ExportEstablishmentsAsExcelArchive";
import {
  EstablishmentRawBeforeExportProps,
  EstablishmentRawProps,
} from "../../../domain/establishment/valueObjects/EstablishmentRawBeforeExportVO";
import { DepartmentAndRegion } from "../../../domain/generic/geo/ports/PostalCodeDepartmentRegionQueries";
import { StubEstablishmentExportQueries } from "../../../adapters/secondary/StubEstablishmentExportQueries";
import { format } from "date-fns";
import { UnitOfWork } from "../../../domain/core/ports/UnitOfWork";

describe("ExportEstablishmentsAsExcelArchive", () => {
  describe("establishmentsExportColumnsOptions", () => {
    it("establishmentsExportColumnsOptions should not have department columns in group by department config", () => {
      expect(
        establishmentsExportByZoneColumnsOptions("department"),
      ).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: "department",
          }),
        ]),
      );
    });
  });

  describe("addZonesDelimiters", () => {
    it("returns invalid-postal-code-format if no postal was found in establishment address", () => {
      const wrongPostal = "Address with an incorrect postal code 94 800";

      const expected = {
        address: wrongPostal,
        postalCode: "invalid-address-format",
        city: "invalid-address-format",
        region: "invalid-address-format",
        department: "invalid-address-format",
      } as EstablishmentRawBeforeExportProps;

      expect(
        addZonesDelimiters(
          { address: wrongPostal } as EstablishmentRawProps,
          {} as Record<string, DepartmentAndRegion>,
        ),
      ).toStrictEqual(expected);
    });

    it("returns postal-code-not-in-dataset if postal code was not found in postal code department region dataset", () => {
      const wrongPostal =
        "Valid address structure with a postal code that does not exist 99999 City Group";

      const postalCodeDepartmentRegionDataset: Record<
        string[5],
        DepartmentAndRegion
      > = {
        "11000": {
          department: "Aude",
          region: "Occitanie",
        },
      };

      const expected = {
        address:
          "Valid address structure with a postal code that does not exist",
        city: "City Group",
        postalCode: "99999",
        region: "postal-code-not-in-dataset",
        department: "postal-code-not-in-dataset",
      } as EstablishmentRawBeforeExportProps;

      expect(
        addZonesDelimiters(
          { address: wrongPostal } as EstablishmentRawProps,
          postalCodeDepartmentRegionDataset,
        ),
      ).toStrictEqual(expected);
    });

    it("affects matching department and region names to postal code", () => {
      const establishmentInCarcassonne = {
        address: "51 rue Courtejaire 11000 Carcassonne",
      } as EstablishmentRawProps;

      const expected = {
        address: "51 rue Courtejaire",
        postalCode: "11000",
        city: "Carcassonne",
        region: "Occitanie",
        department: "Aude",
      } as EstablishmentRawBeforeExportProps;

      expect(
        addZonesDelimiters(
          establishmentInCarcassonne,
          postalCodeDepartmentRegionDataset,
        ),
      ).toStrictEqual(expected);
    });
  });

  describe("aggregateProfessionsIfNeeded", () => {
    it("returns the data unchanged if no aggregation is needed", async () => {
      const config = {
        aggregateProfession: "false",
      } as EstablishmentExportConfig;

      const rawEstablishments =
        await StubEstablishmentExportQueries.getAllEstablishmentsForExport();

      expect(
        aggregateProfessionsIfNeeded(config, rawEstablishments),
      ).toStrictEqual(rawEstablishments);
    });

    it("returns one entity per siret with concatenated and sorted professions strings (rome - appelation)", async () => {
      const config = {
        aggregateProfession: "true",
      } as EstablishmentExportConfig;

      const rawEstablishments =
        await StubEstablishmentExportQueries.getAllEstablishmentsForExport();

      const expected: EstablishmentRawProps[] = [
        {
          address: "9 PL DE LA VENDEE 85000 LA ROCHE-SUR-YON",
          createdAt: format(new Date(), "dd/MM/yyyy"),
          customizedName: "Custom name",
          isCommited: true,
          nafCode: "7820Z",
          numberEmployees: 300,
          name: "ARTUS INTERIM LA ROCHE SUR YON",
          preferredContactMethods: "phone",
          professions:
            "A1205 - Ouvrier sylviculteur / Ouvrière sylvicutrice | M1502 - Chargé / Chargée de recrutement",
          siret: "79158476600012",
        },
        {
          address: "2 RUE JACQUARD 69120 VAULX-EN-VELIN",
          createdAt: format(new Date(), "dd/MM/yyyy"),
          customizedName: "Custom name",
          isCommited: false,
          nafCode: "9321Z",
          numberEmployees: 200,
          name: "MINI WORLD LYON",
          preferredContactMethods: "mail",
          professions:
            "G1205 - Agent / Agente d'exploitation des attractions | I1304 - Technicien(ne) de maintenance industrielle polyvalente | I1304 - Technicien(ne) maintenance d'équipnts de parcs d'attractions",
          siret: "79341726200037",
        },
      ];

      expect(
        aggregateProfessionsIfNeeded(config, rawEstablishments),
      ).toStrictEqual(expected);
    });
  });

  describe("getEstablishmentsForExport", () => {
    const unitOfWorkMock = {
      establishmentExportQueries: {
        getAllEstablishmentsForExport: () =>
          "getAllEstablishmentsForExport called",
        getEstablishmentsBySourceProviderForExport: (sourceProvider: string) =>
          sourceProvider,
      },
    } as unknown as UnitOfWork;

    it("should retreive all establishment if sourceProvider is 'all'", () => {
      const configMock = {
        sourceProvider: "all",
      } as EstablishmentExportConfig;

      expect(getEstablishmentsForExport(configMock, unitOfWorkMock)).toBe(
        "getAllEstablishmentsForExport called",
      );
    });

    it("should retreive cci establishments if sourceProvider is 'cci'", () => {
      const configMock = {
        sourceProvider: "cci",
      } as EstablishmentExportConfig;

      expect(getEstablishmentsForExport(configMock, unitOfWorkMock)).toBe(
        "cci",
      );
    });
  });
});

const postalCodeDepartmentRegionDataset: Record<
  string[5],
  DepartmentAndRegion
> = {
  "11000": {
    department: "Aude",
    region: "Occitanie",
  },
};
