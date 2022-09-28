import { Form, Formik } from "formik";
import React from "react";
import { ButtonHome, Notification, SubTitle } from "react-design-system";
import { useDispatch } from "react-redux";
import { UserAndPassword } from "shared";
import { userAndPasswordSchema } from "shared";
import { ContainerLayout } from "src/app/layouts/ContainerLayout";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminAuthSlice } from "src/core-logic/domain/admin/adminAuth/adminAuth.slice";
import { TextInput } from "src/uiComponents/form/TextInput";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";

export const PrivateRoute = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  const isAuthenticated = useAppSelector(adminSelectors.auth.isAuthenticated);

  if (!isAuthenticated) return <LoginForm />;
  return children;
};

const LoginForm = () => {
  const dispatch = useDispatch();
  const error = useAppSelector(adminSelectors.auth.error);
  const isLoading = useAppSelector(adminSelectors.auth.isLoading);
  const initialValues: UserAndPassword = { user: "", password: "" };

  return (
    <HeaderFooterLayout>
      <ContainerLayout>
        <Formik
          initialValues={initialValues}
          validationSchema={toFormikValidationSchema(userAndPasswordSchema)}
          onSubmit={(values) => {
            dispatch(adminAuthSlice.actions.loginRequested(values));
          }}
        >
          {() => (
            <Form>
              <SubTitle>Veuillez vous connectez</SubTitle>
              <TextInput label="Utilisateur" name="user" />
              <TextInput label="Mot de passe" name="password" type="password" />
              <ButtonHome disable={isLoading}>Se connecter</ButtonHome>
              {error && (
                <Notification title="Une erreur est survenue" type="error">
                  {error}
                </Notification>
              )}
            </Form>
          )}
        </Formik>
      </ContainerLayout>
    </HeaderFooterLayout>
  );
};
