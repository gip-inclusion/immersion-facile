import {
  ConventionDto,
  conventionSchema,
  Signatory,
  TemplatedEmail,
} from "shared";

import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

export const missingConventionMessage = (convention: ConventionDto) =>
  `Missing convention ${convention.id} on convention repository.`;

export const noSignatoryMessage = (convention: ConventionDto): string =>
  `No signatories has signed the convention id ${convention.id}.`;

export class NotifyLastSigneeThatConventionHasBeenSigned extends TransactionalUseCase<ConventionDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailGateway: EmailGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionSchema;

  public async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const repositoryConvention = await uow.conventionRepository.getById(
      convention.id,
    );
    if (repositoryConvention)
      return this.onRepositoryConvention(repositoryConvention);
    throw new Error(missingConventionMessage(convention));
  }

  private onRepositoryConvention(
    repositoryConvention: ConventionDto,
  ): Promise<void> {
    const lastSigneeEmail = this.lastSigneeEmail(
      Object.values(repositoryConvention.signatories),
    );
    if (lastSigneeEmail)
      return this.emailGateway.sendEmail(
        emailToSend(repositoryConvention, lastSigneeEmail),
      );
    throw new Error(noSignatoryMessage(repositoryConvention));
  }

  private lastSigneeEmail(
    signatories: Signatory[],
  ): { signedAt: string; email: string } | undefined {
    const signatoryEmailsOrderedBySignedAt = signatories
      .filter(
        (
          signatory,
        ): signatory is Signatory & {
          signedAt: string;
        } => signatory.signedAt !== undefined,
      )
      .sort((a, b) => (a.signedAt < b.signedAt ? -1 : 0))
      .map(({ email, signedAt }) => ({
        email,
        signedAt,
      }));
    return signatoryEmailsOrderedBySignedAt.at(
      signatoryEmailsOrderedBySignedAt.length - 1,
    );
  }
}

const emailToSend = (
  convention: ConventionDto,
  lastSigneeEmail: { signedAt: string; email: string },
): TemplatedEmail => ({
  type: "SIGNEE_HAS_SIGNED_CONVENTION",
  params: {
    demandeId: convention.id,
    signedAt: lastSigneeEmail.signedAt,
  },
  recipients: [lastSigneeEmail.email],
});
