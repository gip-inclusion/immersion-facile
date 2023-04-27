import { values } from "ramda";
import {
  AgencyDto,
  ConventionDto,
  conventionSchema,
  CreateConventionMagicLinkPayloadProperties,
  frontRoutes,
  Signatory,
  TemplatedEmail,
} from "shared";
import { AppConfig } from "../../../../adapters/primary/config/appConfig";
import { GenerateConventionMagicLinkUrl } from "../../../../adapters/primary/config/magicLinkUrl";
import { createLogger } from "../../../../utils/logger";
import { ShortLinkGenerator } from "../../../core/ports/ShortLinkGenerator";
import {
  makeShortLinkUrl,
  ShortLinkId,
} from "../../../core/ports/ShortLinkQuery";
import { TimeGateway } from "../../../core/ports/TimeGateway";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";

const logger = createLogger(__filename);

export class ConfirmToSignatoriesThatApplicationCorrectlySubmittedRequestSignature extends TransactionalUseCase<ConventionDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailGateway: EmailGateway,
    private readonly timeGateway: TimeGateway,
    private readonly shortLinkGenerator: ShortLinkGenerator,
    private readonly generateConventionMagicLinkUrl: GenerateConventionMagicLinkUrl,
    private readonly config: AppConfig,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionSchema;

  public async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    if (convention.status === "PARTIALLY_SIGNED") {
      logger.info(
        `Skipping sending signature-requiring establishment representative confirmation as convention is already partially signed`,
      );
      return;
    }

    const [agency] = await uow.agencyRepository.getByIds([convention.agencyId]);
    if (!agency)
      throw new Error(`Missing agency with id ${convention.agencyId}`);

    for (const signatory of values(convention.signatories).filter(
      filterNotUndefined,
    )) {
      await this.emailGateway.sendEmail(
        await this.makeEmail(signatory, convention, agency, uow),
      );
    }
  }

  private async makeEmail(
    signatory: Signatory,
    convention: ConventionDto,
    agency: AgencyDto,
    uow: UnitOfWork,
  ): Promise<TemplatedEmail> {
    const {
      id,
      businessName,
      signatories: {
        beneficiary,
        beneficiaryRepresentative,
        establishmentRepresentative,
      },
    } = convention;

    const conventionMagicLinkPayload: CreateConventionMagicLinkPayloadProperties =
      {
        id,
        role: signatory.role,
        email: signatory.email,
        now: this.timeGateway.now(),
      };

    return {
      type: "NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE",
      recipients: [signatory.email],
      params: {
        internshipKind: convention.internshipKind,
        signatoryName: `${signatory.firstName} ${signatory.lastName}`,
        beneficiaryName: `${beneficiary.firstName} ${beneficiary.lastName}`,
        establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,
        establishmentRepresentativeName: `${establishmentRepresentative.firstName} ${establishmentRepresentative.lastName}`,
        beneficiaryRepresentativeName:
          beneficiaryRepresentative &&
          `${beneficiaryRepresentative.firstName} ${beneficiaryRepresentative.lastName}`,
        magicLink: await this.makeMagicLinkAndProvidesShortLink(
          conventionMagicLinkPayload,
          uow,
          frontRoutes.conventionToSign,
        ),
        conventionStatusLink: await this.makeMagicLinkAndProvidesShortLink(
          conventionMagicLinkPayload,
          uow,
          frontRoutes.conventionStatusDashboard,
        ),
        businessName,
        agencyLogoUrl: agency.logoUrl,
      },
    };
  }

  private async makeMagicLinkAndProvidesShortLink(
    conventionMagicLinkPayload: CreateConventionMagicLinkPayloadProperties,
    uow: UnitOfWork,
    targetRoute: string,
  ) {
    const conventionSignLink = this.generateConventionMagicLinkUrl({
      ...conventionMagicLinkPayload,
      targetRoute,
    });

    const conventionSignShortLinkId: ShortLinkId =
      await this.shortLinkGenerator.generate();

    await uow.shortLinkRepository.save(
      conventionSignShortLinkId,
      conventionSignLink,
    );
    return makeShortLinkUrl(this.config, conventionSignShortLinkId);
  }
}

const filterNotUndefined = <T>(arg: T | undefined): arg is T => !!arg;
