import { Column } from "exceljs";
import { map, prop, groupBy, uniq, reduceBy, values } from "ramda";
import { pipeWithValue } from "../../../shared/pipeWithValue";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { Archive } from "../../generic/archive/port/Archive";
import { Workbook } from "../../generic/excel/port/Workbook";
import { EstablishmentReadyForExportVO } from "../valueObjects/EstablishmentReadyForExportVO";
import { temporaryStoragePath } from "../../../utils/filesystemUtils";
import {
  EstablishmentRawBeforeExportProps,
  EstablishmentRawBeforeExportVO,
  EstablishmentRawProps,
} from "../valueObjects/EstablishmentRawBeforeExportVO";
import { notifyDiscord } from "../../../utils/notifyDiscord";
import { DepartmentAndRegion } from "../../generic/geo/ports/PostalCodeDepartmentRegionQueries";
import {
  capturePostalCode,
  CapturePostalCodeResult,
} from "../../../shared/postalCode";
import { establishmentExportSchemaObj } from "../../../shared/establishmentExport/establishmentExport.schema";
import {
  DepartmentOrRegion,
  EstablishmentExportConfigDto,
} from "../../../shared/establishmentExport/establishmentExport.dto";
import { z } from "zod";

export type EstablishmentExportConfig = EstablishmentExportConfigDto & {
  archivePath: string;
};

export class ExportEstablishmentAsExcelArchive extends TransactionalUseCase<EstablishmentExportConfig> {
  inputSchema = z.object({
    ...establishmentExportSchemaObj,
    archivePath: z.string(),
  });

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    config: EstablishmentExportConfig,
    uow: UnitOfWork,
  ): Promise<void> {
    const [
      establishmentsWithoutGeoRawBeforeExport,
      postalCodeDepartmentRegion,
    ] = await Promise.all([
      uow.establishmentExportQueries.getAllEstablishmentsForExport(),
      uow.postalCodeDepartmentRegionQueries.getAllRegionAndDepartmentByPostalCode(),
    ]);

    const establishmentExportByZone = pipeWithValue(
      aggregateProfessionsIfNeeded(
        config,
        establishmentsWithoutGeoRawBeforeExport,
      ),
      map((establishment) => {
        const establishmentWithGeoProps = addZonesDelimiters(
          establishment,
          postalCodeDepartmentRegion,
        );
        return new EstablishmentRawBeforeExportVO(
          establishmentWithGeoProps,
        ).toEstablishmentReadyForExportVO();
      }),
      groupBy(prop(config.groupKey)),
    );

    const workbooksTitles = Object.keys(establishmentExportByZone);

    notifyProblematicEstablishments(workbooksTitles, establishmentExportByZone);

    const workbookColumnsOptions = establishmentsExportByZoneColumnsOptions(
      config.groupKey,
    );

    const createdFilenames = await Promise.all(
      workbooksTitles.map((groupBy: string) =>
        toWorkbook(
          groupBy,
          establishmentExportByZone[groupBy],
          workbookColumnsOptions,
        ).toXlsx(temporaryStoragePath),
      ),
    );

    const zipArchive = new Archive(config.archivePath);
    await zipArchive.addFiles(createdFilenames, { removeOriginal: true });
  }
}

export const aggregateProfessionsIfNeeded = (
  config: EstablishmentExportConfigDto,
  establishmentsWithoutGeoRawBeforeExport: EstablishmentRawProps[],
) => {
  return config.aggregateProfession
    ? reduceByProfessions(establishmentsWithoutGeoRawBeforeExport)
    : establishmentsWithoutGeoRawBeforeExport;
};

export const establishmentsExportByZoneColumnsOptions = (
  groupBy: DepartmentOrRegion,
): Partial<Column>[] => {
  const allColumns: Partial<Column>[] = [
    {
      header: "Siret",
      key: "siret",
      width: 25,
    },
    {
      header: "Raison Sociale",
      key: "name",
      width: 35,
    },
    {
      header: "Enseigne",
      key: "customizedName",
      width: 35,
    },
    {
      header: "Adresse",
      key: "address",
      width: 40,
    },
    {
      header: "Département",
      key: "department",
      width: 30,
    },
    {
      header: "NAF",
      key: "nafCode",
      width: 15,
    },
    {
      header: "Mode de contact",
      key: "preferredContactMethods",
      width: 15,
    },
    {
      header: "Date de référencement",
      key: "createdAt",
      width: 15,
    },
    {
      header: 'Appartenance Réseau "Les Entreprises s\'engagent"',
      key: " isCommited",
      width: 25,
    },
    {
      header: "Métiers",
      key: "professions",
      width: 400,
    },
  ];

  const excludeDepartment = (column: Partial<Column>) =>
    column.key != "department";

  return groupBy === "department"
    ? allColumns.filter(excludeDepartment)
    : allColumns;
};

