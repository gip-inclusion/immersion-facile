import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Route } from "type-route";
import {
  ConventionMagicLinkPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
  immersionFacileContactEmail,
  isSignatory,
  SignatoryRole,
  signatoryRoles,
} from "shared";
import { Loader, MainWrapper } from "react-design-system";
import { ConventionFormContainerLayout } from "src/app/components/forms/convention/ConventionFormContainerLayout";
import { ConventionSummary } from "src/app/components/forms/convention/ConventionSummary";
import { conventionSlice } from "../../../core-logic/domain/convention/convention.slice";
import { HeaderFooterLayout } from "../../components/layout/HeaderFooterLayout";
import { commonContent } from "../../contents/commonContent";
import { useConventionTexts } from "../../contents/forms/convention/textSetup";
import { useConvention } from "../../hooks/convention.hooks";
import { useExistingSiret } from "../../hooks/siret.hooks";
import { routes } from "../../routes/routes";
import { ShowErrorOrRedirectToRenewMagicLink } from "./ShowErrorOrRedirectToRenewMagicLink";

interface ConventionSignPageProperties {
  route: Route<typeof routes.conventionToSign>;
}

const useClearConventionOnUnmount = () => {
  const dispatch = useDispatch();
  return useEffect(
    () => () => {
      dispatch(conventionSlice.actions.clearFetchedConvention());
    },
    [],
  );
};

export const ConventionSignPage = ({ route }: ConventionSignPageProperties) => {
  useClearConventionOnUnmount();
  return (
    <HeaderFooterLayout>
      {!route.params.jwt ? (
        <SignPageLayout>
          <Alert
            title={commonContent.invalidLinkNotification.title}
            severity="error"
            description={commonContent.invalidLinkNotification.details}
          />
        </SignPageLayout>
      ) : (
        <>
          {isSignatory(
            decodeMagicLinkJwtWithoutSignatureCheck<ConventionMagicLinkPayload>(
              route.params.jwt,
            ).role,
          ) ? (
            <ConventionSignPageContent jwt={route.params.jwt} />
          ) : (
            <SignPageLayout>
              <Alert
                title={commonContent.incorrectUserNotification.title}
                severity="error"
                description={
                  <>
                    <p>{commonContent.incorrectUserNotification.detail}</p>
                    <p>
                      {commonContent.incorrectUserNotification.contact}{" "}
                      <a href={`mailto:${immersionFacileContactEmail}`}>
                        {immersionFacileContactEmail}
                      </a>
                    </p>
                  </>
                }
              />
            </SignPageLayout>
          )}
        </>
      )}
    </HeaderFooterLayout>
  );
};

type ConventionSignPageContentProperties = {
  jwt: string;
};

const ConventionSignPageContent = ({
  jwt,
}: ConventionSignPageContentProperties): JSX.Element => {
  const dispatch = useDispatch();
  const { applicationId: conventionId } =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionMagicLinkPayload>(jwt);
  const { convention, fetchConventionError, submitFeedback, isLoading } =
    useConvention({ jwt, conventionId });

  useEffect(() => {
    dispatch(
      conventionSlice.actions.currentSignatoryRoleChanged(extractRole(jwt)),
    );
  }, [jwt]);

  useExistingSiret(convention?.siret);

  if (isLoading) return <Loader />;
  if (fetchConventionError)
    return (
      <ShowErrorOrRedirectToRenewMagicLink
        errorMessage={fetchConventionError}
        jwt={jwt}
      />
    );
  if (submitFeedback.kind === "signedSuccessfully")
    return (
      <MainWrapper layout="boxed">
        <Alert
          severity="success"
          title="Convention signée"
          description="Votre convention a bien été signée, merci. Quand toutes les parties l'auront signée et qu'elle aura été validée, vous la recevrez par email."
        />
      </MainWrapper>
    );

  if (!convention) return <p>{commonContent.conventionNotFound}</p>;

  const t = useConventionTexts(convention.internshipKind);

  return (
    <ConventionFormContainerLayout internshipKind={convention.internshipKind}>
      <>
        {convention.status === "REJECTED" && (
          <Alert
            severity="error"
            title={t.sign.rejected.title}
            description={
              <>
                <p className={fr.cx("fr-mt-1w")}>{t.sign.rejected.detail}</p>
                <p>{t.sign.rejected.contact}</p>
              </>
            }
          />
        )}
        {convention.status === "DRAFT" && (
          <Alert
            severity="info"
            title={t.sign.needsModification.title}
            description={
              <>
                <p className={fr.cx("fr-mt-1w")}>
                  {t.sign.needsModification.detail}
                </p>
                <span
                  className={
                    //fr.cx("block") is not supported
                    "block"
                  }
                >
                  <a {...routes.conventionImmersion({ jwt }).link}>
                    {t.sign.needsModification.editionLink}
                  </a>
                </span>
              </>
            }
          />
        )}
        {convention.status !== "DRAFT" && convention.status !== "REJECTED" && (
          <ConventionSummary />
        )}
      </>
    </ConventionFormContainerLayout>
  );
};

const extractRole = (jwt: string): SignatoryRole => {
  const role =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionMagicLinkPayload>(
      jwt,
    ).role;
  if (isSignatory(role)) return role;
  throw new Error(
    `Only ${signatoryRoles.join(", ")} are allow to sign, received ${role}`,
  );
};

const SignPageLayout = ({
  children,
}: {
  children: React.ReactElement;
}): JSX.Element => (
  <div
    className={fr.cx(
      "fr-grid-row",
      "fr-grid-row--center",
      "fr-grid-row--gutters",
    )}
  >
    <div className={fr.cx("fr-col-lg-8", "fr-p-2w")}>{children}</div>
  </div>
);
