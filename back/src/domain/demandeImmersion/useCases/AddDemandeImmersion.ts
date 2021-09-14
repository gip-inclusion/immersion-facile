import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddDemandeImmersionResponseDto,
  ApplicationSource,
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
import { EmailGateway } from "../ports/EmailGateway";

type AddDemandeImmersionDependencies = {
  genericRepository: DemandeImmersionRepository;
  boulogneSurMerRepository: DemandeImmersionRepository;
  narbonneRepository: DemandeImmersionRepository;
  emailGateway: EmailGateway;
  featureFlags: FeatureFlags;
  supervisorEmail: string | undefined;
  emailAllowList: string[];
};

export class AddDemandeImmersion
  implements UseCase<DemandeImmersionDto, AddDemandeImmersionResponseDto>
{
  private readonly logger = logger.child({ logsource: "AddDemandeImmersion" });
  private readonly genericRepository: DemandeImmersionRepository;
  private readonly boulogneSurMerRepository: DemandeImmersionRepository;
  private readonly narbonneRepository: DemandeImmersionRepository;
  private readonly emailGateway: EmailGateway;
  private readonly featureFlags: FeatureFlags;
  private readonly supervisorEmail: string | undefined;
  private readonly emailAllowList: Set<string>;

  constructor({
    genericRepository,
    boulogneSurMerRepository,
    narbonneRepository,
    emailGateway,
    featureFlags,
    supervisorEmail,
    emailAllowList,
  }: AddDemandeImmersionDependencies) {
    this.genericRepository = genericRepository;
    this.boulogneSurMerRepository = boulogneSurMerRepository;
    this.narbonneRepository = narbonneRepository;
    this.emailGateway = emailGateway;
    this.featureFlags = featureFlags;
    this.supervisorEmail = supervisorEmail;
    this.emailAllowList = new Set(emailAllowList);
  }

  public async execute(
    params: DemandeImmersionDto
  ): Promise<AddDemandeImmersionResponseDto> {
    const repository = this.selectRepository(params.source);
    const demandeImmersionEntity = DemandeImmersionEntity.create(params);
    const id = await repository.save(demandeImmersionEntity);

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

  private selectRepository(
    source: ApplicationSource
  ): DemandeImmersionRepository {
    const {
      enableGenericApplicationForm,
      enableBoulogneSurMerApplicationForm,
      enableNarbonneApplicationForm,
    } = this.featureFlags;

    switch (source) {
      case "GENERIC": {
        if (!enableGenericApplicationForm) throw new FeatureDisabledError();
        return this.genericRepository;
      }
      case "BOULOGNE_SUR_MER": {
        if (!enableBoulogneSurMerApplicationForm)
          throw new FeatureDisabledError();
        return this.boulogneSurMerRepository;
      }
      case "NARBONNE": {
        if (!enableNarbonneApplicationForm) throw new FeatureDisabledError();
        return this.narbonneRepository;
      }
      default:
        throw new Error(`Unknown source in request: ${source}`);
    }
  }
}
