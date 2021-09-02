import { Email, EmailGateway } from "../../domain/demandeImmersion/ports/EmailGateway";
import { logger } from "../../utils/logger";

export class InMemoryEmailGateway implements EmailGateway {
  private readonly sentEmails: Email[] = [];

  public async send(email: Email) {
    logger.info(`LoggingEmailGateway.send: ${JSON.stringify(email)}`);
    this.sentEmails.push(email);
  }

  // For testing.
  getSentEmails(): Email[] {
    return this.sentEmails;
  }
}
