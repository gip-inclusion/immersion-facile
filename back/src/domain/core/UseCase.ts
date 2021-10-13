import { MagicLinkPayload } from "../../shared/tokens/MagicLinkPayload";

export type UseCase<T, R = void> = {
  execute(params: T, jwtPayload?: MagicLinkPayload): Promise<R>;
};
