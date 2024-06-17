import {
  AddressDto,
  AgencyDtoBuilder,
  AgencyId,
  AgencyKind,
  miniStageRestrictedDepartments,
} from "shared";
import { UnitOfWork } from "../domains/core/unit-of-work/ports/UnitOfWork";
import { UuidV4Generator } from "../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { seedAddresses } from "./seedAddresses";

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

export const getRandomAddress = (params?: {
  isCciAgency: boolean;
}): AddressDto => {
  if (params?.isCciAgency) {
    const addressesForCci = seedAddresses.filter(({ departmentCode }) =>
      miniStageRestrictedDepartments.includes(departmentCode),
    );
    return addressesForCci[Math.floor(Math.random() * addressesForCci.length)];
  }
  return seedAddresses[Math.floor(Math.random() * seedAddresses.length)];
};

export const getRandomAgencyId = ({ kind }: { kind: AgencyKind }) => {
  const ids = agencyIds[kind];
  return ids[Math.floor(Math.random() * ids.length)];
};

export const insertAgencySeed = async ({
  uow,
  kind,
}: { uow: UnitOfWork; kind: AgencyKind }): Promise<void> => {
  const address = getRandomAddress({ isCciAgency: kind === "cci" });
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

  await uow.agencyRepository.insert(agency);

  agencyIds = {
    ...agencyIds,
    [kind]: [...agencyIds[kind], agencyId],
  };
};