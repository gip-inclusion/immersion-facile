import { propEq } from "ramda";
import { WithConventionId } from "shared/src/convention/convention.dto";
import { ImmersionAssessmentEmailParams } from "../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { createLogger } from "../../utils/logger";
import { ConventionQueries } from "../../domain/convention/ports/ConventionQueries";
import { ConventionRawBeforeExportVO } from "../../domain/convention/valueObjects/ConventionRawBeforeExportVO";
import { InMemoryOutboxRepository } from "./core/InMemoryOutboxRepository";
import { InMemoryConventionRepository } from "./InMemoryConventionRepository";
import { ConventionEntity } from "../../domain/convention/entities/ConventionEntity";

const logger = createLogger(__filename);

export class InMemoryConventionQueries implements ConventionQueries {
  constructor(
    private readonly conventionRepository: InMemoryConventionRepository,
    private readonly outboxRepository?: InMemoryOutboxRepository,
  ) {}

  public async getLatestUpdated(): Promise<ConventionEntity[]> {
    logger.info("getAll");
    return Object.values(this.conventionRepository._conventions);
  }

  public async getAllConventionsForExport(): Promise<
    ConventionRawBeforeExportVO[]
  > {
    return Object.values(this.conventionRepository._conventions).map(
      (entity) => {
        const dto = entity.toDto();
        return new ConventionRawBeforeExportVO({
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
          .map((event) => (event.payload as WithConventionId).id)
      : [];
    return Object.values(this.conventionRepository._conventions)
      .filter(
        (convention) =>
          new Date(convention.properties.dateEnd).getDate() ===
            dateEnd.getDate() &&
          !immersionIdsThatAlreadyGotAnEmail.includes(convention.id),
      )
      .map((convention) => ({
        immersionId: convention.id,
        mentorName: convention.properties.mentor,
        mentorEmail: convention.properties.mentorEmail,
        beneficiaryFirstName: convention.properties.firstName,
        beneficiaryLastName: convention.properties.lastName,
      }));
  }
}
