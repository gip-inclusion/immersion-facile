import { AgencyDtoBuilder, ConnectedUserBuilder } from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type AddAgenciesAndUsers,
  type ImportedAgencyAndUserRow,
  makeAddAgenciesAndUsers,
} from "./AddAgenciesAndUsers";

describe("AddAgenciesAndUsers", () => {
  const siret1 = "12345678901111";
  const siret2 = "12345678902222";
  const user1Email = "user1@test.com";
  const user2Email = "user2@test.com";
  const rows: ImportedAgencyAndUserRow[] = [
    {
      ID: "1",
      SIRET: siret1,
      "Type structure": "AI",
      "Nom structure": "Structure avec user existant sur IF",
      "E-mail authentification": user1Email,
      "Adresse ligne 1": "Adresse ligne 1",
      "Adresse ligne 2": "Adresse ligne 2",
      Ville: "Ville",
      Téléphone: "+33600000000",
    },
    {
      ID: "2",
      SIRET: siret2,
      "Type structure": "EI",
      "Nom structure": "Structure avec user non existant sur IF",
      "E-mail authentification": user2Email,
      "Adresse ligne 1": "Adresse ligne 1",
      "Adresse ligne 2": "Adresse ligne 2",
      Ville: "Ville",
      Téléphone: "+33600000000",
    },
  ];

  let uuidGenerator: TestUuidGenerator;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;
  let addAgenciesAndUsers: AddAgenciesAndUsers;

  beforeEach(() => {
    uow = createInMemoryUow();
    uow.agencyRepository.agencies = [];
    uow.userRepository.users = [];
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    addAgenciesAndUsers = makeAddAgenciesAndUsers({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        timeGateway,
        uuidGenerator,
      },
    });
  });

  describe("sirets already in IF", () => {
    it("should add and update users with role agency-admin and validator", async () => {
      const user1 = new ConnectedUserBuilder()
        .withId("10000000-0000-0000-0000-000000000021")
        .withEmail(user1Email)
        .buildUser();
      const agency1 = toAgencyWithRights(
        new AgencyDtoBuilder()
          .withId("10000000-0000-0000-0000-000000000011")
          .withAgencySiret(siret1)
          .build(),
        {
          [user1.id]: { isNotifiedByEmail: false, roles: ["counsellor"] },
        },
      );
      const agency2 = toAgencyWithRights(
        new AgencyDtoBuilder()
          .withId("10000000-0000-0000-0000-0000000000012")
          .withAgencySiret(siret2)
          .build(),
        {
          [user1.id]: { isNotifiedByEmail: true, roles: ["counsellor"] },
        },
      );

      await uow.userRepository.save(user1);
      await uow.agencyRepository.insert(agency1);
      await uow.agencyRepository.insert(agency2);

      const newUserId = "10000000-0000-0000-0000-000000000022";
      uuidGenerator.setNextUuids([newUserId, newUserId]);
      const result = await addAgenciesAndUsers.execute(rows);

      expect(result).toEqual({
        createdAgenciesCount: 0,
        createdUsersCount: 1,
        updatedUsersCount: 1,
      });
      expect(uow.agencyRepository.agencies).toEqual([
        {
          ...agency1,
          usersRights: {
            [user1.id]: {
              isNotifiedByEmail: false,
              roles: ["counsellor", "agency-admin", "validator"],
            },
          },
        },
        {
          ...agency2,
          usersRights: {
            ...agency2.usersRights,
            [newUserId]: {
              isNotifiedByEmail: true,
              roles: ["agency-admin", "validator"],
            },
          },
        },
      ]);
      expect(uow.userRepository.users).toEqual([
        user1,
        new ConnectedUserBuilder()
          .withId(newUserId)
          .withFirstName("")
          .withLastName("")
          .withEmail(user2Email)
          .withCreatedAt(timeGateway.now())
          .withProConnectInfos(null)
          .withEstablishments(undefined)
          .buildUser(),
      ]);
    });
  });
});
