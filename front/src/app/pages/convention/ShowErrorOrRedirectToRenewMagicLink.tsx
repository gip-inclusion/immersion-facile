import { MainWrapper } from "react-design-system";
import { routes } from "src/app/routes/routes";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { Notification } from "react-design-system";
import React from "react";

export const ShowErrorOrRedirectToRenewMagicLink = ({
  errorMessage,
  jwt,
}: {
  errorMessage: string;
  jwt: string;
}) => {
  // un peu fragile, mais j'attends qu'on remette au carré les erreurs front/back. Ca fait un fix rapide (8/12/2022)
  if (errorMessage.includes("Le lien magique est périmé")) {
    routes
      .renewConventionMagicLink({
        expiredJwt: jwt,
        originalURL: window.location.href,
      })
      .replace();
  }

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        <Notification
          title="Erreur lors de la récupération de la convention"
          type="error"
        >
          {errorMessage}
        </Notification>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
