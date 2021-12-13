import { BadRequestError } from "./../../../adapters/primary/helpers/sendHttpResponse";
import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  RenewMagicLinkRequestDto,
  renewMagicLinkRequestSchema,
} from "../../../shared/ImmersionApplicationDto";
import { GenerateMagicLinkJwt } from "../../auth/jwt";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { AgencyRepository } from "../ports/AgencyRepository";
import { createLogger } from "../../../utils/logger";
import { createMagicLinkPayload } from "../../../shared/tokens/MagicLinkPayload";

const logger = createLogger(__filename);

export class RenewMagicLink extends UseCase<RenewMagicLinkRequestDto, void> {
  constructor(
    readonly immersionApplicationRepository: ImmersionApplicationRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
    private readonly agencyRepository: AgencyRepository,
    private readonly generateJwtFn: GenerateMagicLinkJwt,
  ) {
    super();
  }

  inputSchema = renewMagicLinkRequestSchema;

  public async _execute({
    applicationId,
    role,
    linkFormat,
  }: RenewMagicLinkRequestDto) {
    const immersionApplicationEntity =
      await this.immersionApplicationRepository.getById(applicationId);
    if (!immersionApplicationEntity) throw new NotFoundError(applicationId);

    const dto = immersionApplicationEntity.toDto();

    const agencyConfig = await this.agencyRepository.getById(dto.agencyId);
    if (!agencyConfig) {
      logger.error(
        { agencyId: dto.agencyId },
        "No Agency Config found for this agency code",
      );
      throw new BadRequestError(dto.agencyId);
    }

    let emails = [];
    switch (role) {
      case "admin":
        throw new BadRequestError("L'admin n'a pas de liens magiques.");
      case "beneficiary":
        emails = [dto.email];
        break;
      case "counsellor":
        emails = agencyConfig.counsellorEmails;
        break;
      case "validator":
        emails = agencyConfig.validatorEmails;
        break;
      case "establishment":
        emails = [dto.mentorEmail];
        break;
    }

    const jwt = this.generateJwtFn(createMagicLinkPayload(applicationId, role));

    if (!linkFormat.includes("%jwt%")) {
      throw new BadRequestError(linkFormat);
    }

    const magicLink = linkFormat.replaceAll("%jwt%", jwt);

    const event = this.createNewEvent({
      topic: "MagicLinkRenewalRequested",
      payload: {
        emails,
        magicLink,
      },
    });

    await this.outboxRepository.save(event);
  }
}
