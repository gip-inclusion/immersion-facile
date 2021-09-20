import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddDemandeImmersionResponseDto,
  ApplicationSource,
  DemandeImmersionDto,
} from "../../../shared/DemandeImmersionDto";
import { logger } from "../../../utils/logger";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { EmailGateway } from "../ports/EmailGateway";
import { DemandeImmersionRepository } from "./../ports/DemandeImmersionRepository";

type AddDemandeImmersionDependencies = {
  applicationRepository: DemandeImmersionRepository;
  emailGateway: EmailGateway;
  supervisorEmail: string | undefined;
  unrestrictedEmailSendingSources: Readonly<Set<ApplicationSource>>;
  emailAllowList: Readonly<Set<string>>;
};

export class AddDemandeImmersion
  implements UseCase<DemandeImmersionDto, AddDemandeImmersionResponseDto>
{
  private readonly logger = logger.child({ logsource: "AddDemandeImmersion" });
  private readonly applicationRepository: DemandeImmersionRepository;
  private readonly emailGateway: EmailGateway;
  private readonly supervisorEmail: string | undefined;
  private readonly unrestrictedEmailSendingSources: Readonly<
    Set<ApplicationSource>
  >;
  private readonly emailAllowList: Readonly<Set<string>>;

  constructor({
    applicationRepository,
    emailGateway,
    supervisorEmail,
    unrestrictedEmailSendingSources,
    emailAllowList,
  }: AddDemandeImmersionDependencies) {
    this.applicationRepository = applicationRepository;
    this.emailGateway = emailGateway;
    this.supervisorEmail = supervisorEmail;
    this.unrestrictedEmailSendingSources = unrestrictedEmailSendingSources;
    this.emailAllowList = emailAllowList;
  }

  public async execute(
    params: DemandeImmersionDto
  ): Promise<AddDemandeImmersionResponseDto> {
    const applicationEntity = DemandeImmersionEntity.create(params);
    const id = await this.applicationRepository.save(applicationEntity);
    if (!id) throw new ConflictError(applicationEntity.id);

    if (params.source === "GENERIC" && this.supervisorEmail) {
      this.emailGateway.sendNewApplicationAdminNotification(
        [this.supervisorEmail],
        {
          demandeId: params.id,
          firstName: params.firstName,
          lastName: params.lastName,
          dateStart: params.dateStart,
          dateEnd: params.dateEnd,
          businessName: params.businessName,
        }
      );
    }

    if (
      this.unrestrictedEmailSendingSources.has(params.source) ||
      this.emailAllowList.has(params.email)
    ) {
      this.emailGateway.sendNewApplicationBeneficiaryConfirmation(
        params.email,
        {
          demandeId: params.id,
          firstName: params.firstName,
          lastName: params.lastName,
        }
      );
    } else {
      this.logger.info(
        { demandeId: params.id, email: params.email, source: params.source },
        "Sending beneficiary confirmation email skipped."
      );
    }

    if (
      this.unrestrictedEmailSendingSources.has(params.source) ||
      this.emailAllowList.has(params.mentorEmail)
    ) {
      this.emailGateway.sendNewApplicationMentorConfirmation(
        params.mentorEmail,
        {
          demandeId: params.id,
          mentorName: params.mentor,
          beneficiaryFirstName: params.firstName,
          beneficiaryLastName: params.lastName,
        }
      );
    } else {
      this.logger.info(
        { demandeId: params.id, email: params.email, source: params.source },
        "Sending mentor confirmation email skipped."
      );
    }

    return { id };
  }
}
