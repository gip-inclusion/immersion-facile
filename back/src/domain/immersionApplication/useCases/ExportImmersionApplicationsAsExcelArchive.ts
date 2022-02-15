import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { z } from "zod";
import { Workbook } from "../../generic/excel/port/Workbook";
import {
  groupExportsByAgencyName,
  ImmersionApplicationReadyForExportVO,
} from "../valueObjects/ImmersionApplicationReadyForExportVO";
import { Column } from "exceljs";
import { Archive } from "../../generic/archive/port/Archive";

export class ExportImmersionApplicationsAsExcelArchive extends TransactionalUseCase<string> {
  inputSchema = z.string();

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    archivePath: string,
    uow: UnitOfWork,
  ): Promise<void> {
    const immersionApplicationsRawBeforeExport =
      await uow.immersionApplicationExportRepo.getAllApplicationsForExport();

    const immersionApplicationsReadyForExport =
      immersionApplicationsRawBeforeExport.map((i) =>
        i.toImmersionApplicationReadyForExportVO(),
      );

    const immersionApplicationsGroupedByAgencies = groupExportsByAgencyName(
      immersionApplicationsReadyForExport,
    );

    const workbookTitles = Object.keys(immersionApplicationsGroupedByAgencies);

    const workbookColumnsOptions =
      this.immersionApplicationExportColumnsOptions();

    const createdFilePaths = await Promise.all<string>(
      workbookTitles.map((agencyId: string) =>
        this.toWorkbook(
          agencyId,
          immersionApplicationsGroupedByAgencies[agencyId],
          workbookColumnsOptions,
        ).toXlsx(),
      ),
    );

    const zipArchive = new Archive(archivePath);
    await zipArchive.addFiles(createdFilePaths);
  }

  private immersionApplicationExportColumnsOptions() {
    const businessColumnMappingRules: Partial<Column>[] = [
      { header: "Statut", key: "status", width: widthExport.status },
      {
        header: "Accepté bénéficiaire",
        key: "beneficiaryAccepted",
        width: widthExport.beneficiaryAccepted,
      },
      {
        header: "Accepté entreprise",
        key: "enterpriseAccepted",
        width: widthExport.enterpriseAccepted,
      },
      {
        header: "Nom bénéficiaire",
        key: "lastName",
        width: widthExport.lastName,
      },
      {
        header: "Prénom bénéficiaire",
        key: "firstName",
        width: widthExport.firstName,
      },
      {
        header: "Code Postal",
        key: "postalCode",
        width: widthExport.postalCode,
      },
      { header: "Email bénéficiaire", key: "email", width: widthExport.email },
      {
        header: "Téléphone bénéficiaire",
        key: "phone",
        width: widthExport.phone,
      },
      {
        header: "Date de Début",
        key: "dateStart",
        width: widthExport.dateStart,
      },
      { header: "Date de fin", key: "dateEnd", width: widthExport.dateEnd },
      {
        header: "Heures hebdomadaires",
        key: "weeklyHours",
        width: widthExport.weeklyHours,
      },
      {
        header: "Métier",
        key: "immersionProfession",
        width: widthExport.immersionProfession,
      },
      {
        header: "Objet de l'immersion",
        key: "immersionObjective",
        width: widthExport.immersionObjective,
      },
      {
        header: "Entreprise d'accueil",
        key: "businessName",
        width: widthExport.businessName,
      },
      {
        header: "Siret entreprise d'accueil",
        key: "siret",
        width: widthExport.siret,
      },
      { header: "Tuteur", key: "mentor", width: widthExport.mentor },
      {
        header: "Téléphone tuteur",
        key: "mentorPhone",
        width: widthExport.mentorPhone,
      },
      {
        header: "Email tuteur",
        key: "mentorEmail",
        width: widthExport.mentorEmail,
      },
      {
        header: "Date de Soumission",
        key: "dateSubmission",
        width: widthExport.dateSubmission,
      },
      {
        header: "AUTRE FEUILLE : Jours et horaires (?)",
        key: "schedule",
        width: 400,
      },
    ];
    return businessColumnMappingRules;
  }

  private toWorkbook(
    workbookTitle: string,
    immersionApplications: ImmersionApplicationReadyForExportVO[],
    excelColumFormatConfig: Partial<Column>[],
  ): Workbook<ImmersionApplicationReadyForExportVO> {
    return new Workbook()
      .withTitle(workbookTitle)
      .withSheet()
      .withConditionalFormatting("main", {
        ref: `B2:C${immersionApplications.length}`,
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
      .withPayload(immersionApplications);
  }
}

const columnSizeByDataType = {
  status: 20,
  yesNo: 20,
  name: 20,
  postalCode: 15,
  email: 25,
  phone: 20,
  date: 15,
  weeklyHours: 22,
  profession: 40,
  objective: 40,
  businessName: 25,
  siret: 25,
};

const widthExport: { [key: string]: number } = {
  status: columnSizeByDataType.status,
  beneficiaryAccepted: columnSizeByDataType.yesNo,
  enterpriseAccepted: columnSizeByDataType.yesNo,
  lastName: columnSizeByDataType.name,
  firstName: columnSizeByDataType.name,
  postalCode: columnSizeByDataType.postalCode,
  email: columnSizeByDataType.email,
  phone: columnSizeByDataType.phone,
  dateStart: columnSizeByDataType.date,
  dateEnd: columnSizeByDataType.date,
  weeklyHours: columnSizeByDataType.weeklyHours,
  immersionProfession: columnSizeByDataType.profession,
  immersionObjective: columnSizeByDataType.objective,
  businessName: columnSizeByDataType.businessName,
  siret: columnSizeByDataType.siret,
  mentor: columnSizeByDataType.name * 2,
  mentorPhone: columnSizeByDataType.phone,
  mentorEmail: columnSizeByDataType.email,
  dateSubmission: columnSizeByDataType.date,
};
