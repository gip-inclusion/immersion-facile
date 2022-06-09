import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";
import { frontRoutes } from "shared/src/routes";
import { GenerateConventionMagicLink } from "../../../adapters/primary/config/createGenerateConventionMagicLink";
import { createLogger } from "../../../utils/logger";
import { EmailGateway } from "../../convention/ports/EmailGateway";
import { EmailFilter } from "../../core/ports/EmailFilter";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { ConventionPoleEmploiUserAdvisorEntity } from "../dto/PeConnect.dto";
import { isPeConnectIdentity } from "../entities/ConventionPoleEmploiAdvisorEntity";

const logger = createLogger(__filename);

export class NotifyPoleEmploiUserAdvisorOnConventionFullySigned extends TransactionalUseCase<ConventionDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionSchema;

  public async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    if (!isPeConnectIdentity(convention?.federatedIdentity)) {
      logger.info(
        `Convention ${convention.id} federated identity is not of format peConnect, aborting NotifyPoleEmploiUserAdvisorOnConventionFullySigned use case`,
      );
      return;
    }

    const conventionUserAdvisor: ConventionPoleEmploiUserAdvisorEntity =
      await uow.conventionPoleEmploiAdvisorRepo.getByConventionId(
        convention.id,
      );

    await this.emailFilter.withAllowedRecipients(
      [conventionUserAdvisor.email],
      async (filteredRecipients) => {
        await Promise.all(
          filteredRecipients.map((advisorEmail) =>
            this.emailGateway.sendToPoleEmploiAdvisorOnConventionFullySigned(
              advisorEmail,
              {
                advisorFirstName: conventionUserAdvisor.firstName,
                advisorLastName: conventionUserAdvisor.lastName,
                businessName: convention.businessName,
                dateEnd: convention.dateEnd,
                dateStart: convention.dateStart,
                beneficiaryFirstName: convention.firstName,
                beneficiaryLastName: convention.lastName,
                beneficiaryEmail: convention.email,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                immersionAddress: convention.immersionAddress!,
                magicLink: this.generateMagicLinkFn({
                  id: convention.id,
                  role: "counsellor",
                  targetRoute: frontRoutes.conventionToValidate,
                  email: advisorEmail,
                }),
              },
            ),
          ),
        );
      },
      logger,
    );
  }
}
