import { uniq } from "ramda";
import {
  AddressDto,
  Email,
  UserId,
  WithGeoPosition,
  activeAgencyStatuses,
} from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../core/UseCase";
import { AddressGateway } from "../../core/address/ports/AddressGateway";
import { AppLogger } from "../../core/app-logger/ports/AppLogger";
import { makeProvider } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import {
  PeAgenciesReferential,
  PeAgencyFromReferenciel,
} from "../../establishment/ports/PeAgenciesReferential";
import {
  AgencyUsersRights,
  AgencyWithUsersRights,
} from "../ports/AgencyRepository";

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

  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    referencielAgencesPe: PeAgenciesReferential,
    adresseGateway: AddressGateway,
    uuidGenerator: UuidGenerator,
    logger: AppLogger,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
    this.#referencielAgencesPe = referencielAgencesPe;
    this.#adresseGateway = adresseGateway;
    this.#uuidGenerator = uuidGenerator;
    this.#logger = logger;
    this.#timeGateway = timeGateway;
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

      const matchedSafirAgency = await uow.agencyRepository.getBySafir(
        peReferentialAgency.codeSafir,
      );

      if (matchedSafirAgency) {
        counts.matchedEmail++;
        await updateAgency(
          uow,
          this.#timeGateway,
          this.#uuidGenerator,
          matchedSafirAgency,
          peReferentialAgency,
        );
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

          await uow.agencyRepository.insert(
            await this.#convertToAgency(
              uow,
              peReferentialAgency,
              geocodedAddress,
            ),
          );
          counts.added++;
          break;
        }

        case 1: {
          const matchedAgency = matchedNearbyAgencies[0];
          if (matchedAgency.status === "from-api-PE") break;
          await updateAgency(
            uow,
            this.#timeGateway,
            this.#uuidGenerator,
            matchedAgency,
            peReferentialAgency,
          );
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

  async #convertToAgency(
    uow: UnitOfWork,
    peReferentialAgency: PeAgencyFromReferenciel,
    geocodedAddress: AddressDto,
  ): Promise<AgencyWithUsersRights> {
    return {
      id: this.#uuidGenerator.new(),
      name: peReferentialAgency.libelleEtendu,
      ...normalizePosition(peReferentialAgency),
      signature: `L'équipe de l'${peReferentialAgency.libelleEtendu}`,
      coveredDepartments: [geocodedAddress.departmentCode],
      address: geocodedAddress,
      codeSafir: peReferentialAgency.codeSafir,
      agencySiret: peReferentialAgency.siret,
      kind: "pole-emploi",
      status: "from-api-PE",
      refersToAgencyId: null,
      refersToAgencyName: null,
      questionnaireUrl: null,
      logoUrl: null,
      rejectionJustification: null,
      usersRights: peReferentialAgency.contact?.email
        ? {
            [await createOrGetUserIdByEmail(
              uow,
              this.#timeGateway,
              this.#uuidGenerator,
              peReferentialAgency.contact?.email,
            )]: { isNotifiedByEmail: false, roles: ["validator"] },
          }
        : {},
    };
  }
}

const getNearestPeAgencies = async (
  uow: UnitOfWork,
  peReferentialAgency: PeAgencyFromReferenciel,
): Promise<AgencyWithUsersRights[]> => {
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

const updateAgency = async (
  uow: UnitOfWork,
  timeGateway: TimeGateway,
  uuidGenerator: UuidGenerator,
  existingAgency: AgencyWithUsersRights,
  peReferentialAgency: PeAgencyFromReferenciel,
): Promise<void> => {
  counts.updated++;
  const email: Email = peReferentialAgency.contact?.email;

  await uow.agencyRepository.update({
    ...existingAgency,
    agencySiret: peReferentialAgency.siret,
    codeSafir: peReferentialAgency.codeSafir,
    ...normalizePosition(peReferentialAgency),
    ...(email
      ? {
          usersRights: await updateRights({
            existingUserRights: existingAgency.usersRights,
            email,
            timeGateway,
            uuidGenerator,
            uow,
          }),
        }
      : {}),
  });
};

const updateRights = async ({
  existingUserRights,
  email,
  timeGateway,
  uow,
  uuidGenerator,
}: {
  existingUserRights: AgencyUsersRights;
  email: Email;
  uow: UnitOfWork;
  timeGateway: TimeGateway;
  uuidGenerator: UuidGenerator;
}): Promise<AgencyUsersRights> => {
  const userId = await createOrGetUserIdByEmail(
    uow,
    timeGateway,
    uuidGenerator,
    email,
  );

  const existingUserRight = existingUserRights[userId];

  return {
    ...existingUserRights,
    [userId]: existingUserRight
      ? {
          isNotifiedByEmail: existingUserRight.isNotifiedByEmail,
          roles: uniq([...existingUserRight.roles, "validator"]),
        }
      : { isNotifiedByEmail: true, roles: ["validator"] },
  };
};

const normalizePosition = ({
  adressePrincipale,
}: PeAgencyFromReferenciel): WithGeoPosition => ({
  position: {
    lat: adressePrincipale.gpsLat,
    lon: adressePrincipale.gpsLon,
  },
});

const createOrGetUserIdByEmail = async (
  uow: UnitOfWork,
  timeGateway: TimeGateway,
  uuidGenerator: UuidGenerator,
  email: Email,
): Promise<UserId> => {
  const provider = await makeProvider(uow);
  const user = await uow.userRepository.findByEmail(email, provider);
  if (user) return user.id;

  const userId: UserId = uuidGenerator.new();
  await uow.userRepository.save(
    {
      id: userId,
      email,
      createdAt: timeGateway.now().toISOString(),
      externalId: null,
      firstName: "",
      lastName: "",
    },
    provider,
  );
  return userId;
};
