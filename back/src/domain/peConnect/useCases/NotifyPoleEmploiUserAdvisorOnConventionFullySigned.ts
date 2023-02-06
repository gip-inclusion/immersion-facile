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

    if (!convention) return;

    const agency = await uow.agencyRepository.getById(convention.agencyId);

    if (conventionPeAdvisor && conventionPeAdvisor.advisor && agency)
      await this.emailGateway.sendEmail({
        type: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED",
        recipients: [conventionPeAdvisor.advisor.email],
        params: {
          advisorFirstName: conventionPeAdvisor.advisor.firstName,
          advisorLastName: conventionPeAdvisor.advisor.lastName,
          businessName: conventionFromEvent.businessName,
          dateEnd: conventionFromEvent.dateEnd,
          dateStart: conventionFromEvent.dateStart,
          beneficiaryFirstName: convention.signatories.beneficiary.firstName,
          beneficiaryLastName: convention.signatories.beneficiary.lastName,
          beneficiaryEmail: convention.signatories.beneficiary.email,
          immersionAddress: conventionFromEvent.immersionAddress,
          magicLink: this.generateMagicLinkFn({
            id: conventionFromEvent.id,
            role: "validator",
            targetRoute: frontRoutes.conventionToValidate,
            email: conventionPeAdvisor.advisor.email,
            now: this.timeGateway.now(),
          }),
          agencyLogoUrl: agency.logoUrl,
        },
      });
  }
}
