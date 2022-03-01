import { Column } from "exceljs";
import { groupBy, map, prop, reduceBy, uniq } from "ramda";
import { z } from "zod";
import { pipeWithValue } from "../../../shared/pipeWithValue";
import { temporaryStoragePath } from "../../../utils/filesystemUtils";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { Archive } from "../../generic/archive/port/Archive";
import { Workbook } from "../../generic/excel/port/Workbook";
import { ImmersionApplicationReadyForExportVO } from "../valueObjects/ImmersionApplicationReadyForExportVO";
import { EstablishmentRawProps } from "../../establishment/valueObjects/EstablishmentRawBeforeExportVO";

export class ExportImmersionApplicationsAsExcelArchive extends TransactionalUseCase<string> {
  inputSchema = z.string();

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    archivePath: string,
    uow: UnitOfWork,
  ): Promise<void> {
    const workbookColumnsOptions =
      this.immersionApplicationExportColumnsOptions();

    const immersionApplicationExportByAgency = pipeWithValue(
      await uow.immersionApplicationExportQueries.getAllApplicationsForExport(),
      map((i) => i.toImmersionApplicationReadyForExportVO()),
      groupBy(prop("agencyName")),
    );

    const workbookTitles = Object.keys(immersionApplicationExportByAgency);

    const createdFilenames = await Promise.all(
      workbookTitles.map((agencyId: string) =>
        this.toWorkbook(
          agencyId,
          immersionApplicationExportByAgency[agencyId],
          workbookColumnsOptions,
        ).toXlsx(temporaryStoragePath),
      ),
    );

    const zipArchive = new Archive(archivePath);
    await zipArchive.addFiles(createdFilenames, { removeOriginal: true });
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
        header: "Identifiant Externe Pole Emploi",
        key: "peExternalId",
        width: widthExport.peExternalId,
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
        header: "Horaires Lundi",
        key: "monday",
        width: widthExport.day,
      },
      {
        header: "Horaires Mardi",
        key: "tuesday",
        width: widthExport.day,
      },
      {
        header: "Horaires Mercredi",
        key: "wednesday",
        width: widthExport.day,
      },
      {
        header: "Horaires Jeudi",
        key: "thursday",
        width: widthExport.day,
      },
      {
        header: "Horaires Vendredi",
        key: "friday",
        width: widthExport.day,
      },
      {
        header: "Horaires Samedi",
        key: "saturday",
        width: widthExport.day,
      },
      {
        header: "Horaires Dimanche",
        key: "sunday",
        width: widthExport.day,
      },
      {
        header: "Conditions de travail particulières",
        key: "workConditions",
        width: widthExport.freeform,
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
  uuid: 30,
  scheduleDay: 30,
  freeform: 100,
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
  peExternalId: columnSizeByDataType.uuid,
  day: columnSizeByDataType.scheduleDay,
  workConditions: columnSizeByDataType.freeform,
};
