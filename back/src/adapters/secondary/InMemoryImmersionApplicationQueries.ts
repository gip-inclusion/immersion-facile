import { createLogger } from "../../utils/logger";
import { ImmersionApplicationQueries } from "../../domain/immersionApplication/ports/ImmersionApplicationQueries";
import { ImmersionApplicationRawBeforeExportVO } from "../../domain/immersionApplication/valueObjects/ImmersionApplicationRawBeforeExportVO";
import { InMemoryImmersionApplicationRepository } from "./InMemoryImmersionApplicationRepository";
import { ImmersionApplicationEntity } from "../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionAssessmentEmailParams } from "../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { InMemoryOutboxRepository } from "./core/InMemoryOutboxRepository";
import { propEq } from "ramda";
import { ConventionJwtPayload } from "shared/src/tokens/MagicLinkPayload";

const logger = createLogger(__filename);

export class InMemoryImmersionApplicationQueries
  implements ImmersionApplicationQueries
{
  constructor(
    private readonly applicationRepository: InMemoryImmersionApplicationRepository,
    private readonly outboxRepository?: InMemoryOutboxRepository,
  ) {}

  public async getLatestUpdated(): Promise<ImmersionApplicationEntity[]> {
    logger.info("getAll");
    return Object.values(this.applicationRepository._immersionApplications);
  }

  public async getAllApplicationsForExport(): Promise<
    ImmersionApplicationRawBeforeExportVO[]
  > {
    return Object.values(this.applicationRepository._immersionApplications).map(
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
  public async getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink(
    dateEnd: Date,
  ): Promise<ImmersionAssessmentEmailParams[]> {
    const immersionIdsThatAlreadyGotAnEmail = this.outboxRepository
      ? Object.values(this.outboxRepository._events)
          .filter(
            propEq("topic", "EmailWithImmersionAssessmentCreationLinkSent"),
          )
          .map((event) => (event.payload as ConventionJwtPayload).id)
      : [];
    return Object.values(this.applicationRepository._immersionApplications)
      .filter(
        (application) =>
          new Date(application.properties.dateEnd).getDate() ===
            dateEnd.getDate() &&
          !immersionIdsThatAlreadyGotAnEmail.includes(application.id),
      )
      .map((application) => ({
        immersionId: application.id,
        mentorName: application.properties.mentor,
        mentorEmail: application.properties.mentorEmail,
        beneficiaryFirstName: application.properties.firstName,
        beneficiaryLastName: application.properties.lastName,
      }));
  }
}
