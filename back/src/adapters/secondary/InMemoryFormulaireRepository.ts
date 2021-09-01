import { FormulaireEntity } from "../../domain/formulaires/entities/FormulaireEntity";
import { FormulaireRepository } from "../../domain/formulaires/ports/FormulaireRepository";
import { logger } from "../../utils/logger";
import { DemandeImmersionId } from "./../../shared/FormulaireDto";

export type Formulaires = {
  [id: string]: FormulaireEntity;
};

export class InMemoryFormulaireRepository implements FormulaireRepository {
  private _formulaires: Formulaires = {};

  public async save(formulaire: FormulaireEntity): Promise<DemandeImmersionId | undefined> {
    if (this._formulaires[formulaire.id]) {
      return undefined;
    }
    this._formulaires[formulaire.id] = formulaire;
    return formulaire.id;
  }

  public async getAllFormulaires() {
    const formulaires = [];
    for (let id in this._formulaires) {
      formulaires.push(this._formulaires[id]);
    }
    return formulaires;
  }

  public async getFormulaire(id: DemandeImmersionId) {
    return this._formulaires[id];
  }

  public async updateFormulaire(formulaire: FormulaireEntity) {
    if (!this._formulaires[formulaire.id]) {
      return undefined;
    }
    this._formulaires[formulaire.id] = formulaire;
    return formulaire.id;
  }

  setFormulaires(formulaires: Formulaires) {
    this._formulaires = formulaires;
  }
}
