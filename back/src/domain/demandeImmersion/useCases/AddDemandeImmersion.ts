import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";
import { Email, EmailGateway } from "./../ports/EmailGateway";
import {
  AddDemandeImmersionResponseDto,
  DemandeImmersionDto,
} from "../../../shared/DemandeImmersionDto";

type AddDemandeImmersionDependencies = {
  demandeImmersionRepository: DemandeImmersionRepository;
  emailGateway: EmailGateway;
  supervisorEmail: string | undefined;
  emailAllowlist: string[];
};

export class AddDemandeImmersion
  implements UseCase<DemandeImmersionDto, AddDemandeImmersionResponseDto>
{
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
      const email: Email = {
        recipient: this.supervisorEmail,
        subject:
          `Nouvelle demande d'immersion: ${params.lastName}, ${params.firstName} - ` +
          `${params.businessName}`,
        textContent:
          `Détails sur: ` +
          `https://immersion.beta.pole-emploi.fr/demande-immersion?demandeId=${id}`,
      };
      this.emailGateway.send(email);
    }

    if (this.emailAllowlist.has(params.email)) {
      const email: Email = {
        recipient: params.email,
        subject: "Votre demande d'immersion a été enregistrée",
        textContent:
          `Merci d'avoir enregistré votre demande. Vous pouvez la modifier avec le ` +
          `lien suivant: https://immersion.beta.pole-emploi.fr/demande-immersion?demandeId=${id}`,
      };
      this.emailGateway.send(email);
    }

    return { id };
  }
}
