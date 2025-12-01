import { useDispatch } from "react-redux";
import {
  authExpiredMessage,
  getJwtExpiredSinceInSeconds,
  handleJWTStringPossiblyContainingJsonError,
} from "shared";
import { FullPageFeedback } from "src/app/components/feedback/FullpageFeedback";
import { WithFeedbackReplacer } from "src/app/components/feedback/WithFeedbackReplacer";
import { ErrorPage } from "src/app/pages/error/ErrorPage";
import { ContactUsButton, HomeButton } from "src/app/pages/error/front-errors";
import { type routes, useRoute } from "src/app/routes/routes";
import { loginIllustration } from "src/assets/img/illustrations";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import type { Route } from "type-route";

export const MagicLinkInterstitialPage = () => {
  const { params } = useRoute() as Route<typeof routes.magicLinkInterstitial>;
  const { code, state, email } = params;
  const dispatch = useDispatch();
  const expiredSinceSeconds = getJwtExpiredSinceInSeconds(code, new Date());
  if (expiredSinceSeconds) {
    return (
      <ErrorPage
        title="Lien expiré"
        buttons={[HomeButton, ContactUsButton]}
        error={{
          message: authExpiredMessage(
            `${Math.ceil(expiredSinceSeconds / 60)} minutes`,
          ),
          name: "Erreur de connexion",
        }}
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
            buttons={[HomeButton, ContactUsButton]}
            error={{
              message: messageText,
              name: title ?? "Erreur de connexion",
            }}
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
