import promClient from "prom-client";

export const oAuthGetAuthorizationCodeRedirectUrlCount = new promClient.Counter(
  {
    name: "peConnect_oAuthGetAuthorizationCodeRedirectUrl_total",
    help: "The total number of calls to oAuthGetAuthorizationCodeRedirectUrl in PeConnect gateway",
  },
);
export const getUserAndAdvisorsTotalCount = new promClient.Counter({
  name: "peConnect_getUserAndAdvisors_total",
  help: "The number of PeConnect",
});
export const getUserAndAdvisorsSuccessCount = new promClient.Counter({
  name: "peConnect_getUserAndAdvisors_success",
  help: "The number of PeConnect success, where user and advisor info where successfully retrieved",
});
export const getUserSuccessCount = new promClient.Counter({
  name: "peConnect_getUserInfo_success",
  help: "The number of GetUserInfo success",
});
export const getUserInfoErrorCount = new promClient.Counter<"errorType">({
  name: "peConnect_getUserInfo_error",
  help: "The number of GetUserInfo success, broken down by error type",
  labelNames: ["errorType"],
});
export const getAdvisorsInfoSuccessCount = new promClient.Counter({
  name: "peConnect_getAdvisorsInfo_success",
  help: "The number of GetAdvisor success",
});
export const peAdvisorsErrorCount = new promClient.Counter<"errorType">({
  name: "peConnect_advisors_error",
  help: "The number of GetAdvisor success, broken down by error type",
  labelNames: ["errorType"],
});
