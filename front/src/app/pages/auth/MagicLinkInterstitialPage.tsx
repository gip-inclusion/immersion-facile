import Button from "@codegouvfr/react-dsfr/Button";
import { MainWrapper, PageHeader } from "react-design-system";
import { useDispatch } from "react-redux";
import { domElementIds } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { type routes, useRoute } from "src/app/routes/routes";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import type { Route } from "type-route";

export const MagicLinkInterstitialPage = () => {
  const { params } = useRoute() as Route<typeof routes.magicLinkInterstitial>;
  const { code, state, email } = params;
  const dispatch = useDispatch();
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        <PageHeader title="Connexion à Immersion Facilitée" />
        <p>
          Vous êtes en train de vous connecter à Immersion Facilitée via le
          compte {email}, souhaitez-vous continuer ?
        </p>
        <Button
          id={domElementIds.magicLinkInterstitial.confirmLoginButton}
          onClick={() => {
            dispatch(
              authSlice.actions.confirmLoginByMagicLinkRequested({
                code,
                state,
                email,
                feedbackTopic: "magic-link-interstitial",
              }),
            );
          }}
        >
          Oui, me connecter à Immersion Facilitée
        </Button>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
