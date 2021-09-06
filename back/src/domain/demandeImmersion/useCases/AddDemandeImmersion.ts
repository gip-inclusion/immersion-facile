import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddDemandeImmersionResponseDto,
  DemandeImmersionDto
} from "../../../shared/DemandeImmersionDto";
import { logger } from "../../../utils/logger";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";
import { EmailGateway } from "./../ports/EmailGateway";

type AddDemandeImmersionDependencies = {
  demandeImmersionRepository: DemandeImmersionRepository;
  emailGateway: EmailGateway;
  supervisorEmail: string | undefined;
  emailAllowlist: string[];
};

export class AddDemandeImmersion
  implements UseCase<DemandeImmersionDto, AddDemandeImmersionResponseDto>
{
  private readonly logger = logger.child({ logsource: "AddDemandeImmersion" });
  private readonly demandeImmersionRepository: DemandeImmersionRepository;
  private readonly emailGateway: EmailGateway;
  private readonly supervisorEmail: string | undefined;
  private readonly emailAllowlist: Set<string>;

  constructor({
    demandeImmersionRepository,
    emailGateway,
    supervisorEmail,
    emailAllowlist,
  }: AddDemandeImmersionDependencies) {
    this.demandeImmersionRepository = demandeImmersionRepository;
    this.emailGateway = emailGateway;
    this.supervisorEmail = supervisorEmail;
    this.emailAllowlist = new Set(emailAllowlist);
  }

  public async execute(
    params: DemandeImmersionDto
  ): Promise<AddDemandeImmersionResponseDto> {
    const demandeImmersionEntity = DemandeImmersionEntity.create(params);
    const id = await this.demandeImmersionRepository.save(
      demandeImmersionEntity
    );

    if (!id) throw new ConflictError(demandeImmersionEntity.id);

    if (this.supervisorEmail) {
      this.emailGateway.sendNewDemandeAdminNotification(
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

    if (this.emailAllowlist.has(params.email)) {
      this.emailGateway.sendNewDemandeBeneficiaireConfirmation(params.email, {
        demandeId: params.id,
        firstName: params.firstName,
        lastName: params.lastName,
      });
    } else {
      this.logger.info(
        { demandeId: params.id, email: params.email },
        "Bénéficiaire confirmation email not sent because recipient not on allowlist."
      );
    }

    return { id };
  }
}
