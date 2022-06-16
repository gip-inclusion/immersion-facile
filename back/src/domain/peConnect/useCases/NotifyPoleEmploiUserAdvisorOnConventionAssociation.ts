import { ConventionDto } from "shared/src/convention/convention.dto";
import { frontRoutes } from "shared/src/routes";
import { GenerateConventionMagicLink } from "../../../adapters/primary/config/createGenerateConventionMagicLink";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { EmailGateway } from "../../convention/ports/EmailGateway";
import { EmailFilter } from "../../core/ports/EmailFilter";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { ConventionPoleEmploiUserAdvisorEntity } from "../dto/PeConnect.dto";
import { ConventionAndPeExternalIds } from "../port/ConventionPoleEmploiAdvisorRepository";
import { conventionPoleEmploiUserAdvisorIdsSchema } from "../port/PeConnect.schema";

const logger = createLogger(__filename);

export class NotifyPoleEmploiUserAdvisorOnConventionAssociation extends TransactionalUseCase<ConventionAndPeExternalIds> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailFilter: EmailFilter,
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
      uow.conventionPoleEmploiAdvisorRepo.getByConventionId(
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

    await this.emailFilter.withAllowedRecipients(
      [conventionUserAdvisor.email],
      async (filteredRecipients) => {
        await Promise.all(
          filteredRecipients.map((advisorEmail) =>
            this.emailGateway.sendToPoleEmploiAdvisorOnConventionAssociation(
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
                  targetRoute: frontRoutes.conventionToSign,
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

const isConventionDto = (
  conventionDto: ConventionDto | undefined,
): conventionDto is ConventionDto => !!conventionDto;

const isDefinedConventionUserAdvisor = (
  conventionAdvisor: ConventionPoleEmploiUserAdvisorEntity | undefined,
): conventionAdvisor is ConventionPoleEmploiUserAdvisorEntity =>
  !!conventionAdvisor;
