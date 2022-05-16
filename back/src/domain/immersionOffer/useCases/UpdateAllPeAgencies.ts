import { AgencyConfig } from "shared/src/agency/agency.dto";
import { z } from "zod";
import { AppLogger } from "../../core/ports/AppLogger";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { UseCase } from "../../core/UseCase";
import { AgencyRepository } from "../../immersionApplication/ports/AgencyRepository";
import {
  PeAgenciesReferential,
  PeAgencyFromReferenciel,
} from "../ports/PeAgenciesReferential";
import { defaultQuestionnaireUrl } from "./AddAgency";

// this use case is used only in one script (not in the back app)
export class UpdateAllPeAgencies extends UseCase<void, void> {
  constructor(
    private referencielAgencesPe: PeAgenciesReferential,
    private agencyRepository: AgencyRepository,
    private defaultAdminEmail: string,
    private uuid: UuidGenerator,
    private logger: AppLogger,
  ) {
    super();
  }

  protected inputSchema = z.void();

  async _execute(): Promise<void> {
    const start = new Date();
    const peReferentialAgencies =
      await this.referencielAgencesPe.getPeAgencies();

    this.logger.info(
      "Starting to process ",
      peReferentialAgencies.length,
      " agencies",
    );

    const counts = {
      added: 0,
      hasNoEmail: 0,
      matchedEmail: 0,
      matchedNearby: 0,
      toManyMatch: 0,
      total: 0,
    };

    for (const peReferentialAgency of peReferentialAgencies) {
      counts.total++;

      if (!peReferentialAgency.contact?.email) {
        this.logger.warn("No email for ", peReferentialAgency.libelleEtendu);
        counts.hasNoEmail++;
        continue;
      }

      const matchedEmailAgency = await this.getAgencyWithSameValidatorEmail(
        peReferentialAgency,
      );

      if (matchedEmailAgency) {
        counts.matchedEmail++;
        await this.updateAgency(matchedEmailAgency, peReferentialAgency);
        continue;
      }

      const matchedNearbyAgencies = await this.getNearestPeAgencies(
        peReferentialAgency,
      );

      switch (matchedNearbyAgencies.length) {
        case 0: {
          const newAgency = this.convertToAgencyConfig(peReferentialAgency);
          await this.agencyRepository.insert(newAgency);
          counts.added++;
          break;
        }

        case 1: {
          await this.updateAgency(
            matchedNearbyAgencies[0],
            peReferentialAgency,
          );
          counts.matchedNearby++;
          break;
        }

        default: {
          this.logger.warn(
            `${peReferentialAgency.libelleEtendu} has ${matchedNearbyAgencies.length} agencies matching`,
          );
          this.logger.info({
            peReferentialAgency,
            matchedNearbyAgencies,
          });
          counts.toManyMatch++;
          break;
        }
      }
    }

    const finish = new Date();

    const totalDurationInSeconds = (finish.getTime() - start.getTime()) / 1000;
    this.logger.info(
      `Finished in ${totalDurationInSeconds} seconds : `,
      counts,
    );
  }

  private convertToAgencyConfig(
    peReferentialAgency: PeAgencyFromReferenciel,
  ): AgencyConfig {
    const { ligne4, ligne5, ligne6 } = peReferentialAgency.adressePrincipale;
    return {
      id: this.uuid.new(),
      name: peReferentialAgency.libelleEtendu,
      counsellorEmails: [],
      validatorEmails: peReferentialAgency.contact?.email
        ? [peReferentialAgency.contact.email]
        : [],
      adminEmails: [this.defaultAdminEmail],
      address: [ligne4, ligne5, ligne6].filter((v) => v !== "").join(", "),
      position: {
        lat: peReferentialAgency.adressePrincipale.gpsLat,
        lon: peReferentialAgency.adressePrincipale.gpsLon,
      },
      signature: `L'équipe de l'${peReferentialAgency.libelleEtendu}`,
      questionnaireUrl: defaultQuestionnaireUrl,
      code: peReferentialAgency.code,
      agencySiret: peReferentialAgency.siret,
      kind: "pole-emploi",
      status: "from-api-PE",
    };
  }

  private async getNearestPeAgencies(
    peReferentialAgency: PeAgencyFromReferenciel,
  ): Promise<AgencyConfig[]> {
    const agencies = await this.agencyRepository.getNearby(
      {
        lon: peReferentialAgency.adressePrincipale.gpsLon,
        lat: peReferentialAgency.adressePrincipale.gpsLat,
      },
      0.2,
    );
    return agencies.filter((agency) => agency.kind === "pole-emploi");
  }

  private async getAgencyWithSameValidatorEmail(
    peReferentialAgency: PeAgencyFromReferenciel,
  ): Promise<AgencyConfig | undefined> {
    if (!peReferentialAgency.contact?.email) return;

    const result =
      await this.agencyRepository.getAgencyWithValidatorEmailMatching(
        peReferentialAgency.contact.email,
      );

    return result;
  }

  private async updateAgency(
    existingAgency: AgencyConfig,
    peReferentialAgency: PeAgencyFromReferenciel,
  ): Promise<void> {
    const updatedAgency: AgencyConfig = {
      ...existingAgency,
      validatorEmails: this.updateEmails(
        existingAgency.validatorEmails,
        peReferentialAgency.contact?.email,
      ),
      agencySiret: peReferentialAgency.siret,
      code: peReferentialAgency.code,
    };
    await this.agencyRepository.update(updatedAgency);
  }

  private updateEmails(
    existingEmails: string[],
    newEmail: string | undefined,
  ): string[] {
    if (!newEmail || existingEmails.includes(newEmail)) return existingEmails;
    return [...existingEmails, newEmail];
  }
}
