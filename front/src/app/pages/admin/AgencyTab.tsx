import { prop } from "ramda";
import React, { useEffect, useState } from "react";
import {
  ArrayDropdown,
  DsfrTitle,
  Notification,
} from "react-design-system/immersionFacile";
import { AgencyDto } from "shared/src/agency/agency.dto";
import { propEq } from "src/../../shared/src/ramdaExtensions/propEq";
import { agencyGateway } from "src/app/config/dependencies";
import { useAdminToken } from "src/hooks/useAdminToken";
import { AgencyDetails } from "src/uiComponents/admin/AgencyDetails";
import { WithBackground } from "src/uiComponents/admin/WithBackground";
import "./Admin.css";

type ActivationResult = {
  status: "success" | "error";
  text: string;
  message: string;
};

export const AgencyTab = () => {
  const adminToken = useAdminToken();
  const [agenciesNeedingReview, setAgenciesNeedingReview] = useState<
    AgencyDto[]
  >([]);

  const [activationButtonDisabled, setActivationButtonDisabled] =
    useState(true);

  const [activationResult, setActivationResult] = useState<
    ActivationResult | undefined
  >();

  const fetchAgenciesNeedingReview = () => {
    agencyGateway.listAgenciesNeedingReview(adminToken).then(
      (agencies) => {
        setAgenciesNeedingReview(agencies);
      },
      (error: any) => {
        // eslint-disable-next-line no-console
        console.log("setAgenciesNeedingReview", error);
      },
    );
  };

  useEffect(fetchAgenciesNeedingReview, []);

  const [selectedAgency, setSelectedAgency] = useState<AgencyDto | undefined>();

  useEffect(() => setActivationResult(undefined), [selectedAgency?.id]);

  const filterChanged = (selectedAgencyName?: string) => {
    if (!selectedAgencyName) {
      setSelectedAgency(undefined);
      return;
    }
    setSelectedAgency(
      agenciesNeedingReview.find(propEq("name", selectedAgencyName)),
    );
    setActivationButtonDisabled(false);
  };

  const validateAgency = (agency: AgencyDto) => {
    setActivationButtonDisabled(true);
    return agencyGateway
      .validateAgency(adminToken, agency.id)
      .then(() => {
        setActivationResult({
          status: "success",
          text: "Agence activée",
          message: "L'agence a bien été activée !",
        });
      })
      .catch((error) => {
        setActivationResult({
          status: "error",
          text: "Problème lors de l'activation",
          message: error.message,
        });
      })
      .finally(() => {
        fetchAgenciesNeedingReview();
      });
  };

  const numberOfAgenciesToReview = agenciesNeedingReview.length;

  return (
    <div>
      <DsfrTitle level={5} text="Activer des agences" />
      <WithBackground>
        <div className="w-2/3">
          {numberOfAgenciesToReview > 0
            ? `${numberOfAgenciesToReview} agence${
                numberOfAgenciesToReview === 1 ? "" : "s"
              } en attente d'activation`
            : "Aucune agence en attente d'activation"}
          <ArrayDropdown
            label="Sélectionner une agence"
            options={agenciesNeedingReview.map(prop("name"))}
            onSelect={filterChanged}
            allowEmpty={true}
            defaultSelectedOption={selectedAgency?.name}
          />
        </div>
      </WithBackground>
      {selectedAgency && (
        <div className="p-4 flex flex-col gap-4">
          <AgencyDetails agency={selectedAgency} />
          <button
            disabled={activationButtonDisabled}
            className="fr-btn flex"
            onClick={() => selectedAgency && validateAgency(selectedAgency)}
          >
            Activer cette agence
          </button>
          {activationResult && (
            <Notification
              type={activationResult.status}
              title={activationResult.text}
            >
              {activationResult.message}
            </Notification>
          )}
        </div>
      )}
    </div>
  );
};
