import {
  type ApiConsumer,
  type ConnectedUser,
  type ConnectedUserJwtPayload,
  type ConventionJwtPayload,
  type Email,
  errors,
  type UserId,
} from "shared";
import type { TimeGateway } from "../../../time-gateway/ports/TimeGateway";
import type { UnitOfWork } from "../../../unit-of-work/ports/UnitOfWork";
import type { UuidGenerator } from "../../../uuid-generator/ports/UuidGenerator";

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
    proConnect: null,
    firstName: userInfo.firstName ?? emptyName,
    lastName: userInfo.lastName ?? emptyName,
  });

  return userId;
};

export const getGenericAuthOrThrow = <
  T extends
    | ConnectedUser
    | ConnectedUserJwtPayload
    | ConventionJwtPayload
    | ApiConsumer,
>(
  genericAuth: T | undefined,
): T => {
  if (!genericAuth) throw errors.user.unauthorized();
  return genericAuth;
};
