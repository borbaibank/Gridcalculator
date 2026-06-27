import type { Direction, GridType } from "@/types/calculator";

export const GRID_SETTINGS_KEY = "gridcalc-settings";

export interface SavedGridSettings {
  upperPrice: string;
  lowerPrice: string;
  currentPrice: string;
  startBotPrice: string;
  gridCount: string;
  margin: string;
  addedMargin: string;
  feePercent: string;
  leverage: string;
  maintenanceMargin: string;
  direction: Direction;
  gridType: GridType;
}

export function loadGridSettings(): SavedGridSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GRID_SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedGridSettings;
  } catch {
    return null;
  }
}

export function saveGridSettings(settings: SavedGridSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GRID_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota errors
  }
}
