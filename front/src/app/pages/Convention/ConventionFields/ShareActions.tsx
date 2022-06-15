import React from "react";
import { FederatedIdentity } from "shared/src/federatedIdentities/federatedIdentity.dto";
import { CopyLink } from "src/app/pages/Convention/CopyLink";
import { ShareLinkByEmail } from "src/app/pages/Convention/ShareLinkByEmail";

export const ShareActions = (props: {
  isFrozen?: boolean;
  federatedIdentity?: FederatedIdentity;
}) => {
  if (props.isFrozen) return null;
  if (props.federatedIdentity !== "noIdentityProvider") return null;
  return (
    <>
      <CopyLink />
      <ShareLinkByEmail />
    </>
  );
};