const notifyProblematicEstablishments = (
  workbookTitles: string[],
  establishmentExportByZone: Record<string, EstablishmentReadyForExportVO[]>,
) => {
  if (workbookTitles.includes("postal-code-not-in-dataset"))
    notifyProblematicPostalCode(
      "(Establishment excel export) Postal code not found in dataset",
      establishmentExportByZone["postal-code-not-in-dataset"],
    );

  if (workbookTitles.includes("invalid-postal-code-format"))
    notifyProblematicPostalCode(
      "(Establishment excel export) Invalid postal code format for establishments",
      establishmentExportByZone["invalid-postal-code-format"],
    );
};

const bySiret = (establishment: EstablishmentRawProps) => establishment.siret;

type EstablishmentRawPropsWithProfessionArray = Omit<
  EstablishmentRawProps,
  "professions"
> & { professions: string[] };

const reduceProfessions = (
  accumulator: EstablishmentRawPropsWithProfessionArray,
  establishment: EstablishmentRawProps,
): EstablishmentRawPropsWithProfessionArray => {
  if (!accumulator.professions) {
    accumulator = {
      ...establishment,
      professions: [establishment.professions],
    };
    return accumulator;
  }

  return {
    ...accumulator,
    professions: uniq<string>(
      accumulator.professions.concat(establishment.professions).sort(),
    ),
  };
};

const concatProfessions = (
  establishment: EstablishmentRawPropsWithProfessionArray,
): EstablishmentRawProps => ({
  ...establishment,
  professions: establishment.professions.join(" | "),
});

const reduceByProfessions = (
  establishments: EstablishmentRawProps[],
): EstablishmentRawProps[] =>
  pipeWithValue(
    establishments,
    reduceBy(
      reduceProfessions,
      {} as EstablishmentRawPropsWithProfessionArray,
      bySiret,
    ),
    values,
    map(concatProfessions),
  );

export const addZonesDelimiters = (
  establishment: EstablishmentRawProps,
  postalCodeDepartmentRegion: Record<string, DepartmentAndRegion>,
): EstablishmentRawBeforeExportProps => {
  const capture: CapturePostalCodeResult = capturePostalCode(
    establishment.address,
  );

  if (!capture.hasPostalCode) {
    return {
      ...establishment,
      region: "invalid-postal-code-format",
      department: "invalid-postal-code-format",
    };
  }

  return {
    ...establishment,
    region:
      postalCodeDepartmentRegion[capture.postalCode]?.region ??
      "postal-code-not-in-dataset",
    department:
      postalCodeDepartmentRegion[capture.postalCode]?.department ??
      "postal-code-not-in-dataset",
  };
};

const notifyProblematicPostalCode = (
  message: string,
  problematicEstablishments: EstablishmentReadyForExportVO[],
) => {
  const serializedProblematicEstablishments = problematicEstablishments
    .map((establishment) => `${establishment.siret} | ${establishment.address}`)
    .join("\n");

  notifyDiscord(`${message}: ${serializedProblematicEstablishments}`);
};

const toWorkbook = (
  workbookTitle: string,
  establishments: EstablishmentReadyForExportVO[],
  excelColumFormatConfig: Partial<Column>[],
): Workbook<EstablishmentReadyForExportVO> =>
  new Workbook()
    .withTitle(workbookTitle)
    .withSheet()
    .withConditionalFormatting("main", {
      ref: `I2:I${establishments.length}`,
      rules: [
        {
          priority: 0,
          type: "containsText",
          operator: "containsText",
          text: "Oui",
          style: {
            fill: {
              type: "pattern",
              pattern: "solid",
              bgColor: { argb: "FF24C157" },
            },
          },
        },
        {
          priority: 1,
          type: "containsText",
          operator: "containsText",
          text: "Non déclaré",
          style: {
            fill: {
              type: "pattern",
              pattern: "solid",
              bgColor: { argb: "FFEA2020" },
            },
          },
        },
      ],
    })
    .withCustomFieldsHeaders(excelColumFormatConfig)
    .withPayload(establishments);
