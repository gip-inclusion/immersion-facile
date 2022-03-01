import { Column } from "exceljs";
import { map, prop, groupBy, uniq, reduceBy } from "ramda";
import { z } from "zod";
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

export class ExportEstablishmentAsExcelArchive extends TransactionalUseCase<EstablishmentExportConfig> {
  inputSchema = z.object({
    archivePath: z.string(),
    groupBy: z.enum(["region", "department"]),
    aggregateProfession: z.boolean(),
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
      map((establishment) =>
        addZonesDelimiters(establishment, postalCodeDepartmentRegion),
      ),
      map((establishmentWithGeoProps) =>
        new EstablishmentRawBeforeExportVO(
          establishmentWithGeoProps,
        ).toEstablishmentReadyForExportVO(),
      ),
      groupBy(prop(config.groupBy)),
    );

    const workbooksTitles = Object.keys(establishmentExportByZone);

    notifyProblematicEstablishments(workbooksTitles, establishmentExportByZone);

    const workbookColumnsOptions = establishmentsExportByZoneColumnsOptions(
      config.groupBy,
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

type DepartmentOrRegion = "region" | "department";

export type EstablishmentExportConfig = {
  archivePath: string;
  groupBy: DepartmentOrRegion;
  aggregateProfession: boolean;
};

export const aggregateProfessionsIfNeeded = (
  config: EstablishmentExportConfig,
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
      width: widthExport.siret,
    },
    {
      header: "Raison Sociale",
      key: "businessName",
      width: widthExport.businessName,
    },
    {
      header: "Enseigne",
      key: "businessNameCustomized",
      width: widthExport.businessNameCustomized,
    },
    {
      header: "Adresse",
      key: "businessAddress",
      width: widthExport.businessAddress,
    },
    {
      header: "Département",
      key: "department",
      width: widthExport.department,
    },
    {
      header: "NAF",
      key: "naf",
      width: widthExport.naf,
    },
    {
      header: "Mode de contact",
      key: "preferredContactMethods",
      width: widthExport.preferredContactMethods,
    },
    {
      header: "Date de référencement",
      key: "createdAt",
      width: widthExport.createdAt,
    },
    {
      header: 'Appartenance Réseau "Les Entreprises s\'engagent"',
      key: "isEngagedEnterprise",
      width: widthExport.isEngagedEntreprise,
    },
    {
      header: "Métiers",
      key: "professions",
      width: widthExport.professions,
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
      "Postal code not found in dataset",
      establishmentExportByZone["postal-code-not-in-dataset"],
    );

  if (workbookTitles.includes("invalid-postal-code-format"))
    notifyProblematicPostalCode(
      "Invalid postal code format for establishments",
      establishmentExportByZone["invalid-postal-code-format"],
    );
};

const reduceByProfessions = (
  establishments: EstablishmentRawProps[],
): EstablishmentRawProps[] => {
  type EstablishmentRawPropsWithProfessionArray = Omit<
    EstablishmentRawProps,
    "professions"
  > & { professions: string[] };

  const bySiret = (establishment: EstablishmentRawProps) => establishment.siret;

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
        accumulator.professions.concat(establishment.professions),
      ),
    };
  };

  const groupedBySiretReduceProfession: EstablishmentRawPropsWithProfessionArray[] =
    Object.values(
      reduceBy(
        reduceProfessions,
        {} as EstablishmentRawPropsWithProfessionArray,
        bySiret,
        establishments,
      ),
    );

  const concatProfessions = (
    establishment: EstablishmentRawPropsWithProfessionArray,
  ): EstablishmentRawProps => ({
    ...establishment,
    professions: establishment.professions.join(" | "),
  });

  return groupedBySiretReduceProfession.map(concatProfessions);
};

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
  notifyDiscord(
    `\`\`\`${message}: ${problematicEstablishments
      .map(
        (establishment) => `${establishment.siret} | ${establishment.address}`,
      )
      .join("\n")}\`\`\``,
  );
};

const toWorkbook = (
  workbookTitle: string,
  establishments: EstablishmentReadyForExportVO[],
  excelColumFormatConfig: Partial<Column>[],
): Workbook<EstablishmentReadyForExportVO> => {
  return new Workbook()
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
};

const columnSizeByDataType = {
  status: 20,
  yesNo: 20,
  email: 25,
  phone: 20,
  date: 15,
  profession: 40,
  businessName: 35,
  businessAdress: 40,
  department: 30,
  siret: 25,
  naf: 15,
};

const widthExport: { [key: string]: number } = {
  businessNameCustomized: columnSizeByDataType.businessName,
  isEngagedEntreprise: 40,
  email: columnSizeByDataType.email,
  createdAt: columnSizeByDataType.date,
  department: 30,
  professions: columnSizeByDataType.profession * 10,
  pre: columnSizeByDataType.profession * 10,
  businessName: columnSizeByDataType.businessName,
  businessAddress: columnSizeByDataType.businessName,
  siret: columnSizeByDataType.siret,
  preferredContactMethods: 15,
  naf: columnSizeByDataType.naf,
};
