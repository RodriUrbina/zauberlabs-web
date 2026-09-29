// Built-in cars people can vote for. More cars are added at runtime when you
// approve a visitor suggestion in /de/admin (stored in the Redis hash "cars").
export const VOTE_CARS = [
  { id: "golf", name: "VW Golf" },
  { id: "a4", name: "Audi A4" },
  { id: "w203", name: "Mercedes W203" },
  { id: "is200", name: "Lexus IS200" },
] as const;

/** A car id: one of the built-in ids above, or a slug of an approved suggestion. */
export type CarId = string;
export type Car = { id: CarId; name: string };

export const isBuiltInCar = (v: unknown): v is CarId =>
  typeof v === "string" && VOTE_CARS.some((c) => c.id === v);

/** Shape check for ids coming from requests (the store checks they actually exist). */
export const looksLikeCarId = (v: unknown): v is CarId =>
  typeof v === "string" && /^[a-z0-9-]{1,60}$/.test(v);

/** "BMW 5er (E39)" → "bmw-5er-e39" */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
