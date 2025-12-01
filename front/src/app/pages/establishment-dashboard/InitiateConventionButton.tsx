import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { equals } from "ramda";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  appellationCodeSchema,
  domElementIds,
  siretSchema,
  zStringMinLength1,
} from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { establishmentSelectors } from "src/core-logic/domain/establishment/establishment.selectors";
import {
  defaultFormEstablishmentValue,
  establishmentSlice,
} from "src/core-logic/domain/establishment/establishment.slice";
import { z } from "zod";

const {
  Component: InitiateConventionModal,
  open: openInitiateConventionModal,
} = createModal({
  isOpenedByDefault: false,
  id: domElementIds.establishmentDashboard.initiateConventionModal,
});

type InitiateConventionFormData = z.infer<typeof initiateConventionFormSchema>;

const initiateConventionFormSchema = z.object({
  siret: siretSchema,
  appellation: appellationCodeSchema,
  location: zStringMinLength1,
});

export const InitiateConventionButton = () => {
  const dispatch = useDispatch();
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);
  const establishment = useAppSelector(
    establishmentSelectors.formEstablishment,
  );
  const isEstablishmentDefault = equals(
    establishment,
    defaultFormEstablishmentValue(),
  );
  const formRef = useRef<HTMLFormElement>(null);
  const currentUserEstablishments = currentUser?.establishments;
  const defaultValues =
    currentUserEstablishments && currentUserEstablishments.length === 1
      ? {
          siret: currentUserEstablishments[0].siret,
          appellation: "",
          location: "",
        }
      : undefined;
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<InitiateConventionFormData>({
    resolver: zodResolver(initiateConventionFormSchema),
    defaultValues,
  });
  const values = watch();

  const onSubmit = (data: InitiateConventionFormData) => {
    const appellation = establishment?.appellations.find(
      (appellation) => appellation.appellationCode === data.appellation,
    );
    routes
      .conventionImmersion({
        siret: data.siret,
        immersionAppellation: appellation,
        immersionAddress: data.location,
        skipIntro: true,
      })
      .push();
  };

  useEffect(() => {
    if (
      !isEstablishmentDefault &&
      establishment.appellations.length === 1 &&
      values.appellation === ""
    ) {
      setValue("appellation", establishment.appellations[0].appellationCode, {
        shouldValidate: true,
      });
    }
  }, [isEstablishmentDefault, establishment.appellations, values, setValue]);

  useEffect(() => {
    if (
      !isEstablishmentDefault &&
      establishment.businessAddresses.length === 1 &&
      values.location === ""
    ) {
      setValue("location", establishment.businessAddresses[0].rawAddress, {
        shouldValidate: true,
      });
    }
  }, [
    isEstablishmentDefault,
    establishment.businessAddresses,
    values,
    setValue,
  ]);
  if (!currentUser || !connectedUserJwt) return null;

  return (
    <>
      <Button
        onClick={() => {
          if (
            isEstablishmentDefault &&
            currentUserEstablishments &&
            currentUserEstablishments.length === 1
          ) {
            dispatch(
              establishmentSlice.actions.fetchEstablishmentRequested({
                establishmentRequested: {
                  siret: currentUserEstablishments[0].siret,
                  jwt: connectedUserJwt,
                },
                feedbackTopic: "unused",
              }),
            );
          }
          openInitiateConventionModal();
        }}
      >
        Initier une convention
      </Button>
      {createPortal(
        <InitiateConventionModal
          title="Initier une convention"
          buttons={[
            {
              doClosesModal: true,
              children: "Fermer",
            },
            {
              id: domElementIds.establishmentDashboard
                .initiateConventionModalButton,
              doClosesModal: false,
              children: "Initier la convention",
              onClick: handleSubmit(onSubmit),
            },
          ]}
        >
          Créer une convention depuis votre espace vous permet de la pré-remplir
          avec vos informations. Sélectionnez l'organisme pour lequel vous
          souhaitez initier la convention.
          <form onSubmit={handleSubmit(onSubmit)} ref={formRef}>
            <Select
              label={"Établissement *"}
              className={fr.cx("fr-mt-2w")}
              placeholder="Sélectionnez un établissement"
              disabled={
                currentUser.establishments &&
                currentUser.establishments.length === 1
              }
              options={
                currentUser?.establishments?.map((establishment) => ({
                  value: establishment.siret,
                  label: establishment.businessName,
                })) ?? []
              }
              nativeSelectProps={{
                ...register("siret"),
                onChange: (event) => {
                  dispatch(
                    establishmentSlice.actions.fetchEstablishmentRequested({
                      establishmentRequested: {
                        siret: event.currentTarget.value,
                        jwt: connectedUserJwt,
                      },
                      feedbackTopic: "unused",
                    }),
                  );
                  setValue("siret", event.currentTarget.value, {
                    shouldValidate: true,
                  });
                },
              }}
              state={errors.siret ? "error" : "default"}
              stateRelatedMessage={errors.siret?.message}
            />
            <Select
              label={"Métier *"}
              placeholder="Sélectionnez un métier"
              className={fr.cx("fr-mt-2w")}
              disabled={
                isEstablishmentDefault ||
                establishment.appellations.length === 1
              }
              options={
                !isEstablishmentDefault
                  ? establishment?.appellations.map((appellation) => ({
                      value: appellation.appellationCode,
                      label: appellation.appellationLabel,
                    }))
                  : []
              }
              nativeSelectProps={register("appellation")}
              state={errors.appellation ? "error" : "default"}
              stateRelatedMessage={errors.appellation?.message}
            />
            <Select
              label={"Lieu d'immersion *"}
              placeholder="Sélectionnez un lieu d'immersion"
              className={fr.cx("fr-mt-2w")}
              disabled={
                isEstablishmentDefault ||
                establishment.businessAddresses.length === 1
              }
              options={
                establishment?.businessAddresses.map((location) => ({
                  value: location.rawAddress,
                  label: location.rawAddress,
                })) ?? []
              }
              nativeSelectProps={register("location")}
              state={errors.location ? "error" : "default"}
              stateRelatedMessage={errors.location?.message}
            />
          </form>
        </InitiateConventionModal>,
        document.body,
      )}
    </>
  );
};
