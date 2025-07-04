import {
  AgencyDtoBuilder,
  type AgencyKind,
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { ApiConsumerBuilder } from "../../core/api-consumer/adapters/InMemoryApiConsumerRepository";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  type GetApiConsumersByConvention,
  makeGetApiConsumersByConvention,
} from "./GetApiConsumersByConvention";

describe("GetApiConsumersByConvention", () => {
  const userBuilder = new ConnectedUserBuilder();
  const user = userBuilder.buildUser();
  const connectedUser = userBuilder.build();

  const adminBuilder = new ConnectedUserBuilder().withIsAdmin(true);
  const admin = adminBuilder.buildUser();
  const connectedAdmin = adminBuilder.build();

  const uuidGenerator = new TestUuidGenerator();

  const ftAgency = new AgencyDtoBuilder().withKind("pole-emploi").build();
  const conventionWithFtAgency = new ConventionDtoBuilder()
    .withAgencyId(ftAgency.id)
    .build();

  let getApiConsumersByConvention: GetApiConsumersByConvention;
  let uow: InMemoryUnitOfWork;

  beforeEach(async () => {
    uow = createInMemoryUow();
    getApiConsumersByConvention = makeGetApiConsumersByConvention({
      uowPerformer: new InMemoryUowPerformer(uow),
    });
  });

  it("Throw not found error if no convention were found", async () => {
    const fakeConventionId = "649fdf5b-bdb4-4a2d-9680-deb30bacb79a";

    await expectPromiseToFailWithError(
      getApiConsumersByConvention.execute(
        { conventionId: fakeConventionId },
        connectedUser,
      ),
      errors.convention.notFound({ conventionId: fakeConventionId }),
    );
  });

  it("Throw not found error if no user were found", async () => {
    const conventionOfAnotherAgency = new ConventionDtoBuilder(
      conventionWithFtAgency,
    )
      .withAgencyId("another-agency")
      .build();
    uow.conventionRepository.setConventions([conventionOfAnotherAgency]);

    await expectPromiseToFailWithError(
      getApiConsumersByConvention.execute(
        { conventionId: conventionOfAnotherAgency.id },
        connectedUser,
      ),
      errors.user.notFound({ userId: user.id }),
    );
  });

  it("Throw not found error if no agency were found for convention", async () => {
    uow.conventionRepository.setConventions([conventionWithFtAgency]);
    uow.userRepository.users = [user];

    await expectPromiseToFailWithError(
      getApiConsumersByConvention.execute(
        { conventionId: conventionWithFtAgency.id },
        connectedUser,
      ),
      errors.agency.notFound({ agencyId: ftAgency.id }),
    );
  });

  it("return empty array if user doesn't have enough rights on convention", async () => {
    uow.conventionRepository.setConventions([conventionWithFtAgency]);
    uow.agencyRepository.agencies = [toAgencyWithRights(ftAgency)];
    uow.userRepository.users = [user];

    expectToEqual(
      await getApiConsumersByConvention.execute(
        { conventionId: conventionWithFtAgency.id },
        connectedUser,
      ),
      [],
    );
  });
  it.each([
    "conseil-departemental",
    "pole-emploi",
    "cap-emploi",
  ] as AgencyKind[])(
    "return an array with France Travail if convention is of kind %s and if user has right on the convention",
    async (kind) => {
      const agencyWithKind = new AgencyDtoBuilder().withKind(kind).build();
      const conventionWithAgencyOfKind = new ConventionDtoBuilder()
        .withAgencyId(agencyWithKind.id)
        .build();
      uow.conventionRepository.setConventions([conventionWithAgencyOfKind]);
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agencyWithKind, {
          [user.id]: {
            isNotifiedByEmail: true,
            roles: ["validator", "counsellor"],
          },
        }),
      ];
      uow.userRepository.users = [user];

      expectToEqual(
        await getApiConsumersByConvention.execute(
          { conventionId: conventionWithAgencyOfKind.id },
          connectedUser,
        ),
        ["France Travail"],
      );
    },
  );

  it("return an array with the api partners names link to the convention if user has right on the convention", async () => {
    const now = new Date("2024-07-22");
    const subscriptionId = uuidGenerator.new();
    const miloAgency = new AgencyDtoBuilder()
      .withKind("mission-locale")
      .build();
    const conventionMilo = new ConventionDtoBuilder()
      .withAgencyId(miloAgency.id)
      .build();

    const apiConsumer = new ApiConsumerBuilder()
      .withName("si-milo-production")
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: [miloAgency.id] },
        subscriptions: [
          {
            id: subscriptionId,
            createdAt: now.toISOString(),
            callbackHeaders: { authorization: "lol" },
            callbackUrl: "https://www.lol.com",
            subscribedEvent: "convention.updated",
          },
        ],
      })
      .build();

    uow.conventionRepository.setConventions([conventionMilo]);
    uow.agencyRepository.agencies = [
      toAgencyWithRights(miloAgency, {
        [user.id]: {
          isNotifiedByEmail: true,
          roles: ["counsellor", "validator"],
        },
      }),
    ];
    uow.userRepository.users = [user];
    uow.apiConsumerRepository.consumers = [apiConsumer];

    expectToEqual(
      await getApiConsumersByConvention.execute(
        { conventionId: conventionMilo.id },
        connectedUser,
      ),
      [apiConsumer.name],
    );
  });

  it("return an array with the api partners names link to the convention if user is admin", async () => {
    const apiConsumer = new ApiConsumerBuilder()
      .withName("si-milo-production")
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: [ftAgency.id] },
        subscriptions: [
          {
            id: uuidGenerator.new(),
            createdAt: new Date("2024-07-22").toISOString(),
            callbackHeaders: { authorization: "lol" },
            callbackUrl: "https://www.lol.com",
            subscribedEvent: "convention.updated",
          },
        ],
      })
      .build();

    uow.conventionRepository.setConventions([conventionWithFtAgency]);
    uow.agencyRepository.agencies = [toAgencyWithRights(ftAgency)];
    uow.userRepository.users = [admin];
    uow.apiConsumerRepository.consumers = [apiConsumer];

    expectToEqual(
      await getApiConsumersByConvention.execute(
        { conventionId: conventionWithFtAgency.id },
        connectedAdmin,
      ),
      [apiConsumer.name, "France Travail"],
    );
  });
});
