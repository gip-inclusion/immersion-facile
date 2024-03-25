import { useEffect, useState } from "react";
import { WithAcquisition } from "shared";
import {
  FrontRouteUnion,
  acquisitionParams,
  useRoute,
} from "src/app/routes/routes";
import { outOfReduxDependencies } from "src/config/dependencies";
import { Route } from "type-route";

type AcquisitionParams = Record<keyof typeof acquisitionParams, string>;

const routeParamsContainsAcquisitionParams = <R extends Route<FrontRouteUnion>>(
  routeParams: R["params"],
): routeParams is R["params"] & AcquisitionParams =>
  ("mtm_campaign" in routeParams && routeParams.mtm_campaign !== undefined) ||
  ("mtm_kwd" in routeParams && routeParams.mtm_kwd !== undefined);

export const useAcquisitionParams = (): WithAcquisition => {
  const { params } = useRoute() as Route<FrontRouteUnion>;
  const initialParams =
    outOfReduxDependencies.sessionDeviceRepository.get("acquisitionParams");
  const initialAcquisitionParams = initialParams ?? {
    acquisitionCampaign: "",
    acquisitionKeyword: "",
  };
  const [acquisitionParams, setAcquisitionParams] = useState<WithAcquisition>(
    initialAcquisitionParams,
  );

  if (routeParamsContainsAcquisitionParams(params)) {
    setAcquisitionParams({
      acquisitionCampaign: params.mtm_campaign,
      acquisitionKeyword: params.mtm_kwd,
    });
  }

  useEffect(() => {
    outOfReduxDependencies.sessionDeviceRepository.set(
      "acquisitionParams",
      acquisitionParams,
    );
  }, [acquisitionParams]);

  return acquisitionParams;
};
