import { ConventionDto, conventionSchema, frontRoutes } from "shared";
import { GenerateConventionMagicLink } from "../../../adapters/primary/config/createGenerateConventionMagicLink";
import { EmailGateway } from "../../convention/ports/EmailGateway";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class NotifyPoleEmploiUserAdvisorOnConventionFullySigned extends TransactionalUseCase<ConventionDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionSchema;

  public async _execute(
    conventionFromEvent: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const [conventionPeAdvisor, convention] = await Promise.all([
      uow.conventionPoleEmploiAdvisorRepository.getByConventionId(
        conventionFromEvent.id,
      ),
      uow.conventionRepository.getById(conventionFromEvent.id),
    ]);

    const advisor = conventionPeAdvisor?.advisor;
    const beneficiary = convention?.signatories.beneficiary;

    if (advisor && beneficiary)
      await this.emailGateway.sendEmail({
        type: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED",
        recipients: [advisor.email],
        params: {
          advisorFirstName: advisor.firstName,
          advisorLastName: advisor.lastName,
          businessName: conventionFromEvent.businessName,
          dateEnd: conventionFromEvent.dateEnd,
          dateStart: conventionFromEvent.dateStart,
          beneficiaryFirstName: beneficiary.firstName,
          beneficiaryLastName: beneficiary.lastName,
          beneficiaryEmail: beneficiary.email,
          immersionAddress: conventionFromEvent.immersionAddress,
          magicLink: this.generateMagicLinkFn({
            id: conventionFromEvent.id,
            role: "validator",
            targetRoute: frontRoutes.conventionToValidate,
            email: advisor.email,
            now: this.timeGateway.now(),
          }),
        },
      });
  }
}
