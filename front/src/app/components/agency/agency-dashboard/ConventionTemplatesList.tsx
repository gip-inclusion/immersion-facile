import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { HeadingSection, Loader, Task } from "react-design-system";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import {
  type ConventionTemplate,
  type ConventionTemplateId,
  domElementIds,
  errors,
  type ShareConventionDraftByEmailFromConventionTemplateDto,
  shareConventionDraftByEmailFromConventionTemplateSchema,
  toDisplayedDate,
} from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionDraftSlice } from "src/core-logic/domain/convention/convention-draft/conventionDraft.slice";
import { conventionTemplateSelectors } from "src/core-logic/domain/convention-template/conventionTemplate.selectors";
import { conventionTemplateSlice } from "src/core-logic/domain/convention-template/conventionTemplate.slice";
import type { Route } from "type-route";
import { v4 as uuid } from "uuid";

const shareConventionTemplateModal = createModal({
  isOpenedByDefault: false,
  id: domElementIds.agencyDashboardConventionTemplate.shareAsConventionDraft
    .modal,
});

const makeConventionDraftDtoFromConventionTemplate = (
  conventionTemplate: ConventionTemplate,
) => {
  const { id: _1, name: _2, userId: _3, ...rest } = conventionTemplate;
  return {
    ...rest,
    id: uuid(),
  };
};

