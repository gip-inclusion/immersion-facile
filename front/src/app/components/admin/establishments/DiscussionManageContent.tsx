import Alert from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { WithDiscussionId } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";

type DiscussionManageContentProps = WithDiscussionId;

export const DiscussionManageContent = ({
  discussionId,
}: DiscussionManageContentProps): JSX.Element => {
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );

  if (!inclusionConnectedJwt)
    return (
      <Alert
        severity="error"
        title="Inclusion connect"
        description="Vous n'êtes pas inclusion connecté."
      />
    );
  return (
    <>
      <div>{discussionId}</div>
      <div>{JSON.stringify(inclusionConnectedJwt)}</div>
    </>
  );
};
