import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { match, P } from "ts-pattern";
import { Route } from "type-route";
import {
  ConventionJwtPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
  immersionFacileContactEmail,
  isSignatory,
  SignatoryRole,
  signatoryRoles,
} from "shared";
import { Loader, MainWrapper, PageHeader } from "react-design-system";
import { ConventionSignForm } from "src/app/components/forms/convention/ConventionSignForm";
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
            decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
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
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(jwt);
  const { convention, fetchConventionError, submitFeedback, isLoading } =
    useConvention({ jwt, conventionId });
  useEffect(() => {
    dispatch(
      conventionSlice.actions.currentSignatoryRoleChanged(extractRole(jwt)),
    );
  }, [jwt]);

  useExistingSiret(convention?.siret);

  const t = convention
    ? useConventionTexts(convention.internshipKind)
    : useConventionTexts("immersion");
  return (
    <>
      {match({
        hasConvention: convention !== null, // to avoid Type instantiation is excessively deep and possibly infinite error
        isLoading,
        fetchConventionError,
        submitFeedback,
      })
        .with(
          {
            hasConvention: false,
            fetchConventionError: null,
            isLoading: false,
            submitFeedback: { kind: "idle" },
          },
          () => <Loader />,
        )
        .with({ isLoading: true }, () => <Loader />)
        .with(
          { fetchConventionError: P.string },
          ({ fetchConventionError }) => (
            <ShowErrorOrRedirectToRenewMagicLink
              errorMessage={fetchConventionError}
              jwt={jwt}
            />
          ),
        )
        .with({ submitFeedback: { kind: "signedSuccessfully" } }, () => (
          <MainWrapper layout="boxed">
            <Alert
              severity="success"
              {...t.conventionAlreadySigned}
              title="Convention signée"
              description={`Votre convention (${conventionId}) a bien été signée, merci. Quand toutes les parties l'auront signée et qu'elle aura été validée, vous la recevrez par email.`}
            />
          </MainWrapper>
        ))
        .with({ hasConvention: false }, () => (
          <Alert
            severity="error"
            title="Convention introuvable"
            description={commonContent.conventionNotFound}
          />
        ))
        .with(
          {
            hasConvention: true,
          },
          () => (
            <MainWrapper
              layout={"default"}
              pageHeader={
                <PageHeader
                  title={t.intro.conventionSignTitle}
                  theme="candidate"
                />
              }
            >
              {convention && (
                <>
                  {convention.status === "REJECTED" && (
                    <Alert
                      severity="error"
                      title={t.sign.rejected.title}
                      description={
                        <>
                          <p className={fr.cx("fr-mt-1w")}>
                            {t.sign.rejected.detail}
                          </p>
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
                        <p className={fr.cx("fr-mt-1w")}>
                          {t.sign.needsModification.detail}
                        </p>
                      }
                    />
                  )}
                  {convention.status === "DEPRECATED" && (
                    <Alert
                      severity="error"
                      title={t.sign.deprecated.title}
                      description={
                        <>
                          <p className={fr.cx("fr-mt-1w")}>
                            {t.sign.deprecated.detail}
                          </p>
                          {convention.statusJustification ? (
                            <p>
                              Les raisons sont :{" "}
                              {convention.statusJustification}
                            </p>
                          ) : null}
                        </>
                      }
                    />
                  )}
                  {convention.status !== "DRAFT" &&
                    convention.status !== "REJECTED" &&
                    convention.status !== "DEPRECATED" && (
                      <ConventionSignForm
                        convention={convention}
                        jwt={jwt}
                        submitFeedback={submitFeedback}
                      />
                    )}
                </>
              )}
            </MainWrapper>
          ),
        )
        .exhaustive()}
    </>
  );
};

const extractRole = (jwt: string): SignatoryRole => {
  const role =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(jwt).role;
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
