import { frontRoutes } from "shared/src/routes";
import { GenerateConventionMagicLink } from "../../../adapters/primary/config/createGenerateConventionMagicLink";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { ConventionEntity } from "../../convention/entities/ConventionEntity";
import { EmailGateway } from "../../convention/ports/EmailGateway";
import { EmailFilter } from "../../core/ports/EmailFilter";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
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

    if (!isConventionEntity(convention))
      throw new NotFoundError(
        "There is no convention associated with this user pole emploi advisor",
      );

    const dto = convention.toDto();

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
                businessName: dto.businessName,
                dateEnd: dto.dateEnd,
                dateStart: dto.dateStart,
                beneficiaryFirstName: dto.firstName,
                beneficiaryLastName: dto.lastName,
                beneficiaryEmail: dto.email,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                immersionAddress: dto.immersionAddress!,
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

const isConventionEntity = (
  conventionEntity: ConventionEntity | undefined,
): conventionEntity is ConventionEntity => !!conventionEntity;
