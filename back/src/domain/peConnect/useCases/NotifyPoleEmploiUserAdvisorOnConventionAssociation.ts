import { ConventionDto, frontRoutes } from "shared";
import { GenerateConventionMagicLink } from "../../../adapters/primary/config/createGenerateConventionMagicLink";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { EmailGateway } from "../../convention/ports/EmailGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { ConventionPoleEmploiUserAdvisorEntity } from "../dto/PeConnect.dto";
import { ConventionAndPeExternalIds } from "../port/ConventionPoleEmploiAdvisorRepository";
import { conventionPoleEmploiUserAdvisorIdsSchema } from "../port/PeConnect.schema";

export class NotifyPoleEmploiUserAdvisorOnConventionAssociation extends TransactionalUseCase<ConventionAndPeExternalIds> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionPoleEmploiUserAdvisorIdsSchema;

  public async _execute(
    conventionUserAdvisorIds: ConventionAndPeExternalIds,
    uow: UnitOfWork,
  ): Promise<void> {
    const [convention, conventionUserAdvisor] = await Promise.all([
      uow.conventionRepository.getById(conventionUserAdvisorIds.conventionId),
      uow.conventionPoleEmploiAdvisorRepository.getByConventionId(
        conventionUserAdvisorIds.conventionId,
      ),
    ]);

    if (!isConventionDto(convention))
      throw new NotFoundError(
        "There is no convention associated with this user pole emploi advisor",
      );

    if (!isDefinedConventionUserAdvisor(conventionUserAdvisor))
      throw new NotFoundError(
        "There is no open pole emploi advisor entity linked to this user conventionId",
      );

    const beneficiary = convention.signatories.beneficiary;

    await this.emailGateway.sendEmail({
      type: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION",
      recipients: [conventionUserAdvisor.email],
      params: {
        advisorFirstName: conventionUserAdvisor.firstName,
        advisorLastName: conventionUserAdvisor.lastName,
        businessName: convention.businessName,
        dateEnd: convention.dateEnd,
        dateStart: convention.dateStart,
        beneficiaryFirstName: beneficiary.firstName,
        beneficiaryLastName: beneficiary.lastName,
        beneficiaryEmail: beneficiary.email,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        immersionAddress: convention.immersionAddress!,
        magicLink: this.generateMagicLinkFn({
          id: convention.id,
          role: "validator",
          targetRoute: frontRoutes.conventionToValidate,
          email: conventionUserAdvisor.email,
        }),
      },
    });
  }
}

const isConventionDto = (
  conventionDto: ConventionDto | undefined,
): conventionDto is ConventionDto => !!conventionDto;

const isDefinedConventionUserAdvisor = (
  conventionAdvisor: ConventionPoleEmploiUserAdvisorEntity | undefined,
): conventionAdvisor is ConventionPoleEmploiUserAdvisorEntity =>
  !!conventionAdvisor;
