import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { formulaireGateway } from "src/app/main";

export const Formulaire = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [dateStart, setDateStart] = useState<null | Date>(null);
  const [dateEnd, setDateEnd] = useState<null | Date>(null);

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

  const readyToSubmit = () => {
    return isEmailValid && dateStart !== null && dateEnd !== null && (dateEnd > dateStart);
  };

  const submitForm = async () => {
    const formulaireRempli = {
      email,
      dateStart: dateStart!,
      dateEnd: dateEnd!,
    }

    await formulaireGateway.add(formulaireRempli);
  };

  return (
    <div className="Formulaire" id="form-body">

      <div className="fr-input-group">
        <label className="fr-label" htmlFor="text-input-calendar">
          Debut de l'immersion
        </label>
        <div className="fr-input-wrap fr-fi-calendar-line">
          <input className="fr-input" type="date" id="text-input-calendar"
            name="text-input-calendar"
            onChange={(evt) => {
              setDateStart(evt.currentTarget.valueAsDate)

            }}
          />
        </div>
      </div>

      <div className="fr-input-group">
        <label className="fr-label" htmlFor="text-input-calendar">
          Fin de l'immersion
        </label>
        <div className="fr-input-wrap fr-fi-calendar-line">
          <input className="fr-input" type="date" id="text-input-calendar"
            name="text-input-calendar"
            min={dateStart?.toISOString().split('T')[0]}
            value={dateEnd ? dateEnd.toISOString().split('T')[0] : ""}
            onMouseDown={(evt) => {
              if (dateStart && !dateEnd) {
                // An immersion often is one month, so prefill the date for convenience.
                var oneMonthLater = new Date(dateStart);
                oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
                setDateEnd(oneMonthLater);
              }
            }}
            onChange={(evt) => {
              setDateEnd(evt.currentTarget.valueAsDate)
            }}
          />
        </div>
      </div>

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


      <button className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
        disabled={!readyToSubmit()}
        onClick={submitForm}
      >
        Valider ce formulaire
      </button>

    </div>
  );
};
