import { z } from "zod";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export type ConventionIdAndFederatedIdentity = {
  conventionId: string;
  federatedIdentity: string;
};

export class AssociateFederatedIdentityPeConnect extends TransactionalUseCase<ConventionIdAndFederatedIdentity> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    //private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  inputSchema = z.object({
    conventionId: z.string().uuid(),
    federatedIdentity: z.string(),
  });

  public async _execute(
    conventionAndIdentity: ConventionIdAndFederatedIdentity,
    uow: UnitOfWork,
  ): Promise<void> {
    if (!federatedIdentityIsPeConnect(conventionAndIdentity.federatedIdentity))
      return;

    await uow.conventionPoleEmploiAdvisorRepo.associateConventionAndUserAdvisor(
      conventionAndIdentity.conventionId,
      conventionAndIdentity.federatedIdentity,
    );
  }
}

const federatedIdentityIsPeConnect = (
  federatedIdentity: string | undefined,
): federatedIdentity is string =>
  (federatedIdentity ?? "").startsWith("peConnect:");
