const pickRandom = <T>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)];

const pickRandomSubset = <T>(items: readonly T[]): T[] =>
  items.filter(() => Math.random() > 0.5);


export { pickRandom, pickRandomSubset };