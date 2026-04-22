import { addDays, subDays, subMonths, subYears } from "date-fns";
import {
  ConnectedUserBuilder,
  ConventionDtoBuilder,
  DiscussionBuilder,
  type UserWithAdminRights,
} from "shared";
import type { InMemoryUnitOfWork } from "../../../unit-of-work/adapters/createInMemoryUow";

export const makeUser = (
  overrides: Partial<UserWithAdminRights> & { id: string; email: string },
): UserWithAdminRights => ({
  ...new ConnectedUserBuilder()
    .withId(overrides.id)
    .withEmail(overrides.email)
    .withFirstName(overrides.firstName ?? "Jean")
    .withLastName(overrides.lastName ?? "Dupont")
    .buildUser(),
  lastLoginAt: overrides.lastLoginAt,
});

export const setUsersWithRecentConventions = ({
  now,
  uow,
  users,
}: {
  now: Date;
  uow: InMemoryUnitOfWork;
  users: { id: string; email: string }[];
}) => {
  const twoYearsAgo = subYears(now, 2);
  uow.userRepository.users = users.map(({ id, email }) =>
    makeUser({
      id,
      email,
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    }),
  );

  uow.conventionRepository.setConventions([
    new ConventionDtoBuilder()
      .withId("convention-future")
      .withBeneficiaryEmail(users[0].email)
      .withDateEnd(addDays(now, 30).toISOString())
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .build(),
    new ConventionDtoBuilder()
      .withId("convention-23m")
      .withBeneficiaryEmail(users[1].email)
      .withDateEnd(subMonths(now, 23).toISOString())
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .build(),
  ]);
};

export const setUsersWithRecentEstablishmentExchanges = ({
  now,
  uow,
  users,
}: {
  now: Date;
  uow: InMemoryUnitOfWork;
  users: { id: string; email: string }[];
}) => {
  const twoYearsAgo = subYears(now, 2);
  uow.userRepository.users = users.map(({ id, email }) =>
    makeUser({
      id,
      email,
      lastLoginAt: subDays(twoYearsAgo, 1).toISOString(),
    }),
  );

  uow.discussionRepository.discussions = [
    new DiscussionBuilder()
      .withId("discussion-recent")
      .withExchanges([
        {
          subject: "Test",
          message: "Hello",
          sentAt: subDays(now, 30).toISOString(),
          sender: "establishment",
          firstname: "Estab",
          lastname: "Contact",
          email: users[0].email,
          attachments: [],
        },
      ])
      .build(),
    new DiscussionBuilder()
      .withId("discussion-23m")
      .withExchanges([
        {
          subject: "Recent enough",
          message: "Hello",
          sentAt: subMonths(now, 23).toISOString(),
          sender: "establishment",
          firstname: "Estab",
          lastname: "Contact",
          email: users[1].email,
          attachments: [],
        },
      ])
      .build(),
  ];
};

export const setUserWithOldConventionAndDiscussion = ({
  now,
  uow,
  user,
}: {
  now: Date;
  uow: InMemoryUnitOfWork;
  user: UserWithAdminRights;
}) => {
  const twoYearsAgo = subYears(now, 2);
  uow.userRepository.users = [user];
  uow.conventionRepository.setConventions([
    new ConventionDtoBuilder()
      .withId("old-convention-1")
      .withBeneficiaryEmail(user.email)
      .withDateEnd(subDays(twoYearsAgo, 10).toISOString())
      .build(),
  ]);

  uow.discussionRepository.discussions = [
    new DiscussionBuilder()
      .withId("old-discussion-1")
      .withExchanges([
        {
          subject: "Old",
          message: "Old exchange",
          sentAt: subDays(twoYearsAgo, 10).toISOString(),
          sender: "establishment",
          firstname: "Estab",
          lastname: "Contact",
          email: user.email,
          attachments: [],
        },
      ])
      .build(),
  ];
};
