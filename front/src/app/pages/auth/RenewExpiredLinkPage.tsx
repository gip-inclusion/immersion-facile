import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { MainWrapper } from "react-design-system";
import {
  type ConventionJwtPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
  type RenewExpiredJwtRequestDto,
} from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import type { Route } from "type-route";
import { RenewMagicLinkButton } from "../error/front-errors";

interface RenewExpiredLinkProps {
  route: Route<typeof routes.renewConventionMagicLink>;
}

export const RenewExpiredLinkContent = (
  renewMagicLinkRequestDto: RenewExpiredJwtRequestDto,
) => {
  const jwtPayload =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
      renewMagicLinkRequestDto.expiredJwt,
    );

  if (!jwtPayload.applicationId)
    return (
      <>
        <p>
          Votre lien est périmé. Pour le renouveler et éditer votre entreprise :
        </p>
        <ol>
          <li>Retournez sur l'accueil entreprises</li>
          <li>Cliquez sur "Modifier mon entreprise" et entrez votre SIRET</li>
          <li>
            Un nouveau lien vous sera envoyé par mail pour modifier votre
            entreprise
          </li>
        </ol>
        <Button
          {...routes.homeEstablishments().link}
          className={fr.cx("fr-mt-2w")}
        >
          Retourner sur l'accueil entreprises
        </Button>
      </>
    );

  return (
    <>
      <div style={{ whiteSpace: "pre-line" }}>
        Votre lien a périmé. Voulez-vous recevoir un nouveau lien ?{" "}
      </div>
      <RenewMagicLinkButton
        renewExpiredJwtRequestDto={renewMagicLinkRequestDto}
      />
    </>
  );
};

export const RenewExpiredLinkPage = ({ route }: RenewExpiredLinkProps) => (
  <HeaderFooterLayout>
    <MainWrapper layout="boxed">
      <RenewExpiredLinkContent
        expiredJwt={route.params.expiredJwt}
        originalUrl={route.params.originalUrl}
      />
    </MainWrapper>
  </HeaderFooterLayout>
);
