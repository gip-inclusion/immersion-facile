import { fr } from "@codegouvfr/react-dsfr";
import React, { useEffect } from "react";
import { Loader, Notification } from "react-design-system";
import { useDispatch } from "react-redux";
import {
  ConventionMagicLinkPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
  immersionFacileContactEmail,
  isSignatory,
  SignatoryRole,
  signatoryRoles,
} from "shared";
import { ConventionFormContainerLayout } from "src/app/components/forms/convention/ConventionFormContainerLayout";
import { Route } from "type-route";
import { conventionSlice } from "../../../core-logic/domain/convention/convention.slice";
import { ConventionSignForm } from "../../components/forms/convention/ConventionSignForm";
import { ConventionSignFormIntro } from "../../components/forms/convention/ConventionSignFormIntro";
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

export const ConventionSignPage = ({ route }: ConventionSignPageProperties) => (
  <HeaderFooterLayout>
    {!route.params.jwt ? (
      <SignPageLayout>
        <Notification
          title={commonContent.invalidLinkNotification.title}
          type="error"
        >
          {commonContent.invalidLinkNotification.details}
        </Notification>
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
            <Notification
              title={commonContent.incorrectUserNotification.title}
              type="error"
            >
              <p>{commonContent.incorrectUserNotification.detail}</p>
              <p>
                {commonContent.incorrectUserNotification.contact}{" "}
                <a href={`mailto:${immersionFacileContactEmail}`}>
                  {immersionFacileContactEmail}
                </a>
              </p>
            </Notification>
          </SignPageLayout>
        )}
      </>
    )}
  </HeaderFooterLayout>
);

type ConventionSignPageContentProperties = {
  jwt: string;
};

const ConventionSignPageContent = ({
  jwt,
}: ConventionSignPageContentProperties): JSX.Element => {
  const dispatch = useDispatch();
  const { convention, fetchConventionError, submitFeedback, isLoading } =
    useConvention(jwt);

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
  if (!convention) return <p>{commonContent.conventionNotFound}</p>;

  const t = useConventionTexts(convention.internshipKind);

  return (
    <ConventionFormContainerLayout>
      <>
        {convention.status === "REJECTED" && (
          <Notification type="error" title={t.sign.rejected.title}>
            <p className={fr.cx("fr-mt-1w")}>{t.sign.rejected.detail}</p>
            <p>{t.sign.rejected.contact}</p>
          </Notification>
        )}
        {convention.status === "DRAFT" && (
          <Notification type="info" title={t.sign.needsModification.title}>
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
          </Notification>
        )}
        {convention.status !== "DRAFT" && convention.status !== "REJECTED" && (
          <>
            <ConventionSignFormIntro convention={convention} />
            <ConventionSignForm
              jwt={jwt}
              submitFeedback={submitFeedback}
              convention={convention}
            />
          </>
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
