import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddDemandeImmersionResponseDto,
  DemandeImmersionDto,
} from "../../../shared/DemandeImmersionDto";
import {
  FeatureDisabledError,
  FeatureFlags,
} from "../../../shared/featureFlags";
import { logger } from "../../../utils/logger";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";
import { EmailGateway } from "./../ports/EmailGateway";

type AddDemandeImmersionDependencies = {
  demandeImmersionRepository: DemandeImmersionRepository;
  emailGateway: EmailGateway;
  featureFlags: FeatureFlags;
  supervisorEmail: string | undefined;
  emailAllowList: string[];
};

export class AddDemandeImmersion
  implements UseCase<DemandeImmersionDto, AddDemandeImmersionResponseDto>
{
  private readonly logger = logger.child({ logsource: "AddDemandeImmersion" });
  private readonly demandeImmersionRepository: DemandeImmersionRepository;
  private readonly emailGateway: EmailGateway;
  private readonly featureFlags: FeatureFlags;
  private readonly supervisorEmail: string | undefined;
  private readonly emailAllowList: Set<string>;

  constructor({
    demandeImmersionRepository,
    emailGateway,
    featureFlags,
    supervisorEmail,
    emailAllowList,
  }: AddDemandeImmersionDependencies) {
    this.demandeImmersionRepository = demandeImmersionRepository;
    this.emailGateway = emailGateway;
    this.featureFlags = featureFlags;
    this.supervisorEmail = supervisorEmail;
    this.emailAllowList = new Set(emailAllowList);
  }

  public async execute(
    params: DemandeImmersionDto
  ): Promise<AddDemandeImmersionResponseDto> {
    if (
      (params.source === "GENERIC" &&
        !this.featureFlags.enableGenericApplicationForm) ||
      (params.source === "BOULOGNE_SUR_MER" &&
        !this.featureFlags.enableBoulogneSurMerApplicationForm) ||
      (params.source === "NARBONNE" &&
        !this.featureFlags.enableNarbonneApplicationForm)
    ) {
      throw new FeatureDisabledError();
    }

    const demandeImmersionEntity = DemandeImmersionEntity.create(params);
    const id = await this.demandeImmersionRepository.save(
      demandeImmersionEntity
    );

    if (!id) throw new ConflictError(demandeImmersionEntity.id);

    if (params.source === "GENERIC" && this.supervisorEmail) {
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

    if (params.source === "GENERIC" && this.emailAllowList.has(params.email)) {
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
