import { equals, values } from "ramda";
import { useEffect, useState } from "react";
import { WithAcquisition } from "shared";
import { acquisitionParams } from "src/app/routes/routes";
import { getUrlParameters } from "src/app/utils/url.utils";
import { outOfReduxDependencies } from "src/config/dependencies";

type AcquisitionParams = Record<keyof typeof acquisitionParams, string>;
type UrlParamsWithAcquisition = Record<string, string> & AcquisitionParams;

const routeParamsContainsAcquisitionParams = (
  routeParams: Record<string, string>,
): routeParams is UrlParamsWithAcquisition =>
  ("mtm_campaign" in routeParams && routeParams.mtm_campaign !== undefined) ||
  ("mtm_kwd" in routeParams && routeParams.mtm_kwd !== undefined);

const areRouteParamsDifferentFromAcquisitionParams = (
  acquisitionParams: WithAcquisition,
  routeParams: UrlParamsWithAcquisition,
) =>
  !equals(
    values(acquisitionParams).filter((param) => param !== undefined),
    values({
      mtm_campaign: routeParams.mtm_campaign,
      mtm_kwd: routeParams.mtm_kwd,
    }).filter((param) => param !== undefined),
  );

export const useSetAcquisitionParams = (): WithAcquisition => {
  const acquisitionParams = useGetAcquisitionParams();
  useEffect(() => {
    outOfReduxDependencies.sessionDeviceRepository.set(
      "acquisitionParams",
      acquisitionParams,
    );
  }, [acquisitionParams]);

  return acquisitionParams;
};

export const useGetAcquisitionParams = () => {
  const urlParams = getUrlParameters(window.location);
  const initialParams =
    outOfReduxDependencies.sessionDeviceRepository.get("acquisitionParams");
  const initialAcquisitionParams = initialParams ?? {
    acquisitionCampaign: "",
    acquisitionKeyword: "",
  };
  const [acquisitionParams, setAcquisitionParams] = useState<WithAcquisition>(
    initialAcquisitionParams,
  );
  if (
    routeParamsContainsAcquisitionParams(urlParams) &&
    areRouteParamsDifferentFromAcquisitionParams(acquisitionParams, urlParams)
  ) {
    setAcquisitionParams({
      acquisitionCampaign: urlParams.mtm_campaign,
      acquisitionKeyword: urlParams.mtm_kwd,
    });
  }
  return acquisitionParams;
};
