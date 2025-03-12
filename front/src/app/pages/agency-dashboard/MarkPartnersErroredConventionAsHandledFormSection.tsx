import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";

import { createPortal } from "react-dom";
import { FormProvider, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type ConnectedUserJwt,
  type MarkPartnersErroredConventionAsHandledRequest,
  domElementIds,
  markPartnersErroredConventionAsHandledRequestSchema,
} from "shared";
import { BroadcastAgainButton } from "src/app/components/admin/conventions/BroadcastAgainButton";
import { Feedback } from "src/app/components/feedback/Feedback";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { partnersErroredConventionSlice } from "src/core-logic/domain/partnersErroredConvention/partnersErroredConvention.slice";

const erroredConventionHandledConfirmationModal = createModal({
  id: domElementIds.manageConventionInclusionConnected
    .erroredConventionHandledModal,
  isOpenedByDefault: false,
});

export const MarkPartnersErroredConventionAsHandledFormSection = ({
  jwt,
  isPeUser,
}: {
  jwt: ConnectedUserJwt;
  isPeUser: boolean;
}) => {
  const methods = useForm<MarkPartnersErroredConventionAsHandledRequest>({
    resolver: zodResolver(markPartnersErroredConventionAsHandledRequestSchema),
    mode: "onTouched",
  });

  const dispatch = useDispatch();
  const onSubmit = ({
    conventionId,
  }: MarkPartnersErroredConventionAsHandledRequest) => {
    dispatch(
      partnersErroredConventionSlice.actions.markAsHandledRequested({
        jwt,
        markAsHandledParams: { conventionId },
        feedbackTopic: "partner-conventions",
      }),
    );
    erroredConventionHandledConfirmationModal.close();
  };
  const conventionIdRegistration = methods.register("conventionId");
  return (
    <section className={fr.cx("fr-mt-4w")}>
      <h2 className={fr.cx("fr-h5", "fr-mb-2w")}>
        Marquer une convention comme traitée
      </h2>
      <div className={fr.cx("fr-card", "fr-px-4w", "fr-py-2w", "fr-mb-4w")}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className={fr.cx("fr-grid-row")}>
            <Input
              label="Id de la convention *"
              nativeInputProps={{
                ...conventionIdRegistration,
                onChange: (event) => {
                  const conventionId = event.currentTarget.value;
                  if (conventionId.length >= 32) {
                    dispatch(
                      conventionSlice.actions.fetchConventionRequested({
                        conventionId: conventionId,
                        jwt,
                      }),
                    );
                  }
                  if (conventionId.length === 0) {
                    dispatch(conventionSlice.actions.clearFetchedConvention());
                  }
                  conventionIdRegistration.onChange(event);
                },
                id: "MarkPartnersErroredConvention-conventionId",
                placeholder: "Id de la convention",
              }}
              className={fr.cx("fr-col-12", "fr-col-lg-6")}
              {...makeFieldError(methods.formState)("conventionId")}
            />
          </div>
          <Button
            title="Marquer la convention comme saisie dans les applicatifs France Travail"
            disabled={!methods.formState.isValid}
            className={fr.cx("fr-mt-2w")}
            onClick={() => erroredConventionHandledConfirmationModal.open()}
            type="button"
          >
            Marquer la convention comme traitée
          </Button>
          <BroadcastAgainButton
            conventionId={methods.watch("conventionId")}
            disabled={!methods.formState.isValid}
          />
          {createPortal(
            <erroredConventionHandledConfirmationModal.Component title="Confirmation de saisie">
              <p>
                Vous allez marquer une convention comme traitée l'avez vous
                saisie manuellement ?
              </p>
              <FormProvider {...methods}>
                <form>
                  <ButtonsGroup
                    className={fr.cx("fr-mt-4w", "fr-mb-2w")}
                    buttonsEquisized
                    alignment="center"
                    inlineLayoutWhen="always"
                    buttons={[
                      {
                        id: "admin-agency-to-review-reject-confirm-button",
                        children: "Oui (Marquer la convention comme traitée)",
                        priority: "primary",
                        type: "submit",
                      },
                      {
                        children:
                          "Non (Ne pas marquer la convention comme traitée)",
                        priority: "secondary",
                        onClick: () =>
                          erroredConventionHandledConfirmationModal.close(),
                      },
                    ]}
                  />
                </form>
              </FormProvider>

              {isPeUser && (
                <p>
                  Si nécessaire, vous pouvez retrouver les instructions
                  détaillées pour la saisie d'une convention en cliquant sur le
                  lien suivant:{" "}
                  <a
                    href="https://poleemploi.sharepoint.com/:p:/r/sites/NAT-Mediatheque-Appropriation/Documents/Immersion_facilitee/Immersion_facilitee/Guide_de_gestion_des_conventions_en_erreur.pptx?d=w489a3c6b6e5148e6bea287ddfadba8c7&csf=1&web=1&e=i1GD5H"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Guide de gestion des conventions en erreur
                  </a>
                </p>
              )}
            </erroredConventionHandledConfirmationModal.Component>,
            document.body,
          )}
        </form>
        <Feedback topic="partner-conventions" />
      </div>
    </section>
  );
};
