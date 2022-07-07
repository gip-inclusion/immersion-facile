import { Column } from "exceljs";
import { ConventionReadyForExport } from "../../../domain/convention/useCases/ExportConventionsReport";
import {
  ArchivedReport,
  ConventionExportByAgency,
  ReportingGateway,
} from "../../../domain/core/ports/ReportingGateway";
import { Archive } from "../../../domain/generic/archive/port/Archive";
import { Workbook } from "../../../domain/generic/excel/port/Workbook";
import { retrieveParentDirectory } from "../../../utils/filesystemUtils";

export class ExcelReportingGateway implements ReportingGateway {
  async exportConventions({
    report,
    archivePath,
  }: ArchivedReport<ConventionExportByAgency>): Promise<void> {
    const workbookTitles = Object.keys(report);
    const workbookColumnsOptions = this.conventionExportColumnsOptions();
    const createdFilenames = await Promise.all(
      workbookTitles.map((agencyId: string) =>
        this.toWorkbook(
          agencyId,
          report[agencyId],
          workbookColumnsOptions,
        ).toXlsx(retrieveParentDirectory(archivePath)),
      ),
    );
    const zipArchive = new Archive(archivePath);
    await zipArchive.addFiles(createdFilenames, { removeOriginal: true });
  }

  private conventionExportColumnsOptions() {
    const businessColumnMappingRules: Partial<Column>[] = [
      { header: "Statut", key: "status", width: 20 },
      {
        header: "Accepté bénéficiaire",
        key: "beneficiaryAccepted",
        width: 20,
      },
      {
        header: "Accepté entreprise",
        key: "enterpriseAccepted",
        width: 20,
      },
      {
        header: "Nom bénéficiaire",
        key: "lastName",
        width: 20,
      },
      {
        header: "Prénom bénéficiaire",
        key: "firstName",
        width: 20,
      },
      {
        header: "Code Postal",
        key: "postalCode",
        width: 15,
      },
      { header: "Email bénéficiaire", key: "email", width: 25 },
      {
        header: "Téléphone bénéficiaire",
        key: "phone",
        width: 20,
      },
      {
        header: "Identifiant Externe Pole Emploi",
        key: "formatedFederatedIdentity",
        width: 30,
      },
      {
        header: "Date de Début",
        key: "formatedDateStart",
        width: 15,
      },
      { header: "Date de fin", key: "formatedDateEnd", width: 15 },
      {
        header: "Nombre d'heures total de l'immersion",
        key: "totalHours",
        width: 30,
      },
      {
        header: "Heures hebdomadaires",
        key: "weeklyHours",
        width: 22,
      },
      {
        header: "Métier",
        key: "immersionProfession",
        width: 40,
      },
      {
        header: "Objet de l'immersion",
        key: "immersionObjective",
        width: 40,
      },
      {
        header: "Entreprise d'accueil",
        key: "businessName",
        width: 25,
      },
      {
        header: "Siret entreprise d'accueil",
        key: "siret",
        width: 25,
      },
      { header: "Tuteur", key: "mentor", width: 40 },
      {
        header: "Téléphone tuteur",
        key: "mentorPhone",
        width: 20,
      },
      {
        header: "Email tuteur",
        key: "mentorEmail",
        width: 25,
      },
      {
        header: "Date de Soumission",
        key: "formatedDateSubmission",
        width: 15,
      },
      {
        header: "Planning",
        key: "planning",
        width: 75,
      },
      {
        header: "Conditions de travail particulières",
        key: "workConditions",
        width: 150,
      },
    ];
    return businessColumnMappingRules;
  }
  private toWorkbook(
    workbookTitle: string,
    conventions: ConventionReadyForExport[],
    excelColumFormatConfig: Partial<Column>[],
  ): Workbook<ConventionReadyForExport> {
    return new Workbook()
      .withTitle(workbookTitle)
      .withSheet()
      .withConditionalFormatting("main", {
        ref: `B2:C${conventions.length}`,
        rules: [
          {
            priority: 0,
            type: "containsText",
            operator: "containsText",
            text: "OUI",
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
            text: "NON",
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
      .withPayload(conventions);
  }
}
