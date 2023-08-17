import { z } from "zod";
import {
  activeAgencyStatuses,
  AddressDto,
  AgencyDto,
  WithGeoPosition,
} from "shared";
import { AppLogger } from "../../../core/ports/AppLogger";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../../core/UseCase";
import { AddressGateway } from "../../../immersionOffer/ports/AddressGateway";
import {
  PeAgenciesReferential,
  PeAgencyFromReferenciel,
} from "../../../immersionOffer/ports/PeAgenciesReferential";
import { defaultQuestionnaireUrl } from "./AddAgency";

const counts = {
  added: 0,
  hasNoEmail: 0,
  matchedEmail: 0,
  matchedNearby: 0,
  toManyMatch: 0,
  total: 0,
  updated: 0,
};

// this use case is used only in one script (not in the back app)
export class UpdateAllPeAgencies extends TransactionalUseCase<void, void> {
  protected inputSchema = z.void();

  readonly #referencielAgencesPe: PeAgenciesReferential;

  readonly #adresseGateway: AddressGateway;

  readonly #uuidGenerator: UuidGenerator;

  readonly #logger: AppLogger;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    referencielAgencesPe: PeAgenciesReferential,
    adresseGateway: AddressGateway,
    uuidGenerator: UuidGenerator,
    logger: AppLogger,
  ) {
    super(uowPerformer);
    this.#referencielAgencesPe = referencielAgencesPe;
    this.#adresseGateway = adresseGateway;
    this.#uuidGenerator = uuidGenerator;
    this.#logger = logger;
  }

  protected async _execute(_: void, uow: UnitOfWork): Promise<void> {
    const start = new Date();
    const peReferentialAgencies =
      await this.#referencielAgencesPe.getPeAgencies();

    this.#logger.info(
      "Starting to process ",
      peReferentialAgencies.length,
      " agencies",
    );

    this.#logger.info(
      "Total number of active agencies in DB before script : ",
      (await uow.agencyRepository.getAgencies({})).length,
    );

    for (const peReferentialAgency of peReferentialAgencies) {
      counts.total++;

      if (!peReferentialAgency.contact?.email) {
        this.#logger.warn("No email for ", peReferentialAgency.libelleEtendu);
        counts.hasNoEmail++;
        continue;
      }

      const matchedEmailAgency = await getAgencyWhereEmailMatches(
        uow,
        peReferentialAgency,
      );

      if (matchedEmailAgency) {
        counts.matchedEmail++;
        await updateAgency(uow, matchedEmailAgency, peReferentialAgency);
        continue;
      }

      const matchedNearbyAgencies = await getNearestPeAgencies(
        uow,
        peReferentialAgency,
      );

      switch (matchedNearbyAgencies.length) {
        case 0: {
          const geocodedAddress =
            await this.#adresseGateway.getAddressFromPosition({
              lat: peReferentialAgency.adressePrincipale.gpsLat,
              lon: peReferentialAgency.adressePrincipale.gpsLon,
            });
          if (!geocodedAddress) {
            this.#logger.error(
              `No address found for agency : ${peReferentialAgency.libelle} | siret: ${peReferentialAgency.siret} | codeSafir: ${peReferentialAgency.codeSafir}`,
            );
            continue;
          }

          const newAgency = this.#convertToAgency(
            peReferentialAgency,
            geocodedAddress,
          );
          await uow.agencyRepository.insert(newAgency);
          counts.added++;
          break;
        }

        case 1: {
          const matchedAgency = matchedNearbyAgencies[0];
          if (matchedAgency.status === "from-api-PE") break;
          await updateAgency(uow, matchedAgency, peReferentialAgency);
          counts.matchedNearby++;
          break;
        }

        default: {
          this.#logger.warn(
            `${peReferentialAgency.libelleEtendu} has ${matchedNearbyAgencies.length} agencies matching`,
          );
          this.#logger.info({
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
    this.#logger.info(
      `Finished in ${totalDurationInSeconds} seconds : `,
      counts,
    );
  }

  #convertToAgency(
    peReferentialAgency: PeAgencyFromReferenciel,
    geocodedAddress: AddressDto,
  ): AgencyDto {
    return {
      id: this.#uuidGenerator.new(),
      name: peReferentialAgency.libelleEtendu,
      counsellorEmails: [],
      validatorEmails: peReferentialAgency.contact?.email
        ? [peReferentialAgency.contact.email]
        : [],
      adminEmails: [],
      ...normalizePosition(peReferentialAgency),
      signature: `L'équipe de l'${peReferentialAgency.libelleEtendu}`,
      address: geocodedAddress,
      questionnaireUrl: defaultQuestionnaireUrl,
      codeSafir: peReferentialAgency.codeSafir,
      agencySiret: peReferentialAgency.siret,
      kind: "pole-emploi",
      status: "from-api-PE",
    };
  }
}

const getNearestPeAgencies = async (
  uow: UnitOfWork,
  peReferentialAgency: PeAgencyFromReferenciel,
): Promise<AgencyDto[]> => {
  const agencies = await uow.agencyRepository.getAgencies({
    filters: {
      status: activeAgencyStatuses,
      position: {
        position: {
          lon: peReferentialAgency.adressePrincipale.gpsLon,
          lat: peReferentialAgency.adressePrincipale.gpsLat,
        },
        distance_km: 0.2,
      },
    },
  });
  return agencies.filter((agency) => agency.kind === "pole-emploi");
};

const getAgencyWhereEmailMatches = async (
  uow: UnitOfWork,
  peReferentialAgency: PeAgencyFromReferenciel,
): Promise<AgencyDto | undefined> => {
  if (!peReferentialAgency.contact?.email) return;

  return uow.agencyRepository.getAgencyWhereEmailMatches(
    peReferentialAgency.contact.email,
  );
};

const updateAgency = async (
  uow: UnitOfWork,
  existingAgency: AgencyDto,
  peReferentialAgency: PeAgencyFromReferenciel,
): Promise<void> => {
  counts.updated++;
  const updatedAgency: AgencyDto = {
    ...existingAgency,
    ...normalizePosition(peReferentialAgency),
    ...updateEmails({
      validatorEmails: existingAgency.validatorEmails,
      counsellorEmails: existingAgency.counsellorEmails,
      newEmail: peReferentialAgency.contact?.email,
    }),
    agencySiret: peReferentialAgency.siret,
    codeSafir: peReferentialAgency.codeSafir,
  };
  await uow.agencyRepository.update(updatedAgency);
};

const updateEmails = ({
  counsellorEmails,
  validatorEmails,
  newEmail,
}: {
  counsellorEmails: string[];
  validatorEmails: string[];
  newEmail: string | undefined;
}): { validatorEmails: string[]; counsellorEmails: string[] } => {
  if (
    !newEmail ||
    validatorEmails.includes(newEmail) ||
    counsellorEmails.includes(newEmail)
  ) {
    return {
      validatorEmails,
      counsellorEmails,
    };
  }

  return { counsellorEmails, validatorEmails: [...validatorEmails, newEmail] };
};

const normalizePosition = ({
  adressePrincipale,
}: PeAgencyFromReferenciel): WithGeoPosition => ({
  position: {
    lat: adressePrincipale.gpsLat,
    lon: adressePrincipale.gpsLon,
  },
});
