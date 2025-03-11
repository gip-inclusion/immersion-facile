import type { WithCache } from "../port/WithCache";

export const withNoCache: WithCache = ({ cb }) => cb;
