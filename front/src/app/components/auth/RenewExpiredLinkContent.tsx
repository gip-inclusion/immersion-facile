import Alert from "@codegouvfr/react-dsfr/Alert";
import {
  type ConnectedUserJwt,
  type ConnectedUserJwtPayload,
  type ConventionJwt,
  type ConventionJwtPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
  type EmailAuthCodeJwt,
  type EmailAuthCodeJwtPayload,
} from "shared";
import { type routes, useRoute } from "src/app/routes/routes";
import type { Route } from "type-route";
import { RenewMagicLinkButton } from "./RenewMagicLinkButton";

export const RenewExpiredLinkContent = () => {
  const route = useRoute() as Route<typeof routes.renewJwt>;
  const expiredJwt = route.params.expiredJwt as
    | ConventionJwt
    | ConnectedUserJwt
    | EmailAuthCodeJwt;
  const jwtPayload = decodeMagicLinkJwtWithoutSignatureCheck<
    ConventionJwtPayload | ConnectedUserJwtPayload | EmailAuthCodeJwtPayload
  >(expiredJwt);

  if ("userId" in jwtPayload)
    return (
      <>
        <div style={{ whiteSpace: "pre-line" }}>
          Votre lien a périmé. Voulez-vous recevoir un nouveau lien ?{" "}
        </div>
        <RenewMagicLinkButton
          renewExpiredJwtRequestDto={{
            kind: "connectedUser",
            expiredJwt: expiredJwt as ConnectedUserJwt,
          }}
        />
      </>
    );

  if ("applicationId" in jwtPayload)
    return (
      <>
        <div style={{ whiteSpace: "pre-line" }}>
          Votre lien a périmé. Voulez-vous recevoir un nouveau lien ?{" "}
        </div>
        <RenewMagicLinkButton
          renewExpiredJwtRequestDto={{
            kind: "convention",
            expiredJwt: expiredJwt as ConventionJwt,
            originalUrl: route.params.originalUrl,
          }}
        />
      </>
    );

  if ("emailAuthCode" in jwtPayload && route.params.state)
    return (
      <>
        <div style={{ whiteSpace: "pre-line" }}>
          Votre lien a périmé. Voulez-vous recevoir un nouveau lien ?{" "}
        </div>
        <RenewMagicLinkButton
          renewExpiredJwtRequestDto={{
            kind: "emailAuthCode",
            expiredJwt: expiredJwt as EmailAuthCodeJwt,
            state: route.params.state,
          }}
        />
      </>
    );

  return (
    <Alert
      severity="warning"
      title="Renouvellement de lien impossible"
      description="Le type de lien que vous souhaitez renouveler n'est pas supporté"
    />
  );
};
