import {
  AddressDto,
  AgencyDtoBuilder,
  AgencyId,
  AgencyKind,
  AgencyUsersRights,
  UserId,
} from "shared";
import { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { toAgencyWithRights } from "../utils/agency";
import { seedAddresses } from "./seedAddresses";

let agencyIds: Record<AgencyKind, AgencyId[]> = {
  "pole-emploi": [],
  "mission-locale": [],
  "cap-emploi": [],
  "conseil-departemental": [],
  "prepa-apprentissage": [],
  "structure-IAE": [],
  cci: [],
  cma: [],
  "chambre-agriculture": [],
  autre: [],
  "immersion-facile": [],
  "operateur-cep": [],
};

export const getRandomAddress = (): AddressDto =>
  seedAddresses[Math.floor(Math.random() * seedAddresses.length)];

export const getRandomAgencyId = ({ kind }: { kind: AgencyKind }) => {
  const ids = agencyIds[kind];
  return ids[Math.floor(Math.random() * ids.length)];
};

export const insertAgencySeed = async ({
  uow,
  kind,
  userId,
}: {
  uow: UnitOfWork;
  kind: AgencyKind;
  userId: UserId;
}): Promise<void> => {
  const address = getRandomAddress();
  const agencyName = `Agence ${kind} ${address.city}`;
  const agencyId = new UuidV4Generator().new();
  const agency = new AgencyDtoBuilder()
    .withId(agencyId)
    .withName(agencyName)
    .withQuestionnaireUrl("https://questionnaire.seed")
    .withSignature(`${agencyName} signature`)
    .withKind(kind)
    .withStatus("active")
    .withAddress(address)
    .build();

  const connectedValidator: AgencyUsersRights = {
    [userId]: {
      isNotifiedByEmail: true,
      roles: ["validator"],
    },
  };

  await uow.agencyRepository.insert(
    toAgencyWithRights(agency, connectedValidator),
  );

  agencyIds = {
    ...agencyIds,
    [kind]: [...agencyIds[kind], agencyId],
  };
};

export const insertAgencies = async ({
  uow,
  userId,
}: { uow: UnitOfWork; userId: UserId }) => {
  const peAgency = new AgencyDtoBuilder()
    .withId("40400c99-9c0b-bbbb-bb6d-6bb9bd300404")
    .withName("PE Paris")
    .withQuestionnaireUrl("https://questionnaire.seed")
    .withSignature("PE agency signature")
    .withKind("pole-emploi")
    .withStatus("active")
    .withAddress(seedAddresses[0])
    .build();

  const capEmploiAgency = new AgencyDtoBuilder()
    .withId("40400c99-9c0b-bbbb-bb6d-6bb9bd300606")
    .withName("Cap emploi Paris")
    .withQuestionnaireUrl("https://questionnaire.seed")
    .withSignature("mission locale agency signature")
    .withKind("cap-emploi")
    .withStatus("active")
    .withAddress(seedAddresses[1])
    .build();

  const cciAgency = new AgencyDtoBuilder()
    .withId("40400c99-9c0b-bbbb-bb6d-6bb9bd300707")
    .withName("CCI Paris")
    .withQuestionnaireUrl("https://questionnaire.seed")
    .withSignature("mission locale agency signature")
    .withKind("cci")
    .withStatus("active")
    .withAddress(seedAddresses[2])
    .build();

  const missionLocaleAgency = new AgencyDtoBuilder()
    .withId("40400c99-9c0b-bbbb-bb6d-6bb9bd300505")
    .withName("Mission Locale")
    .withQuestionnaireUrl("https://questionnaire.seed")
    .withSignature("mission locale agency signature")
    .withKind("mission-locale")
    .withStatus("active")
    .withAddress(seedAddresses[3])
    .build();

  const connectedValidator: AgencyUsersRights = {
    [userId]: {
      isNotifiedByEmail: true,
      roles: ["validator"],
    },
  };

  await uow.agencyRepository.insert(
    toAgencyWithRights(peAgency, connectedValidator),
  );
  await uow.agencyRepository.insert(
    toAgencyWithRights(cciAgency, connectedValidator),
  );
  await uow.agencyRepository.insert(
    toAgencyWithRights(capEmploiAgency, connectedValidator),
  );
  await uow.agencyRepository.insert(
    toAgencyWithRights(missionLocaleAgency, connectedValidator),
  );

  agencyIds = {
    ...agencyIds,
    "pole-emploi": [...agencyIds["pole-emploi"], peAgency.id],
    "mission-locale": [...agencyIds["mission-locale"], missionLocaleAgency.id],
  };
};
