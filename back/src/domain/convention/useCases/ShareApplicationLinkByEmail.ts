import { ShareLinkByEmailDto, shareLinkByEmailSchema } from "shared";
import { AppConfig } from "../../../adapters/primary/config/appConfig";
import { ShortLinkIdGeneratorGateway } from "../../core/ports/ShortLinkIdGeneratorGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { makeShortLinkUrl } from "../../core/ShortLink";
import { TransactionalUseCase } from "../../core/UseCase";
import { EmailGateway } from "../ports/EmailGateway";

export class ShareApplicationLinkByEmail extends TransactionalUseCase<ShareLinkByEmailDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailGateway: EmailGateway,
    private readonly shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
    private readonly config: AppConfig,
  ) {
    super(uowPerformer);
  }
  inputSchema = shareLinkByEmailSchema;

  public async _execute(
    { email, internshipKind, details, conventionLink }: ShareLinkByEmailDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const shortLinkId = this.shortLinkIdGeneratorGateway.generate();
    await uow.shortLinkRepository.save(shortLinkId, conventionLink);
    return this.emailGateway.sendEmail({
      type: "SHARE_DRAFT_CONVENTION_BY_LINK",
      recipients: [email],
      params: {
        internshipKind,
        additionalDetails: details,
        conventionFormUrl: makeShortLinkUrl(this.config, shortLinkId),
      },
    });
  }
}
