import {
  AgencyDto,
  ConventionDto,
  ConventionId,
  conventionSchema,
  frontRoutes,
  Signatory,
  SignatoryRole,
  TemplatedEmail,
} from "shared";
import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../../adapters/primary/config/magicLinkUrl";
import { ShortLinkIdGeneratorGateway } from "../../../core/ports/ShortLinkIdGeneratorGateway";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { prepareMagicShortLinkMaker } from "../../../core/ShortLink";
import { TransactionalUseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

export const missingConventionMessage = (conventionId: ConventionId) =>
  `Missing convention ${conventionId} on convention repository.`;

export const missingAgencyMessage = (convention: ConventionDto) =>
  `Missing agency '${convention.agencyId}' on agency repository.`;

export const noSignatoryMessage = (convention: ConventionDto): string =>
  `No signatories has signed the convention id ${convention.id}.`;

export class NotifyLastSigneeThatConventionHasBeenSigned extends TransactionalUseCase<ConventionDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailGateway: EmailGateway,
    private readonly generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    private readonly timeGateway: TimeGateway,
    private readonly shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
    private readonly config: AppConfig,
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
    if (!repositoryConvention)
      throw new Error(missingConventionMessage(convention.id));
    const [agency] = await uow.agencyRepository.getByIds([
      repositoryConvention.agencyId,
    ]);
    if (!agency) throw new Error(missingAgencyMessage(repositoryConvention));
    return this.onRepositoryConvention(repositoryConvention, agency, uow);
  }

  private async onRepositoryConvention(
    repositoryConvention: ConventionDto,
    agency: AgencyDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const lastSigneeEmail = this.lastSigneeEmail(
      Object.values(repositoryConvention.signatories),
    );
    if (lastSigneeEmail)
      return this.emailGateway.sendEmail(
        await this.emailToSend(
          repositoryConvention,
          lastSigneeEmail,
          agency,
          uow,
        ),
      );
    throw new Error(noSignatoryMessage(repositoryConvention));
  }

  private lastSigneeEmail(
    signatories: Signatory[],
  ): { signedAt: string; email: string; role: SignatoryRole } | undefined {
    const signatoryEmailsOrderedBySignedAt = signatories
      .filter(
        (
          signatory,
        ): signatory is Signatory & {
          signedAt: string;
        } => signatory.signedAt !== undefined,
      )
      .sort((a, b) => (a.signedAt < b.signedAt ? -1 : 0))
      .map(({ email, signedAt, role }) => ({
        email,
        signedAt,
        role,
      }));
    return signatoryEmailsOrderedBySignedAt.at(-1);
  }

  private async emailToSend(
    convention: ConventionDto,
    lastSignee: { signedAt: string; email: string; role: SignatoryRole },
    agency: AgencyDto,
    uow: UnitOfWork,
  ): Promise<TemplatedEmail> {
    const makeMagicShortLink = prepareMagicShortLinkMaker({
      conventionMagicLinkPayload: {
        id: convention.id,
        role: lastSignee.role,
        email: lastSignee.email,
        now: this.timeGateway.now(),
      },
      config: this.config,
      generateConventionMagicLinkUrl: this.generateConventionMagicLinkUrl,
      shortLinkIdGeneratorGateway: this.shortLinkIdGeneratorGateway,
      uow,
    });

    return {
      type: "SIGNEE_HAS_SIGNED_CONVENTION",
      params: {
        agencyLogoUrl: agency.logoUrl,
        internshipKind: convention.internshipKind,
        conventionId: convention.id,
        signedAt: lastSignee.signedAt,
        conventionStatusLink: await makeMagicShortLink(
          frontRoutes.conventionStatusDashboard,
        ),
      },
      recipients: [lastSignee.email],
    };
  }
}
