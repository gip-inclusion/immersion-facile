import { useDispatch } from "react-redux";
import {
  authExpiredMessage,
  expiredJwtErrorTitle,
  getJwtExpiredSinceInSeconds,
  handleJWTStringPossiblyContainingJsonError,
  oneMinuteInSeconds,
} from "shared";
import { RenewExpiredJwtButton } from "src/app/components/auth/RenewExpiredJwtButton";
import { FullPageFeedback } from "src/app/components/feedback/FullpageFeedback";
import { WithFeedbackReplacer } from "src/app/components/feedback/WithFeedbackReplacer";
import { ErrorPage } from "src/app/pages/error/ErrorPage";
import { ContactUsButton } from "src/app/pages/error/front-errors";
import { type routes, useRoute } from "src/app/routes/routes";
import { loginIllustration } from "src/assets/img/illustrations";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.content";
import type { Route } from "type-route";

export const MagicLinkInterstitialPage = () => {
  const { params } = useRoute() as Route<typeof routes.magicLinkInterstitial>;
  const { code, state, email } = params;
  const dispatch = useDispatch();
  const expiredSinceSeconds = getJwtExpiredSinceInSeconds(code, new Date());
  const feedbackTopic: FeedbackTopic = "renew-expired-jwt-email-auth-code";
  const RenewJwtButton = (
    <RenewExpiredJwtButton
      expiredJwt={code}
      feedbackTopic={feedbackTopic}
      state={state}
    />
  );

  if (expiredSinceSeconds) {
    return (
      <ErrorPage
        title={expiredJwtErrorTitle}
        buttons={[RenewJwtButton, ContactUsButton]}
        error={{
          message: authExpiredMessage(
            Math.ceil(expiredSinceSeconds / oneMinuteInSeconds),
          ),
          name: "Erreur de connexion",
        }}
        feedbackTopic={feedbackTopic}
      />
    );
  }

  return (
    <WithFeedbackReplacer
      topic="magic-link-interstitial"
      renderFeedback={({ title, message }) => {
        const messageText = handleJWTStringPossiblyContainingJsonError(message);
        return (
          <ErrorPage
            title={title ?? "Erreur de connexion"}
            buttons={[RenewJwtButton, ContactUsButton]}
            error={{
              message: messageText,
              name: title ?? "Erreur de connexion",
            }}
            feedbackTopic={feedbackTopic}
          />
        );
      }}
    >
      <FullPageFeedback
        title="Connexion à Immersion Facilitée"
        illustration={loginIllustration}
        content={
          <p>
            Vous êtes en train de vous connecter à Immersion Facilitée via le
            compte <strong>{email}</strong>, souhaitez-vous continuer ?
          </p>
        }
        buttonProps={{
          children: "Oui, me connecter à Immersion Facilitée",
          onClick: () => {
            dispatch(
              authSlice.actions.confirmLoginByMagicLinkRequested({
                code,
                state,
                email,
                feedbackTopic: "magic-link-interstitial",
              }),
            );
          },
        }}
      />
    </WithFeedbackReplacer>
  );
};
