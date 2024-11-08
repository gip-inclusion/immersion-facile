import { Email, OAuthGatewayProvider, UserId } from "shared";
import { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";
import { makeProvider } from "../port/OAuthGateway";

export const createOrGetUserIdByEmail = async (
  uow: UnitOfWork,
  timeGateway: TimeGateway,
  uuidGenerator: UuidGenerator,
  email: Email,
): Promise<UserId> => {
  const provider = await makeProvider(uow);
  const user = await uow.userRepository.findByEmail(email, provider);
  return user
    ? user.id
    : createUser(uow, provider, uuidGenerator.new(), email, timeGateway.now());
};

export const emptyName = "";

const createUser = async (
  uow: UnitOfWork,
  provider: OAuthGatewayProvider,
  userId: UserId,
  email: Email,
  createdAt: Date,
): Promise<UserId> => {
  await uow.userRepository.save(
    {
      id: userId,
      email,
      createdAt: createdAt.toISOString(),
      externalId: null,
      firstName: emptyName,
      lastName: emptyName,
    },
    provider,
  );
  return userId;
};
