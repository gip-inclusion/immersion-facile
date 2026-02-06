import Button from "@codegouvfr/react-dsfr/Button";
import { useDispatch } from "react-redux";
import {
  type ConnectedUserJwt,
  type ConventionJwt,
  domElementIds,
  type EmailAuthCodeJwt,
  type OAuthState,
} from "shared";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.content";

export const RenewExpiredJwtButton = ({
  expiredJwt,
  feedbackTopic,
  state,
  originalUrl,
}: {
  expiredJwt: ConventionJwt | ConnectedUserJwt | EmailAuthCodeJwt;
  feedbackTopic: FeedbackTopic;
  state?: OAuthState;
  originalUrl?: string;
}): React.JSX.Element => {
  const dispatch = useDispatch();
  const onClick = async () => {
    dispatch(
      authSlice.actions.renewExpiredJwtRequested({
        expiredJwt,
        originalUrl,
        state,
        feedbackTopic,
      }),
    );
  };

  const isRequestingRenewExpiredJwt = useAppSelector(
    authSelectors.isRequestingRenewExpiredJwt,
  );

  const renewExpiredJwtFeedback = useFeedbackTopic(feedbackTopic);

  return (
    <Button
      priority="primary"
      disabled={
        isRequestingRenewExpiredJwt ||
        renewExpiredJwtFeedback?.level === "success"
      }
      onClick={onClick}
      nativeButtonProps={{
        id: domElementIds.magicLinkRenewal.renewalButton,
      }}
    >
      Demander un nouveau lien
    </Button>
  );
};
