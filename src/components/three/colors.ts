// Loop colours for 3D scenes: the four brand hues, a little brighter than the UI shades because they are lit.
export const LOOP_HEX = {
  waste: "#930031",
  solar: "#FFA500",
  rain: "#4F9BE0",
  reuse: "#E5C100",
  save: "#2B4A7A",
} as const;
export const LOOP_ORDER = ["waste", "solar", "save", "reuse", "rain"] as const;
export const BRAND = { ink: "#4A0A1C", amber: "#FFA500", peach: "#BEDEFF", cream: "#FFF2A7", burgundy: "#930031" };
