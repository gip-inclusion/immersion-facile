import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button, type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { addYears } from "date-fns";
import { Fragment, useEffect, useState } from "react";
import { useCopyButton } from "react-design-system";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import {
  type ApiConsumer,
  type ApiConsumerJwt,
  domElementIds,
  toDateUTCString,
  toDisplayedDate,
} from "shared";
import { ApiConsumerForm } from "src/app/components/admin/technical-options/ApiConsumerForm";
import { Feedback } from "src/app/components/feedback/Feedback";
import { WithFeedbackReplacer } from "src/app/components/feedback/WithFeedbackReplacer";
import { BackofficeDashboardTabContent } from "src/app/components/layout/BackofficeDashboardTabContent";
import {
  formatApiConsumerContact,
  formatApiConsumerDescription,
  formatApiConsumerName,
  formatApiConsumerRights,
  makeApiConsumerActionButtons,
} from "src/app/contents/admin/apiConsumer";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { useAdminToken } from "src/app/hooks/jwt.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import {
  buttonsToModalButtons,
  createFormModal,
  defaultCancelButton,
  defaultSubmitButton,
} from "src/app/utils/createFormModal";
import { apiConsumerSelectors } from "src/core-logic/domain/apiConsumer/apiConsumer.selector";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { v4 as uuidV4 } from "uuid";

const submitButtonId = {
  id: domElementIds.admin.technicalOptionsTab.apiConsumerSubmitButton,
};

export const apiConsumerModal = createFormModal({
  id: domElementIds.admin.technicalOptionsTab.apiConsumerModal,
  isOpenedByDefault: false,
  formId: domElementIds.admin.technicalOptionsTab.apiConsumerForm,
  submitButton: {
    ...submitButtonId,
  },
});

export const ApiConsumersSection = () => {
  const apiConsumers = useAppSelector(apiConsumerSelectors.apiConsumers);
  const dispatch = useDispatch();
  const adminToken = useAdminToken();
  const feedback = useFeedbackTopic("api-consumer-global");
  const isConsumerAdded =
    feedback?.on === "create" && feedback?.level === "success";
  useEffect(() => {
    adminToken &&
      dispatch(
        apiConsumerSlice.actions.retrieveApiConsumersRequested(adminToken),
      );
    return () => {
      dispatch(apiConsumerSlice.actions.clearApiConsumersRequested());
    };
  }, [adminToken, dispatch]);

  const [currentApiConsumerToEdit, setCurrentApiConsumerToEdit] =
    useState<ApiConsumer>(defaultApiConsumerValues(uuidV4()));
  const onApiConsumerAddClick = () => {
    setCurrentApiConsumerToEdit(defaultApiConsumerValues(uuidV4()));
    apiConsumerModal.open();
  };

  const onEditButtonClick = (apiConsumer: ApiConsumer) => {
    setCurrentApiConsumerToEdit({
      ...apiConsumer,
      expirationDate: toDateUTCString(new Date(apiConsumer.expirationDate)),
      createdAt: toDateUTCString(new Date(apiConsumer.createdAt)),
    });
    apiConsumerModal.open();
  };

  const onConfirmTokenModalClose = () => {
    dispatch(apiConsumerSlice.actions.clearLastCreatedToken());
    adminToken &&
      dispatch(
        apiConsumerSlice.actions.retrieveApiConsumersRequested(adminToken),
      );
    apiConsumerModal.close();
  };

  const lastCreatedToken = useAppSelector(
    apiConsumerSelectors.lastCreatedToken,
  );

  const sortedApiConsumers = [...apiConsumers].sort(
    (apiConsumer1, apiConsumer2) =>
      new Date(apiConsumer2.createdAt).getTime() -
      new Date(apiConsumer1.createdAt).getTime(),
  );

  const closeButton: ButtonProps = {
    children: "Fermer la fenêtre",
    type: "button",
    priority: "primary",
    onClick: apiConsumerModal.close,
  };

  const customModalButtons: ButtonProps[] = isConsumerAdded
    ? [closeButton]
    : [defaultCancelButton, defaultSubmitButton];

  const tableDataFromApiConsumers = sortedApiConsumers.map((apiConsumer) => [
    formatApiConsumerName(apiConsumer.id, apiConsumer.name),
    formatApiConsumerDescription(apiConsumer.description),
    toDisplayedDate({
      date: new Date(apiConsumer.expirationDate),
      withHours: true,
    }),
    formatApiConsumerContact(apiConsumer.contact),
    formatApiConsumerRights(apiConsumer.rights),
    makeApiConsumerActionButtons(apiConsumer, onEditButtonClick),
  ]);
  return (
    <BackofficeDashboardTabContent
      title="Consommateurs API"
      titleAction={
        <Button
          type="button"
          onClick={onApiConsumerAddClick}
          id={domElementIds.admin.technicalOptionsTab.addApiConsumerButton}
        >
          Ajouter un nouveau consommateur
        </Button>
      }
      className={fr.cx("fr-mt-4w")}
    >
      <Table
        fixed
        data={tableDataFromApiConsumers}
        headers={[
          "Id (Nom)",
          "Description",
          "Date d'expiration",
          "Contact",
          "Droits",
          "Actions",
        ]}
      />
      {createPortal(
        <apiConsumerModal.Component
          title="Ajout consommateur api"
          concealingBackdrop
          doSubmitClosesModal={false}
          buttons={buttonsToModalButtons(customModalButtons)}
        >
          <WithFeedbackReplacer
            topic="api-consumer-global"
            renderFeedback={({ level }) => (
              <Fragment key={`${level}-${currentApiConsumerToEdit.id}`}>
                {level === "success" && lastCreatedToken && (
                  <ShowApiKeyToCopy
                    lastCreatedToken={lastCreatedToken}
                    onConfirmTokenModalClose={onConfirmTokenModalClose}
                  />
                )}
                {level === "success" && !lastCreatedToken && (
                  <Feedback topics={["api-consumer-global"]} />
                )}
              </Fragment>
            )}
          >
            <ApiConsumerForm initialValues={currentApiConsumerToEdit} />
          </WithFeedbackReplacer>
        </apiConsumerModal.Component>,
        document.body,
      )}
    </BackofficeDashboardTabContent>
  );
};