export const ConventionTemplatesList = ({
  fromRoute,
}: {
  fromRoute: Route<
    typeof routes.agencyDashboard | typeof routes.establishmentDashboard
  >;
}) => {
  const dispatch = useDispatch();
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const isLoading = useSelector(conventionTemplateSelectors.isLoading);
  const conventionTemplates = useSelector(
    conventionTemplateSelectors.conventionTemplates,
  );

  const onDeleteConventionTemplateClicked = ({
    conventionTemplateId,
  }: {
    conventionTemplateId: ConventionTemplateId;
  }) => {
    if (!connectedUserJwt) throw errors.user.unauthorized();
    dispatch(
      conventionTemplateSlice.actions.deleteConventionTemplateRequested({
        conventionTemplateId,
        jwt: connectedUserJwt,
        feedbackTopic: "convention-template",
      }),
    );
  };

  const shareForm =
    useForm<ShareConventionDraftByEmailFromConventionTemplateDto>({
      mode: "onTouched",
      defaultValues: { recipientEmail: "" },
      resolver: zodResolver(
        shareConventionDraftByEmailFromConventionTemplateSchema,
      ),
    });
  const { register, handleSubmit, formState, reset } = shareForm;

  const openShareModal = (conventionTemplateId: ConventionTemplateId) => {
    const conventionTemplate = conventionTemplates.find(
      (template) => template.id === conventionTemplateId,
    );
    if (!conventionTemplate)
      throw errors.conventionTemplate.notFound({ conventionTemplateId });

    reset({
      recipientEmail: "",
      details: "",
      conventionDraft:
        makeConventionDraftDtoFromConventionTemplate(conventionTemplate),
    });
    shareConventionTemplateModal.open();
  };

  const onShareFormSubmit = (
    values: ShareConventionDraftByEmailFromConventionTemplateDto,
  ) => {
    dispatch(
      conventionDraftSlice.actions.shareConventionDraftByEmailRequested({
        ...values,
        feedbackTopic: "convention-draft",
      }),
    );

    shareConventionTemplateModal.close();
  };

  useEffect(() => {
    if (connectedUserJwt) {
      dispatch(
        conventionTemplateSlice.actions.fetchConventionTemplatesRequested({
          jwt: connectedUserJwt,
          feedbackTopic: "convention-template",
        }),
      );
    }
  }, [connectedUserJwt, dispatch]);

  return (
    <>
      <HeadingSection
        title="Mes modèles de conventions"
        titleAs="h3"
        className={fr.cx("fr-mt-4w")}
        titleAction={
          <Button
            id={
              domElementIds.agencyDashboardConventionTemplate
                .createConventionTemplateButton
            }
            priority="primary"
            iconId="fr-icon-add-line"
            linkProps={
              routes.agencyDashboardConventionTemplate({
                fromRoute: fromRoute.name,
              }).link
            }
          >
            Créer un nouveau modèle
          </Button>
        }
      >
        {isLoading && <Loader />}
        <Feedback
          topics={["convention-template", "convention-draft"]}
          closable
        />
        <div
          className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-mt-1w")}
        >
          {conventionTemplates.length === 0 && (
            <div className={fr.cx("fr-col-12")}>
              <p>Vous n’avez pas encore de modèle de convention.</p>
              <p>
                Les modèles vous permettent de gagner du temps lorsque vous
                devez préparer plusieurs immersions similaires (job dating avec
                une même entreprise, plusieurs immersions pour un même candidat,
                etc.)
              </p>
              <p>
                Créez votre premier modèle pour pré-remplir automatiquement les
                informations qui reviennent souvent, et partagez-le facilement
                avec les personnes en immersion ou les entreprises.
              </p>
            </div>
          )}
          {conventionTemplates.map((template) => (
            <div
              key={template.id}
              id={`convention-template-${template.id}`}
              className={fr.cx("fr-col-12", "fr-col-lg-6")}
            >
              <Task
                title={template.name}
                titleAs="h4"
                footer={`Mise à jour le ${template.updatedAt ? toDisplayedDate({ date: new Date(template.updatedAt), withHours: true }) : ""}`}
                hasBackgroundColor={true}
                buttonsRows={[
                  {
                    id: "edit-delete",
                    content: (
                      <>
                        <Button
                          id={`${domElementIds.agencyDashboardConventionTemplate.editConventionTemplateButton}-${template.id}`}
                          priority="tertiary"
                          iconId="fr-icon-edit-line"
                          iconPosition="right"
                          linkProps={
                            routes.agencyDashboardConventionTemplate({
                              fromRoute: fromRoute.name,
                              conventionTemplateId: template.id,
                            }).link
                          }
                        >
                          Modifier
                        </Button>
                        <Button
                          id={`${domElementIds.agencyDashboardConventionTemplate.deleteConventionTemplateButton}-${template.id}`}
                          priority="tertiary"
                          iconId="fr-icon-delete-bin-line"
                          title="Supprimer"
                          onClick={() =>
                            onDeleteConventionTemplateClicked({
                              conventionTemplateId: template.id,
                            })
                          }
                        />
                      </>
                    ),
                  },
                  {
                    id: "share",
                    content: (
                      <Button
                        id={`${domElementIds.agencyDashboardConventionTemplate.shareAsConventionDraft.button}-${template.id}`}
                        priority="tertiary no outline"
                        iconId="fr-icon-send-plane-line"
                        iconPosition="right"
                        onClick={() => openShareModal(template.id)}
                      >
                        Envoyer en brouillon
                      </Button>
                    ),
                  },
                ]}
              />
            </div>
          ))}
        </div>
      </HeadingSection>
      {createPortal(
        <shareConventionTemplateModal.Component
          title="Partager ce modèle en brouillon"
          buttons={[
            {
              id: domElementIds.agencyDashboardConventionTemplate
                .shareAsConventionDraft.cancelButton,
              children: "Annuler",
              priority: "secondary",
              onClick: shareConventionTemplateModal.close,
            },
            {
              id: domElementIds.agencyDashboardConventionTemplate
                .shareAsConventionDraft.submitButton,
              doClosesModal: false,
              children: "Envoyer le brouillon",
              type: "submit",
              nativeButtonProps: {
                form: domElementIds.agencyDashboardConventionTemplate
                  .shareAsConventionDraft.form,
              },
            },
          ]}
        >
          <form
            id={
              domElementIds.agencyDashboardConventionTemplate
                .shareAsConventionDraft.form
            }
            onSubmit={handleSubmit(onShareFormSubmit)}
            noValidate
          >
            <p className={fr.cx("fr-text--sm", "fr-mb-3w")}>
              Saisissez l'adresse email de la personne à qui vous souhaitez
              partager ce modèle en version brouillon. Elle pourra le modifier
              et créer une convention à partir de celui-ci, sans que cela
              n'impacte votre modèle d'origine.
            </p>
            <p className={fr.cx("fr-text--xs")}>
              Tous les champs marqués d'une astérisque (*) sont obligatoires.
            </p>
            <Input
              label="Adresse e-mail *"
              nativeInputProps={{
                ...register("recipientEmail"),
                id: domElementIds.agencyDashboardConventionTemplate
                  .shareAsConventionDraft.emailInput,
                type: "email",
                placeholder: "nom@exemple.com",
              }}
              state={formState.errors.recipientEmail ? "error" : "default"}
              stateRelatedMessage={formState.errors.recipientEmail?.message}
            />
            <Input
              className={fr.cx("fr-mt-2w")}
              label="Votre message"
              nativeTextAreaProps={{
                ...register("details", {
                  setValueAs: (v) => (v === "" ? undefined : v),
                }),
                id: domElementIds.agencyDashboardConventionTemplate
                  .shareAsConventionDraft.messageInput,
              }}
              textArea
              state={formState.errors.details ? "error" : "default"}
              stateRelatedMessage={formState.errors.details?.message}
            />
          </form>
        </shareConventionTemplateModal.Component>,
        document.body,
      )}
    </>
  );
};
