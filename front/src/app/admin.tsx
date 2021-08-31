import React, { Component } from "react";
import { demandeImmersionGateway } from "src/app/main";
import { routes } from "src/app/routes";
import { DemandeImmersionDto } from "../../../back/src/shared/DemandeImmersionDto";
import { MarianneHeader } from "src/components/MarianneHeader";
import { Route } from "type-route";

class FormulaireDetails extends Component<
  FormulaireAccordeonProps,
  FormulaireAccordeonState
> {
  render() {
    return (
      <>
        {this.props.data.firstName}
        {this.props.data.lastName}
      </>
    );
  }
}

interface FormulaireAccordeonProps {
  data: DemandeImmersionDto;
}
interface FormulaireAccordeonState {
  expanded: boolean;
}
class FormulaireAccordeon extends Component<
  FormulaireAccordeonProps,
  FormulaireAccordeonState
> {
  title() {
    return (
      this.props.data.firstName +
      ", " +
      this.props.data.lastName +
      " chez " +
      this.props.data.businessName +
      " de " +
      this.props.data.dateStart
    );
  }

  id() {
    return this.props.data.firstName + "-accordion";
  }

  constructor(props: any) {
    super(props);
    this.state = { expanded: false };
  }

  render() {
    const toggleExpanded = () => {
      this.setState((prevState) => ({
        expanded: !prevState.expanded,
      }));
    };

    const divClass = this.state.expanded
      ? "fr-collapse fr-collapse--expanded"
      : "fr-collapse";

    return (
      <>
        <section className="fr-accordion">
          {
            <>
              <h3 className="fr-accordion__title">
                <button
                  className="fr-accordion__btn"
                  aria-expanded="false"
                  aria-controls={this.id()}
                  onClick={toggleExpanded}
                >
                  {" "}
                  {this.title()}
                </button>
              </h3>
              <div
                className={divClass}
                id={this.id()}
                style={this.state.expanded ? { maxHeight: "none" } : {}}
              >
                <FormulaireDetails data={this.props.data} />
              </div>
            </>
          }
        </section>
      </>
    );
  }
}

interface AdminState {
  demandeImmersion: Array<DemandeImmersionDto>;
}
interface AdminProps {
  route: Route<typeof routes.admin>;
}

export class Admin extends Component<AdminProps, AdminState> {
  async fetchData() {
    this.setState({ demandeImmersion: await demandeImmersionGateway.getAll() });
  }

  constructor(props: any) {
    super(props);
    this.state = { demandeImmersion: [] };
  }

  componentDidMount() {
    this.fetchData();
  }

  render() {
    return (
      <>
        <MarianneHeader />

        <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
          <div className="fr-col-lg-8 fr-p-2w" style={{ width: "95%" }}>
            <h2>Backoffice</h2>
            <div className="fr-text">
              Bienvenue dans le backoffice ! <br />
              Veuillez autentifier pour acceder aux donnes. <br />
            </div>

            <ul className="fr-accordions-group">
              {this.state.demandeImmersion.map(function (item) {
                return (
                  <li key={item.firstName}>
                    <FormulaireAccordeon data={item} />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </>
    );
  }
}
