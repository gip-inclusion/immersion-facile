import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import {
  reasonableSchedule,
  ScheduleDto,
} from "../../../shared/ScheduleSchema";
import { ImmersionApplicationReadyForExportVO } from "../../../domain/immersionApplication/valueObjects/ImmersionApplicationReadyForExportVO";

const reasonableHalfWeekSchedule: ScheduleDto = {
  ...reasonableSchedule,
  simpleSchedule: {
    ...reasonableSchedule.simpleSchedule,
    dayPeriods: [[0, 1]],
  },
};

const expectedImmersionApplicationExportDtoWith35Hours: ImmersionApplicationReadyForExportVO =
  {
    agencyName: "L'agence du petit Père",
    status: "Brouillon",
    postalCode: "75001",
    email: "beneficiary@email.fr",
    phone: "+33012345678",
    firstName: "Esteban",
    lastName: "Ocon",
    dateSubmission: "2021-01-04",
    dateStart: "2021-01-06",
    dateEnd: "2021-01-15",
    businessName: "Beta.gouv.fr",
    mentor: "Alain Prost",
    mentorPhone: "0601010101",
    mentorEmail: "establishment@example.com",
    immersionObjective: "Confirmer un projet professionnel",
    immersionProfession: "Pilote d'automobile",
    beneficiaryAccepted: "OUI",
    enterpriseAccepted: "OUI",
    schedule: reasonableSchedule,
    siret: "12345678901234",
    weeklyHours: 35,
  };

const expectedImmersionApplicationExportDtoWith14Hours: ImmersionApplicationReadyForExportVO =
  {
    agencyName: "L'agence du Mérou Noir",
    status: "Brouillon",
    postalCode: "75001",
    email: "beneficiary@email.fr",
    phone: "+33012345678",
    firstName: "Esteban",
    lastName: "Ocon",
    dateSubmission: "2021-01-04",
    dateStart: "2021-01-06",
    dateEnd: "2021-01-15",
    businessName: "Beta.gouv.fr",
    mentor: "Alain Prost",
    mentorPhone: "0601010101",
    mentorEmail: "establishment@example.com",
    immersionObjective: "Confirmer un projet professionnel",
    immersionProfession: "Pilote d'automobile",
    beneficiaryAccepted: "OUI",
    enterpriseAccepted: "OUI",
    schedule: reasonableHalfWeekSchedule,
    siret: "12345678901234",
    weeklyHours: 14,
  };

describe("Immersion Applications Exports", (): void => {
  it("should match expected properties for excel generation", async () => {
    // arrange
    const immersionApplicationWith35Hours =
      new ImmersionApplicationEntityBuilder()
        .withId("123")
        .withAgencyId("aa025666a-22d7-4752-86eb-d07e27a5766a")
        .withSchedule(reasonableSchedule)
        .build();

    const immersionApplicationWith14Hours =
      new ImmersionApplicationEntityBuilder()
        .withId("456")
        .withAgencyId("aa025666a-22d7-4752-86eb-d07e27a5766z")
        .withSchedule(reasonableHalfWeekSchedule)
        .build();

    // pattern build

    // TODO How to refactor this ?

    /*    const unitOfWork = createInMemoryUow();
    unitOfWork.immersionApplicationExportRepo.setImmersionApplicationExport({
      [immersionApplicationWith35Hours.id]: immersionApplicationWith35Hours,
      [immersionApplicationWith14Hours.id]: immersionApplicationWith14Hours,
    });

    const uowPerformer: InMemoryUowPerformer = new InMemoryUowPerformer(
      unitOfWork,
    );

    const rawEntities: ImmersionApplicationEntity[] =
      await unitOfWork.immersionApplicationExportRepo.getAll();

    const expectedImmersionApplicationsExportDtoIdByAgency: {
      [agencyId: string]: ImmersionApplicationExportDto[];
    } = {
      "aa025666a-22d7-4752-86eb-d07e27a5766a": [
        {
          ...expectedImmersionApplicationExportDtoWith35Hours,
        },
      ],
      "aa025666a-22d7-4752-86eb-d07e27a5766z": [
        {
          ...expectedImmersionApplicationExportDtoWith14Hours,
        },
      ],
    };

    expect(toExcelWorkbooksByAgency(rawEntities)).toStrictEqual(
      expectedImmersionApplicationsExportDtoIdByAgency,
    );*/
  });
});
