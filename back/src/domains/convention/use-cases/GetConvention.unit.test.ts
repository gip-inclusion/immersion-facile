import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  ConventionJwtPayload,
  ForbiddenError,
  InclusionConnectDomainJwtPayload,
  InclusionConnectedUserBuilder,
  NotFoundError,
  Role,
  User,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  makeEmailHash,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { GetConvention } from "./GetConvention";

describe("Get Convention", () => {
  const counsellor = new InclusionConnectedUserBuilder()
    .withId("counsellor")
    .withEmail("counsellor@mail.fr")
    .build();
  const validator = new InclusionConnectedUserBuilder()
    .withId("validator")
    .withEmail("validator@mail.fr")
    .build();
  const agency = new AgencyDtoBuilder().build();
  const convention = new ConventionDtoBuilder().withAgencyId(agency.id).build();
  const conventionWithEstablishmentTutor = new ConventionDtoBuilder()
    .withAgencyId(agency.id)
    .withEstablishmentTutor({
      email: "establishment-tutor@mail.fr",
      firstName: "John",
      lastName: "Doe",
      role: "establishment-tutor",
      phone: "+33602010203",
      job: "Job",
    })
    .build();
  let getConvention: GetConvention;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    getConvention = new GetConvention(new InMemoryUowPerformer(uow));
  });

  describe("Wrong paths", () => {
    describe("Forbidden error", () => {
      it("When no auth payload provided", async () => {
        await expectPromiseToFailWithError(
          getConvention.execute({ conventionId: convention.id }),
          new ForbiddenError("No auth payload provided"),
        );
      });

      it("When the user don't have correct role on inclusion connected users", async () => {
        const user: User = {
          id: "my-user-id",
          email: "my-user@email.com",
          firstName: "John",
          lastName: "Doe",
          externalId: "john-external-id",
          createdAt: new Date().toISOString(),
        };

        uow.userRepository.users = [user];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [user.id]: { isNotifiedByEmail: false, roles: ["to-review"] },
          }),
        ];
        uow.conventionRepository.setConventions([convention]);

        await expectPromiseToFailWithError(
          getConvention.execute(
            { conventionId: convention.id },
            { userId: "my-user-id" },
          ),
          new ForbiddenError(
            `User with id 'my-user-id' is not allowed to access convention with id '${convention.id}'`,
          ),
        );
      });

      describe("with ConventionJwtPayload", () => {
        it("When convention id in jwt token does not match provided one", async () => {
          uow.agencyRepository.agencies = [toAgencyWithRights(agency)];
          uow.conventionRepository.setConventions([convention]);

          await expectPromiseToFailWithError(
            getConvention.execute(
              { conventionId: convention.id },
              {
                role: "establishment-representative",
                applicationId: "not-matching-convention-id",
                emailHash: "",
              },
            ),
            new ForbiddenError(
              `This token is not allowed to access convention with id ${convention.id}. Role was 'establishment-representative'`,
            ),
          );
        });

        it.each([
          "validator",
          "beneficiary",
          "counsellor",
          "establishment-representative",
        ] as const)(
          "When the user email for role %s is not used in the convention anymore",
          async (role: Role) => {
            uow.agencyRepository.agencies = [toAgencyWithRights(agency)];
            uow.conventionRepository.setConventions([convention]);
            const payload: ConventionJwtPayload = {
              role,
              emailHash: "oldHash",
              applicationId: convention.id,
              iat: 1,
              version: 1,
            };

            await expectPromiseToFailWithError(
              getConvention.execute({ conventionId: convention.id }, payload),
              new ForbiddenError(
                `User has no right on convention '${convention.id}'`,
              ),
            );
          },
        );

        it("when the user has inclusion connect but not for the agency of this convention", async () => {
          const user: User = {
            id: "my-user-id",
            email: "john@mail.com",
            firstName: "John",
            lastName: "Doe",

            externalId: "john-external-id",
            createdAt: new Date().toISOString(),
          };
          const anotherAgency = new AgencyDtoBuilder(agency)
            .withId("another")
            .build();

          uow.agencyRepository.agencies = [
            toAgencyWithRights(agency),
            toAgencyWithRights(anotherAgency, {
              [user.id]: { isNotifiedByEmail: false, roles: ["validator"] },
            }),
          ];
          uow.conventionRepository.setConventions([convention]);
          uow.userRepository.users = [user];

          const payload: ConventionJwtPayload = {
            role: "validator",
            emailHash: makeEmailHash(user.email),
            applicationId: convention.id,
            iat: 1,
            version: 1,
          };

          await expectPromiseToFailWithError(
            getConvention.execute({ conventionId: convention.id }, payload),
            new ForbiddenError(
              `User has no right on convention '${convention.id}'`,
            ),
          );
        });
      });
    });

    describe("Not found error", () => {
      it("When the Convention does not exist", async () => {
        await expectPromiseToFailWithError(
          getConvention.execute(
            { conventionId: convention.id },
            {
              role: "establishment-representative",
              applicationId: convention.id,
              emailHash: "",
            },
          ),
          new NotFoundError(`No convention found with id ${convention.id}`),
        );
      });

      it("When if user is not on inclusion connected users", async () => {
        uow.agencyRepository.agencies = [toAgencyWithRights(agency)];
        uow.conventionRepository.setConventions([convention]);
        const userId = "my-user-id";

        await expectPromiseToFailWithError(
          getConvention.execute({ conventionId: convention.id }, { userId }),
          errors.user.notFound({ userId }),
        );
      });
    });
  });

  describe("Right paths", () => {
    beforeEach(() => {
      uow.conventionRepository.setConventions([convention]);
      uow.agencyRepository.agencies = [toAgencyWithRights(agency)];
    });

    describe("Inclusion connected user", () => {
      it("that have agency rights", async () => {
        const user: User = {
          id: "my-user-id",
          email: "my-user@email.com",
          firstName: "John",
          lastName: "Doe",
          externalId: "john-external-id",
          createdAt: new Date().toISOString(),
        };

        uow.userRepository.users = [user];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [user.id]: { isNotifiedByEmail: false, roles: ["validator"] },
          }),
        ];

        const fetchedConvention = await getConvention.execute(
          { conventionId: convention.id },
          {
            userId: user.id,
          },
        );
        expectToEqual(fetchedConvention, {
          ...convention,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
          agencyCounsellorEmails: [],
          agencyValidatorEmails: [user.email],
        });
      });

      it("that establishment rep is also the inclusion connected user", async () => {
        const user: User = {
          id: "my-user-id",
          email: convention.signatories.establishmentRepresentative.email,
          firstName: "John",
          lastName: "Doe",
          externalId: "john-external-id",
          createdAt: new Date().toISOString(),
        };

        uow.userRepository.users = [user];
        uow.agencyRepository.agencies = [toAgencyWithRights(agency)];

        const jwtPayload: InclusionConnectDomainJwtPayload = {
          userId: user.id,
        };

        const fetchedConvention = await getConvention.execute(
          { conventionId: convention.id },
          jwtPayload,
        );

        expectToEqual(fetchedConvention, {
          ...convention,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
          agencyCounsellorEmails: agency.counsellorEmails,
          agencyValidatorEmails: agency.validatorEmails,
        });
      });

      it("that establishment tutor is also the inclusion connected user", async () => {
        uow.conventionRepository.setConventions([
          conventionWithEstablishmentTutor,
        ]);
        const user: User = {
          id: "my-tutor-user-id",
          email: conventionWithEstablishmentTutor.establishmentTutor.email,
          firstName: "John",
          lastName: "Doe",
          externalId: "john-tutor-external-id",
          createdAt: new Date().toISOString(),
        };
        uow.userRepository.users = [user];
        uow.agencyRepository.agencies = [toAgencyWithRights(agency)];

        const jwtPayload: InclusionConnectDomainJwtPayload = {
          userId: user.id,
        };

        const fetchedConvention = await getConvention.execute(
          { conventionId: conventionWithEstablishmentTutor.id },
          jwtPayload,
        );

        expectToEqual(fetchedConvention, {
          ...conventionWithEstablishmentTutor,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
          agencyCounsellorEmails: agency.counsellorEmails,
          agencyValidatorEmails: agency.validatorEmails,
        });
      });

      it("the user is backofficeAdmin", async () => {
        const backofficeAdminUser = new InclusionConnectedUserBuilder()
          .withIsAdmin(true)
          .buildUser();

        uow.userRepository.users = [backofficeAdminUser];

        const conventionResult = await getConvention.execute(
          { conventionId: convention.id },
          {
            userId: backofficeAdminUser.id,
          },
        );

        expectToEqual(conventionResult, {
          ...convention,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
          agencyCounsellorEmails: agency.counsellorEmails,
          agencyValidatorEmails: agency.validatorEmails,
        });
      });
    });

    describe("with ConventionJwtPayload", () => {
      beforeEach(() => {
        uow.userRepository.users = [counsellor, validator];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [counsellor.id]: {
              isNotifiedByEmail: false,
              roles: ["counsellor"],
            },
            [validator.id]: { isNotifiedByEmail: false, roles: ["validator"] },
          }),
        ];
      });
      it.each([
        {
          role: "establishment-representative",
          email: convention.signatories.establishmentRepresentative.email,
        },
        {
          role: "establishment-tutor",
          email: convention.establishmentTutor.email,
        },
        {
          role: "beneficiary",
          email: convention.signatories.beneficiary.email,
        },
        {
          role: "counsellor",
          email: counsellor.email,
        },
        {
          role: "validator",
          email: validator.email,
        },
      ] as const)(
        "user '$role' has no inclusion connect",
        async ({ role, email }: { role: Role; email: string }) => {
          const payload: ConventionJwtPayload = {
            role,
            emailHash: makeEmailHash(email),
            applicationId: convention.id,
            iat: 1,
            version: 1,
          };

          const conventionResult = await getConvention.execute(
            { conventionId: convention.id },
            payload,
          );

          expectToEqual(conventionResult, {
            ...convention,
            agencyName: agency.name,
            agencyDepartment: agency.address.departmentCode,
            agencyKind: agency.kind,
            agencySiret: agency.agencySiret,
            agencyCounsellorEmails: [counsellor.email],
            agencyValidatorEmails: [validator.email],
          });
        },
      );

      it("user has inclusion connect", async () => {
        const inclusionConnectedUser: User = {
          id: "my-user-id",
          email: "john@mail.com",
          firstName: "John",
          lastName: "Doe",
          externalId: "john-external-id",
          createdAt: new Date().toISOString(),
        };

        uow.userRepository.users = [inclusionConnectedUser];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {
            [inclusionConnectedUser.id]: {
              isNotifiedByEmail: false,
              roles: ["validator"],
            },
          }),
        ];

        const conventionResult = await getConvention.execute(
          { conventionId: convention.id },
          {
            role: "validator",
            emailHash: makeEmailHash(inclusionConnectedUser.email),
            applicationId: convention.id,
          },
        );

        expectToEqual(conventionResult, {
          ...convention,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
          agencyCounsellorEmails: [],
          agencyValidatorEmails: [inclusionConnectedUser.email],
        });
      });

      it("user is a PeAdvisor", async () => {
        const peAdvisorEmail = "pe-advisor@mail.fr";
        const peConnectedConvention = new ConventionDtoBuilder(convention)
          .withFederatedIdentity({
            provider: "peConnect",
            token: "some-id",
            payload: {
              advisor: {
                email: peAdvisorEmail,
                firstName: "john",
                lastName: "doe",
                type: "PLACEMENT",
              },
            },
          })
          .build();
        uow.conventionRepository.setConventions([peConnectedConvention]);
        const payload: ConventionJwtPayload = {
          role: "validator",
          emailHash: makeEmailHash(peAdvisorEmail),
          applicationId: convention.id,
          iat: 1,
          version: 1,
        };

        const conventionResult = await getConvention.execute(
          { conventionId: convention.id },
          payload,
        );

        expectToEqual(conventionResult, {
          ...peConnectedConvention,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
          agencyCounsellorEmails: [counsellor.email],
          agencyValidatorEmails: [validator.email],
        });
      });
    });
  });
});
