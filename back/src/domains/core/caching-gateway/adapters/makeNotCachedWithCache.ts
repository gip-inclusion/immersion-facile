import { WithCache } from "../port/WithCache";

export const withNoCache: WithCache = ({ cb }) => cb;
