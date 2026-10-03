export const featureIconKeys = [
  "lightning",
  "shield",
  "glob",
  "layers",
  "code",
  "check",
] as const;
export type FeatureIcon = (typeof featureIconKeys)[number];

export type AccentColor = "accent" | "amber" | "success";

export interface Feature {
  icon: FeatureIcon;
  title: string;
  desc: string;
  accent: AccentColor;
}

export interface PipelineStep {
  step: string;
  title: string;
  desc: string;
}

export interface ComparisonRow {
  feature: string;
  emitter: string;
  tspAsyncapi: string;
  handwritten: string;
}

export const useCaseIconKeys = [
  "cog",
  "chart",
  "refresh",
  "bolt",
  "check",
] as const;
export type UseCaseIcon = (typeof useCaseIconKeys)[number];

export interface UseCase {
  title: string;
  desc: string;
  icon: UseCaseIcon;
  accent: AccentColor;
}

export const uiIconKeys = [
  "arrow-external",
  "arrow-right",
  "github",
  "menu",
  "close",
  "sun",
  "moon",
  "monitor",
  "star",
] as const;
export type UIIcon = (typeof uiIconKeys)[number];

export type IconName = FeatureIcon | UseCaseIcon | UIIcon;
