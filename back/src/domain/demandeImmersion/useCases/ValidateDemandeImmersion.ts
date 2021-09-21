import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  ValidateDemandeImmersionRequestDto,
  ValidateDemandeImmersionResponseDto,
} from "../../../shared/DemandeImmersionDto";
import { UseCase } from "../../core/UseCase";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";

type ValidateDemandeImmersionDependencies = {
  demandeImmersionRepository: DemandeImmersionRepository;
};

export class ValidateDemandeImmersion
  implements
    UseCase<
      ValidateDemandeImmersionRequestDto,
      ValidateDemandeImmersionResponseDto
    >
{
  private readonly demandeImmersionRepository: DemandeImmersionRepository;

  constructor({
    demandeImmersionRepository,
  }: ValidateDemandeImmersionDependencies) {
    this.demandeImmersionRepository = demandeImmersionRepository;
  }

  public async execute(
    id: ValidateDemandeImmersionRequestDto
  ): Promise<ValidateDemandeImmersionResponseDto> {
    const demandeImmersionEntity =
      await this.demandeImmersionRepository.getById(id);
    if (!demandeImmersionEntity) throw new NotFoundError(id);

    if (demandeImmersionEntity.toDto().status !== "IN_REVIEW")
      throw new BadRequestError(id);

    const validatedEntity = DemandeImmersionEntity.create({
      ...demandeImmersionEntity.toDto(),
      status: "VALIDATED",
    });

    const updatedId =
      await this.demandeImmersionRepository.updateDemandeImmersion(
        validatedEntity
      );
    if (!updatedId) throw new NotFoundError(updatedId);

    // TODO: Add FinalImmersionApplicationValidationByAdmin event to outbox.

    return { id: updatedId };
  }
}
