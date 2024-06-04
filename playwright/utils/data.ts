export const possibleJobs = [
  "Aide à domicile",
  "Aide-soignant",
  "Ambulancier",
  "Boulanger",
  "Boucher",
  "Jongleur",
  "Pompier",
  "Pâtissier",
  "Plombier",
  "Serrurier",
];

export const possibleAddressQueries = [
  "1 rue de la paix",
  "rue des mimosas",
  "avenue des champs elysées",
  "rue de la république",
];

const data = {
  jobs: possibleJobs,
  addressQueries: possibleAddressQueries,
};

export const getRandomizedData = (dataType: keyof typeof data) => {
  const randomIndex = Math.floor(Math.random() * data[dataType].length);
  return data[dataType][randomIndex];
};
