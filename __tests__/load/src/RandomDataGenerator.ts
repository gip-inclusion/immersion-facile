import seedrandom from "seedrandom";
import { LatLonDto } from "./src/SearchImmersionDto";

// prettier-ignore
const ROME_CODES: string[] = [
  "A1203", "K2204", "K1304", "F1704", "I1203", "N4105", "N1105", "F1606", "N1103", "G1603",
  "N4101", "H3302", "I1604", "K1302", "N1101", "M1607", "D1507", "M1601", "G1602", "G1203",
  "F1703", "M1602", "K2303", "F1603", "G1605", "H2206", "D1401", "D1214", "D1106", "K1303",
  "D1102", "G1803", "F1604", "F1607", "G1501", "M1203", "J1301", "D1212", "D1104", "H2102",
  "F1701", "D1202", "F1602", "G1204", "D1505", "I1606", "F1610", "M1805", "H2909", "J1501",
];

const LOCATIONS: LatLonDto[] = [
  { lat: 48.8566, lon: 2.3522 }, // Paris
  { lat: 43.2965, lon: 5.3698 }, // Marseille
  { lat: 45.764, lon: 4.8357 }, // Lyon
  { lat: 43.6047, lon: 1.4442 }, // Toulouse
  { lat: 43.675819, lon: 7.289429 }, // Nice
  { lat: 47.218102, lon: -1.5528 }, // Nantes
  { lat: 43.6119, lon: 3.8772 }, // Montpellier
  { lat: 48.580002, lon: 7.75 }, // Strasbourg
  { lat: 44.8362, lon: -0.5808 }, // Bordeaux
  { lat: 50.6292, lon: 3.0573 }, // Lille
  { lat: 48.1147, lon: -1.6794 }, // Rennes
  { lat: 49.262798, lon: 4.0347 }, // Reims
  { lat: 43.125832, lon: 5.930556 }, // Toulon
  { lat: 45.4397, lon: 4.3872 }, // Saint-Etienne
  { lat: 49.490002, lon: 0.1 }, // Le Havre
  { lat: 45.171547, lon: 5.722387 }, // Grenoble
  { lat: 47.316666, lon: 5.016667 }, // Dijon
  { lat: 47.473614, lon: -0.554167 }, // Angers
  { lat: 45.766701, lon: 4.8803 }, // Villeurbanne
  { lat: 43.838001, lon: 4.361 }, // Nîmes
  { lat: 45.7831, lon: 3.0824 }, // Clermont-Ferrand
  { lat: 43.526302, lon: 5.445429 }, // Aix-en-Provence
  { lat: 48.008224, lon: 0.209856 }, // Le Mans
  { lat: 48.861099, lon: 2.4436 }, // Montreuil
  { lat: 48.9472, lon: 2.2467 }, // Argenteuil
  { lat: 47.750839, lon: 7.335888 }, // Mulhouse
  { lat: 49.18, lon: -0.37 }, // Caen
  { lat: 48.6936, lon: 6.1846 }, // Nancy
  { lat: 50.690102, lon: 3.18167 }, // Roubaix
  { lat: 50.723907, lon: 3.161168 }, // Tourcoing
  { lat: 48.8988, lon: 2.1969 }, // Nanterre
  { lat: 48.792, lon: 2.3985 }, // Vitry-sur-Seine
  { lat: 48.7911, lon: 2.4628 }, // Créteil
  { lat: 43.949318, lon: 4.805528 }, // Avignon
  { lat: 46.580002, lon: 0.34 }, // Poitiers
];

const SEARCH_IMMERSION_DISTANCE_OPTIONS = [1, 2, 5, 10, 20, 50, 100];

export class RandomDataGenerator {
  private readonly rng;

  public constructor(seed: string) {
    this.rng = seedrandom(seed);
  }

  getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(this.rng() * arr.length)];
  }

  public getSearchImmersionRequest() {
    const request = {
      rome: this.getRandomElement(ROME_CODES),
      location: this.getRandomElement(LOCATIONS),
      distance_km: this.getRandomElement(SEARCH_IMMERSION_DISTANCE_OPTIONS),
    };
    return request;
  }
}
