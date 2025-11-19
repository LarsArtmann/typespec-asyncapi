/**
 * Grafana panel definition
 */
export type PanelDefinition = {
  readonly title: string;
  readonly type: "graph" | "singlestat" | "table" | "heatmap";
  readonly query: string;
  readonly xPos?: number;
  readonly yPos?: number;
  readonly width?: number;
  readonly height?: number;
};
