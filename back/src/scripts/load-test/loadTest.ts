import http from "k6/http";
import { check, sleep } from "k6";
import { searchImmersionRoutes } from "shared";
import { AppConfig } from "../../config/bootstrap/appConfig";

const appConfig = AppConfig.createFromEnv();
const BASE_URL = appConfig.immersionFacileBaseUrl;
