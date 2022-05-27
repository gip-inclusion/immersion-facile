import { createLogger } from "../../utils/logger";
import { ImmersionApplicationQueries } from "../../domain/immersionApplication/ports/ImmersionApplicationQueries";
import { ImmersionApplicationRawBeforeExportVO } from "../../domain/immersionApplication/valueObjects/ImmersionApplicationRawBeforeExportVO";
import { InMemoryImmersionApplicationRepository } from "./InMemoryImmersionApplicationRepository";
import { ImmersionApplicationEntity } from "../../domain/immersionApplication/entities/ImmersionApplicationEntity";

const logger = createLogger(__filename);

export class InMemoryImmersionApplicationQueries
  implements ImmersionApplicationQueries
{
  constructor(
    private readonly repository: InMemoryImmersionApplicationRepository,
  ) {}

  public async getLatestUpdated(): Promise<ImmersionApplicationEntity[]> {
    logger.info("getAll");
    return Object.values(this.repository._immersionApplications);
  }

  public async getAllApplicationsForExport(): Promise<
    ImmersionApplicationRawBeforeExportVO[]
  > {
    return Object.values(this.repository._immersionApplications).map(
      (entity) => {
        const dto = entity.toDto();
        return new ImmersionApplicationRawBeforeExportVO({
          agencyName: `TEST_AGENCY_NAME_WITH_ID_${dto.agencyId}`,
          status: dto.status,
          postalCode: dto.postalCode,
          email: dto.email,
          phone: dto.phone,
          firstName: dto.firstName,
          lastName: dto.lastName,
          emergencyContact: dto.emergencyContact,
          emergencyContactPhone: dto.emergencyContactPhone,
          dateSubmission: new Date(dto.dateSubmission).toISOString(),
          dateStart: new Date(dto.dateStart).toISOString(),
          dateEnd: new Date(dto.dateEnd).toISOString(),
          businessName: dto.businessName,
          mentor: dto.mentor,
          mentorPhone: dto.mentorPhone,
          mentorEmail: dto.mentorEmail,
          immersionObjective: dto.immersionObjective,
          immersionProfession: dto.immersionAppellation.appellationLabel,
          beneficiaryAccepted: dto.beneficiaryAccepted,
          enterpriseAccepted: dto.enterpriseAccepted,
          schedule: dto.schedule,
          siret: dto.siret,
          workConditions: dto.workConditions,
        });
      },
    );
  }
}
