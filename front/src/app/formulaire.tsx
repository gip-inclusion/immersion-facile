import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "src/app/reduxHooks";
import { actions } from "src/core-logic/store/rootActions";
import { v4 as uuidV4 } from "uuid";

export const Formulaire = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(true);

  const [phone, setPhone] = useState("");

  const emailRegex = /\S+@\S+\.\S+/;

  const validateEmail = (event: React.FormEvent<HTMLInputElement>) => {
    const email = event.currentTarget.value;
    if (emailRegex.test(email)) {
      setIsEmailValid(true);
      setEmail(email)
    } else {
      setIsEmailValid(false);
    }
  };

  return (
    <div className="Formulaire">

      <label className="fr-label" htmlFor="text-input-phone">Numero de téléphone</label>
      <input className="fr-input"
        type="tel"
        id="text-input-phone"
        name="text-input-phone"
        onChange={(evt) => {
          setPhone(evt.target.value);
        }}>
      </input>

      <div className={`fr-input-group${isEmailValid ? '' : ' fr-input-group--error'}`}>
        <label className="fr-label" htmlFor="text-input-error">
          Email
        </label>
        <input className={`fr-input${isEmailValid ? '' : ' fr-input--error'}`}
          aria-describedby="text-input-error-desc-error" 
          type="text"
          id="text-input-email" 
          name="text-input-email"
          onChange={(evt) => {
            validateEmail(evt);
          }}
        />
        {!isEmailValid && <p id="text-input-email-error-desc-error" className="fr-error-text">
          Email incorrect
        </p>}
      </div>


      <button className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left">
        Valider ce formulaire
      </button>

    </div>
  );
};