const ShowApiKeyToCopy = ({
  lastCreatedToken,
  onConfirmTokenModalClose,
}: {
  lastCreatedToken: ApiConsumerJwt;
  onConfirmTokenModalClose: () => void;
}) => {
  const { copyButtonIsDisabled, copyButtonLabel, onCopyButtonClick } =
    useCopyButton("Copier la clé API");

  return (
    <>
      <Alert
        severity="success"
        title="Consommateur Api ajouté !"
        className={"fr-mb-2w"}
      />
      <Input
        textArea
        label="Token généré"
        hintText="Ce token est à conserver précieusement, il ne sera plus affiché par la suite."
        nativeTextAreaProps={{
          readOnly: true,
          value: lastCreatedToken,
          rows: 5,
        }}
      />

      <ButtonsGroup
        buttons={[
          {
            type: "button",
            children: copyButtonLabel,
            priority: "secondary",
            disabled: copyButtonIsDisabled,
            onClick: () => {
              onCopyButtonClick(lastCreatedToken);
            },
          },
          {
            type: "button",
            children: "J'ai bien copié le token, je peux fermer la fenêtre",
            onClick: onConfirmTokenModalClose,
          },
        ]}
      />
    </>
  );
};

const defaultApiConsumerValues = (id: string): ApiConsumer => ({
  id,
  name: "",
  contact: {
    lastName: "",
    firstName: "",
    job: "",
    phone: "",
    emails: [],
  },
  rights: {
    searchEstablishment: {
      kinds: [],
      scope: "no-scope",
      subscriptions: [],
    },
    convention: {
      kinds: [],
      scope: {
        agencyKinds: [],
      },
      subscriptions: [],
    },
    statistics: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
  },
  createdAt: toDateUTCString(new Date()),
  expirationDate: toDateUTCString(addYears(new Date(), 1)),
});
