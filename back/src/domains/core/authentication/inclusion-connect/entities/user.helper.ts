import { Email, UserId } from "shared";
import { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";

type CreateUserInfo = {
  email: Email;
  firstName?: string;
  lastName?: string;
};

export const createOrGetUserIdByEmail = async (
  uow: UnitOfWork,
  timeGateway: TimeGateway,
  uuidGenerator: UuidGenerator,
  userInfo: CreateUserInfo,
): Promise<UserId> => {
  const user = await uow.userRepository.findByEmail(userInfo.email);
  return user
    ? user.id
    : createUser(uow, uuidGenerator.new(), userInfo, timeGateway.now());
};

export const emptyName = "";

const createUser = async (
  uow: UnitOfWork,
  userId: UserId,
  userInfo: CreateUserInfo,
  createdAt: Date,
): Promise<UserId> => {
  await uow.userRepository.save({
    id: userId,
    email: userInfo.email,
    createdAt: createdAt.toISOString(),
    externalId: null,
    firstName: userInfo.firstName ?? emptyName,
    lastName: userInfo.lastName ?? emptyName,
  });
  return userId;
};
