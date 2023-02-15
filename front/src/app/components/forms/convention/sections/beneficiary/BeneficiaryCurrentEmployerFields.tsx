import React, { useEffect } from "react";
import { useFormikContext } from "formik";

import { ConventionDto, getConventionFieldName, Role } from "shared";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { useField } from "formik";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { fr } from "@codegouvfr/react-dsfr";

type BeneficiaryCurrentEmployerFieldsProperties = {
  disabled: boolean | undefined;
};

export const BeneficiaryCurrentEmployerFields = ({
  disabled,
}: BeneficiaryCurrentEmployerFieldsProperties): JSX.Element => {
  const { values } = useFormikContext<ConventionDto>();

  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formFields = getFormFields();
  const [, , { setValue: setBeneficiaryCurrentEmployer }] = useField(
    getConventionFieldName("signatories.beneficiaryCurrentEmployer"),
  );
  const [, , { setValue: setRole }] = useField<Role>(
    getConventionFieldName("signatories.beneficiaryCurrentEmployer.role"),
  );
  useEffect(() => {
    setRole("beneficiary-current-employer");
    return () => setBeneficiaryCurrentEmployer(undefined);
  }, []);
  return (
    <>
      <Alert
        severity="info"
        title="Accord de l'employeur"
        className={fr.cx("fr-mb-2w")}
        description={
          <>
            <p>
              <strong>
                Si l'immersion se fait en dehors du temps de travail, l'accord
                de l'employeur n'est pas nécessaire.
              </strong>
            </p>
            <p>
              Le bénéficiaire peut effectuer son immersion sur son temps de
              travail. Dans ce cas, l’accord de son employeur actuel est
              nécessaire. Le contrat de travail n’est pas suspendu et
              l’employeur actuel couvre le risque accident du travail pendant la
              durée de l’immersion.
            </p>
          </>
        }
      />

      <TextInput
        {...formFields["signatories.beneficiaryCurrentEmployer.businessSiret"]}
        disabled={disabled}
      />
      <TextInput
        {...formFields["signatories.beneficiaryCurrentEmployer.businessName"]}
        disabled={disabled}
      />
      <TextInput
        {...formFields["signatories.beneficiaryCurrentEmployer.firstName"]}
        disabled={disabled}
      />
      <TextInput
        {...formFields["signatories.beneficiaryCurrentEmployer.lastName"]}
        disabled={disabled}
      />
      <TextInput
        {...formFields["signatories.beneficiaryCurrentEmployer.job"]}
        disabled={disabled}
      />
      <TextInput
        {...formFields["signatories.beneficiaryCurrentEmployer.phone"]}
        disabled={disabled}
      />
      <TextInput
        {...formFields["signatories.beneficiaryCurrentEmployer.email"]}
        disabled={disabled}
      />
    </>
  );
};
