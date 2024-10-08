import React from "react";

type UserNameAndEmailInTableProps = {
  firstName?: string;
  lastName?: string;
  email: string;
};

export const NameAndEmailInTable = ({
  firstName,
  lastName,
  email,
}: UserNameAndEmailInTableProps) => {
  const hasFirstNameOrLastName = firstName || lastName;
  return (
    <>
      {hasFirstNameOrLastName ? (
        <>
          <strong>
            {firstName} {lastName}
          </strong>
          <br />
        </>
      ) : null}
      {email}
    </>
  );
};
