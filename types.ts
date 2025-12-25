export interface TreeConfig {
  treeColor: string;
  lightColor: string;
  rotationSpeed: number;
  showSnow: boolean;
  isShiny: boolean;
}

export const INITIAL_CONFIG: TreeConfig = {
  treeColor: "#ff9ec6", // Elegant Rose Pink (Sakura)
  lightColor: "#ffeeb0", // Champagne Gold
  rotationSpeed: 0.2, // Slow and elegant
  showSnow: true,
  isShiny: true,
};