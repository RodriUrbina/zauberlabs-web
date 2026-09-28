// Cars people can vote for. Add a new entry here to add a new vote tag.
export const VOTE_CARS = [
  { id: "golf", name: "VW Golf" },
  { id: "a4", name: "Audi A4" },
  { id: "w203", name: "Mercedes W203" },
  { id: "is200", name: "Lexus IS200" },
] as const;

export type CarId = (typeof VOTE_CARS)[number]["id"];

export const isCarId = (v: unknown): v is CarId =>
  typeof v === "string" && VOTE_CARS.some((c) => c.id === v);
