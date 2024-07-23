import {
  AddressDto,
  AgencyDtoBuilder,
  AgencyId,
  AgencyKind,
  UserId,
  defaultValidatorEmail,
} from "shared";
import { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { seedAddresses } from "./seedAddresses";

type SeedUser = {
  id: string;
  email: string;
};

let agencyIds: Record<AgencyKind, AgencyId[]> = {
  "pole-emploi": [],
  "mission-locale": [],
  "cap-emploi": [],
  "conseil-departemental": [],
  "prepa-apprentissage": [],
  "structure-IAE": [],
  cci: [],
  autre: [],
  "immersion-facile": [],
  "operateur-cep": [],
};

const getRandomAddress = (): AddressDto =>
  seedAddresses[Math.floor(Math.random() * seedAddresses.length)];

const getRandomAgencyId = ({ kind }: { kind: AgencyKind }) => {
  const ids = agencyIds[kind];
  return ids[Math.floor(Math.random() * ids.length)];
};

const seedUsers: Record<"admins" | "icUsers" | "notIcUsers", SeedUser[]> = {
  admins: [
    {
      id: new UuidV4Generator().new(),
      email: "admin+playwright@immersion-facile.beta.gouv.fr",
    },
  ],
  icUsers: [
    {
      id: new UuidV4Generator().new(),
      email: "recette+playwright@immersion-facile.beta.gouv.fr",
    },
  ],
  notIcUsers: [
    {
      id: new UuidV4Generator().new(),
      email: defaultValidatorEmail,
    },
    {
      id: new UuidV4Generator().new(),
      email: "notic@user.com",
    },
  ],
};

const getRandomNotIcUserEmail = (): string => {
  const emails = seedUsers.notIcUsers.map(({ email }) => email);
  return emails[Math.floor(Math.random() * emails.length)];
};

const linkAgenciesWithIcUser = async ({
  userId,
  agencyIds,
  uow,
}: { uow: UnitOfWork; agencyIds: AgencyId[]; userId: UserId }) => {
  return Promise.all(
    agencyIds.map(async (agencyId) => {
      const agency = await uow.agencyRepository.getById(agencyId);
      if (!agency) throw new Error(`agency with id ${agencyId} not found`);
      return uow.inclusionConnectedUserRepository.updateAgencyRights({
        userId,
        agencyRights: [
          {
            agency,
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
        ],
      });
    }),
  );
};

const insertAgencySeed = async ({
  uow,
  kind,
}: { uow: UnitOfWork; kind: AgencyKind }): Promise<void> => {
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
    .withValidatorEmails([getRandomNotIcUserEmail()])
    .build();

  await uow.agencyRepository.insert(agency);

  agencyIds = {
    ...agencyIds,
    [kind]: [...agencyIds[kind], agencyId],
  };
};

export const seedHelpers = {
  seedUsers,
  getRandomAgencyId,
  insertAgencySeed,
  linkAgenciesWithIcUser,
};
