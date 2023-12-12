import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ActiveOrRejectedStatus,
  AgencyId,
  ManageAgencyToReviewAdminForm,
  withAgencyIdSchema,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { agencyAdminSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.selectors";
import { agencyAdminSlice } from "src/core-logic/domain/admin/agenciesAdmin/agencyAdmin.slice";
import { useAppSelector } from "../../hooks/reduxHooks";
import { AgencyDetails } from "../admin/AgencyDetails";
import "src/assets/admin.css";

const useFetchAgenciesNeedingReview = () => {
  const { agencyNeedingReviewOptions, agencyNeedingReview } = useAppSelector(
    agencyAdminSelectors.agencyState,
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(agencyAdminSlice.actions.fetchAgenciesNeedingReviewRequested());
  }, [dispatch]);

  return {
    agencyNeedingReviewOptions,
    agencyNeedingReview,
  };
};

export const ActivateAgency = () => {
  const { agencyNeedingReviewOptions, agencyNeedingReview } =
    useFetchAgenciesNeedingReview();

  const dispatch = useDispatch();

  const updateAgencyStatus = (status: ActiveOrRejectedStatus) => {
    if (!agencyNeedingReview) return;
    dispatch(
      agencyAdminSlice.actions.updateAgencyNeedingReviewStatusRequested({
        id: agencyNeedingReview.id,
        status,
      }),
    );
  };

  const setSelectedAgencyNeedingReviewId = (values: {
    agencyId: AgencyId | undefined;
  }) => {
    if (!values.agencyId) return;
    dispatch(
      agencyAdminSlice.actions.setSelectedAgencyNeedingReviewId(
        values.agencyId,
      ),
    );
  };

  const methods = useForm<ManageAgencyToReviewAdminForm>({
    mode: "onTouched",
    defaultValues: {
      agencyId: undefined,
    },
    resolver: zodResolver(withAgencyIdSchema),
  });
  const { register, handleSubmit, formState } = methods;

  const getFieldError = makeFieldError(formState);

  return (
    <>
      <h5 className={fr.cx("fr-h5", "fr-mb-2w", "fr-mt-4w")}>
        Activer ou Rejeter une agence
      </h5>
      <div className={fr.cx("fr-px-6w", "fr-py-4w", "fr-card")}>
        <form onSubmit={handleSubmit(setSelectedAgencyNeedingReviewId)}>
          <Input
            label={`${agencyNeedingReviewOptions.length} agence(s) en attente de revue`}
            nativeInputProps={{
              ...register("agencyId"),
            }}
            {...getFieldError("agencyId")}
          />
          <Button
            type="submit"
            title="Examiner cette agence"
            disabled={!formState.isValid}
          >
            Examiner cette agence
          </Button>
        </form>

        <AgencyDetails />
        {agencyNeedingReview?.id && (
          <ButtonsGroup
            className={fr.cx("fr-mt-4w")}
            buttonsEquisized
            alignment="center"
            inlineLayoutWhen="always"
            buttons={[
              {
                iconId: "fr-icon-checkbox-fill",
                children: "Activer cette agence",
                priority: "primary",
                onClick: () => updateAgencyStatus("active"),
              },
              {
                iconId: "fr-icon-alert-fill",
                children: "Rejeter cette agence",
                priority: "secondary",
                onClick: () => updateAgencyStatus("rejected"),
              },
            ]}
          />
        )}
      </div>
    </>
  );
};
