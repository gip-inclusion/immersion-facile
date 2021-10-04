import * as dotenv from "dotenv";
import {
  makeGetBooleanVariable,
  makeThrowIfNotDefined,
} from "../../shared/envHelpers";

dotenv.config({ path: `${__dirname}/../../../.env` });
const getBooleanVariable = makeGetBooleanVariable(process.env);
const throwIfNotDefined = makeThrowIfNotDefined(process.env);

const jwtPrivateKey = throwIfNotDefined("JWT_PRIVATE_KEY");
const jwtPublicKey = throwIfNotDefined("JWT_PUBLIC_KEY");
const dev = getBooleanVariable("DEV");

export const ENV = {
  dev,
  jwtPrivateKey,
  jwtPublicKey,
};
