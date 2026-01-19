import {
  AgencyDtoBuilder,
  type AgencyId,
  type AgencyKind,
  type AgencyUsersRights,
  type Email,
  type UserId,
} from "shared";
import type { UnitOfWork } from "../../domains/core/unit-of-work/ports/UnitOfWork";
import { UuidV4Generator } from "../../domains/core/uuid-generator/adapters/UuidGeneratorImplementations";
import { toAgencyWithRights } from "../../utils/agency";
import { getRandomAddress, seedAddresses } from "./seedAddresses";

export const getRandomAgencyId = ({
  kind,
  agencyIds,
}: {
  kind: AgencyKind;
  agencyIds: Record<AgencyKind, AgencyId[]>;
}) => {
  const ids = agencyIds[kind];
  return ids[Math.floor(Math.random() * ids.length)];
};

export const insertAgencySeed = async ({
  uow,
  kind,
  userId,
  agencyContactEmail,
}: {
  uow: UnitOfWork;
  kind: AgencyKind;
  userId: UserId;
  agencyContactEmail: Email;
}): Promise<AgencyId> => {
  const address = getRandomAddress();
  const agencyName = `Agence ${kind} ${address.city}`;
  const agencyId = new UuidV4Generator().new();
  const agency = new AgencyDtoBuilder()
    .withId(agencyId)
    .withName(agencyName)
    .withSignature(`${agencyName} signature`)
    .withKind(kind)
    .withStatus("active")
    .withAddress(address)
    .withAgencyContactEmail(agencyContactEmail)
    .build();

  const connectedValidator: AgencyUsersRights = {
    [userId]: {
      isNotifiedByEmail: true,
      roles: ["validator"],
    },
  };

  const phoneNumber = "+33584875487";
  const phoneNumberId = await uow.phoneNumberRepository.getIdByPhoneNumber(
    phoneNumber,
    new Date(),
  );

  await uow.agencyRepository.insert({
    agency: toAgencyWithRights(agency, connectedValidator),
    phoneId: phoneNumberId,
  });

  return agencyId;
};

export const insertSpecificAgenciesWithUserRight = async ({
  uow,
  userId,
  agencyIds,
}: {
  uow: UnitOfWork;
  userId: UserId;
  agencyIds: Record<AgencyKind, AgencyId[]>;
}): Promise<Record<AgencyKind, AgencyId[]>> => {
  const peAgency = new AgencyDtoBuilder()
    .withId("40400c99-9c0b-bbbb-bb6d-6bb9bd300404")
    .withName("PE Paris")
    .withSignature("PE agency signature")
    .withKind("pole-emploi")
    .withStatus("active")
    .withAddress(seedAddresses[0])
    .build();

  const capEmploiAgency = new AgencyDtoBuilder()
    .withId("40400c99-9c0b-bbbb-bb6d-6bb9bd300606")
    .withName("Cap emploi Paris")
    .withSignature("mission locale agency signature")
    .withKind("cap-emploi")
    .withStatus("active")
    .withAddress(seedAddresses[1])
    .build();

  const cciAgency = new AgencyDtoBuilder()
    .withId("40400c99-9c0b-bbbb-bb6d-6bb9bd300707")
    .withName("CCI Paris")
    .withSignature("mission locale agency signature")
    .withKind("cci")
    .withStatus("active")
    .withAddress(seedAddresses[2])
    .build();

  const missionLocaleAgency = new AgencyDtoBuilder()
    .withId("40400c99-9c0b-bbbb-bb6d-6bb9bd300505")
    .withName("Mission Locale")
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

  const peAgencyPhoneNumber = "+33584875487";
  const peAgencyPhoneNumberId =
    await uow.phoneNumberRepository.getIdByPhoneNumber(
      peAgencyPhoneNumber,
      new Date(),
    );

  const cciAgencyPhoneNumberr = "+33584875488";
  const cciAgencyPhoneNumberId =
    await uow.phoneNumberRepository.getIdByPhoneNumber(
      cciAgencyPhoneNumberr,
      new Date(),
    );

  const capEmploiAgencyPhoneNumber = "+33584875490";
  const capEmploiAgencyPhoneNumberId =
    await uow.phoneNumberRepository.getIdByPhoneNumber(
      capEmploiAgencyPhoneNumber,
      new Date(),
    );

  const missionLocaleAgencyPhoneNumber = "+33584875419";
  const missionLocaleAgencyPhoneNumberId =
    await uow.phoneNumberRepository.getIdByPhoneNumber(
      missionLocaleAgencyPhoneNumber,
      new Date(),
    );

  await uow.agencyRepository.insert({
    agency: toAgencyWithRights(peAgency, connectedValidator),
    phoneId: peAgencyPhoneNumberId,
  });
  await uow.agencyRepository.insert({
    agency: toAgencyWithRights(cciAgency, connectedValidator),
    phoneId: cciAgencyPhoneNumberId,
  });
  await uow.agencyRepository.insert({
    agency: toAgencyWithRights(capEmploiAgency, connectedValidator),
    phoneId: capEmploiAgencyPhoneNumberId,
  });
  await uow.agencyRepository.insert({
    agency: toAgencyWithRights(missionLocaleAgency, connectedValidator),
    phoneId: missionLocaleAgencyPhoneNumberId,
  });

  return {
    ...agencyIds,
    "pole-emploi": [...agencyIds["pole-emploi"], peAgency.id],
    "mission-locale": [...agencyIds["mission-locale"], missionLocaleAgency.id],
  };
};
