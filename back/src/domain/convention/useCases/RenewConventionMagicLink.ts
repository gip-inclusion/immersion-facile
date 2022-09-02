import jwt, { TokenExpiredError } from "jsonwebtoken";
import {
  Beneficiary,
  ConventionId,
  Mentor,
  RenewMagicLinkRequestDto,
} from "shared/src/convention/convention.dto";
import { renewMagicLinkRequestSchema } from "shared/src/convention/convention.schema";
import {
  ConventionMagicLinkPayload,
  createConventionMagicLinkPayload,
  Role,
  stringToMd5,
} from "shared/src/tokens/MagicLinkPayload";
import { verifyJwtConfig } from "../../../adapters/primary/authMiddleware";
import { AppConfig } from "../../../adapters/primary/config/appConfig";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { GenerateMagicLinkJwt } from "../../auth/jwt";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { Clock } from "../../core/ports/Clock";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

const logger = createLogger(__filename);

interface LinkRenewData {
  role: Role;
  applicationId: ConventionId;
  emailHash?: string;
}

// Extracts the data necessary for link renewal from any version of magic link payload.
const extractDataFromExpiredJwt: (payload: any) => LinkRenewData = (
  payload: any,
) => {
  if (!payload.version) {
    return {
      role: payload.roles[0],
      applicationId: payload.applicationId,
      emailHash: undefined,
    };
  }
  // Once there are more JWT versions, expand this code to upgrade old JWTs, e.g.:
  // else if (payload.version === 1) {...}
  else {
    return {
      role: payload.role,
      applicationId: payload.applicationId,
      emailHash: payload.emailHash,
    };
  }
};

export class RenewConventionMagicLink extends TransactionalUseCase<
  RenewMagicLinkRequestDto,
  void
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
    private readonly generateMagicLinkJwt: GenerateMagicLinkJwt,
    private readonly config: AppConfig,
    private readonly clock: Clock,
  ) {
    super(uowPerformer);
  }

  inputSchema = renewMagicLinkRequestSchema;

  public async _execute(
    { expiredJwt, linkFormat }: RenewMagicLinkRequestDto,
    uow: UnitOfWork,
  ) {
    const { verifyJwt, verifyDeprecatedJwt } = verifyJwtConfig(this.config);

    let payloadToExtract: any | undefined;

    try {
      // If the following doesn't throw, we're dealing with a JWT that we signed, so it's
      // probably expired or an old version.
      payloadToExtract = verifyJwt(expiredJwt);
    } catch (err: any) {
      // If this JWT is signed by us but expired, deal with it.
      if (err instanceof TokenExpiredError) {
        payloadToExtract = jwt.decode(expiredJwt) as ConventionMagicLinkPayload;
      } else {
        // Perhaps this is a JWT that is signed by a compromised key.
        try {
          verifyDeprecatedJwt(expiredJwt);
          // If the above didn't throw, this is a JWT that we issued. Renew it.
          // However, we cannot trust the contents of it, as the private key was potentially
          // compromised. Therefore, only use the application ID and the role from it, and fill
          // the remaining data from the database to prevent a hacker from getting magic links
          // for any application form.
          payloadToExtract = jwt.decode(expiredJwt);
        } catch (_) {
          // We don't want to renew this JWT.
          throw new ForbiddenError();
        }
      }
    }

    if (!payloadToExtract) {
      throw new BadRequestError("Malformed expired JWT");
    }

    const { emailHash, role, applicationId } =
      extractDataFromExpiredJwt(payloadToExtract);

    const conventionDto = await uow.conventionRepository.getById(applicationId);
    if (!conventionDto) throw new NotFoundError(applicationId);

    const agency = await uow.agencyRepository.getById(conventionDto.agencyId);
    if (!agency) {
      logger.error(
        { agencyId: conventionDto.agencyId },
        "No Agency Config found for this agency code",
      );
      throw new BadRequestError(conventionDto.agencyId);
    }

    if (!linkFormat.includes("%jwt%")) {
      throw new BadRequestError(linkFormat);
    }

    const beneficiary: Beneficiary = conventionDto.signatories.beneficiary;
    const mentor: Mentor = conventionDto.signatories.mentor;

    let emails: string[] = [];
    switch (role) {
      case "admin":
        throw new BadRequestError("L'admin n'a pas de liens magiques.");
      case "beneficiary":
        emails = [beneficiary.email];
        break;
      case "counsellor":
        emails = agency.counsellorEmails;
        break;
      case "validator":
        emails = agency.validatorEmails;
        break;
      case "establishment":
        emails = [mentor.email];
        break;
    }

    // Only renew the link if the email hash matches
    let foundHit = false;
    for (const email of emails) {
      if (!emailHash || stringToMd5(email) === emailHash) {
        foundHit = true;
        const jwt = this.generateMagicLinkJwt(
          createConventionMagicLinkPayload(
            applicationId,
            role,
            email,
            undefined,
            this.clock.timestamp.bind(this.clock),
          ),
        );

        const magicLink = linkFormat.replaceAll("%jwt%", jwt);

        const event = this.createNewEvent({
          topic: "MagicLinkRenewalRequested",
          payload: {
            emails,
            magicLink,
          },
        });

        await uow.outboxRepository.save(event);
      }
    }
    if (!foundHit) {
      throw new BadRequestError(
        "Le lien magique n'est plus associé à cette demande d'immersion",
      );
    }
  }
}
