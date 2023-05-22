import React from "react";
import { FederatedIdentity, isPeConnectIdentity } from "shared";
import { CopyLink } from "src/app/components/forms/convention/CopyLink";
import { ShareConventionLink } from "src/app/components/forms/convention/ShareConventionLink";

export const ShareActions = (props: {
  isFrozen?: boolean;
  federatedIdentity?: FederatedIdentity;
}) => {
  if (props.isFrozen) return null;
  if (isPeConnectIdentity(props.federatedIdentity)) return null;

  return (
    <>
      <CopyLink />
      <ShareConventionLink />
    </>
  );
};
