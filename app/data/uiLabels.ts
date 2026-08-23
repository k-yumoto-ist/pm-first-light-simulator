export const metricLabels = {
  schedule: "納期",
  budget: "コスト",
  quality: "品質",
  trust: "顧客信頼",
  team: "チーム状態",
  teamHealth: "チーム状態",
  businessValue: "事業価値",
  riskExposure: "リスク",
  scopeStability: "スコープ安定性",
  stakeholderAlignment: "関係者合意",
} as const;

export type MetricLabelKey = keyof typeof metricLabels;
export type HealthStatus = "healthy" | "caution" | "warning" | "critical";

export const healthStatusLabels: Record<HealthStatus, string> = {
  healthy: "順調",
  caution: "注意",
  warning: "警戒",
  critical: "危険",
};

export const healthStatusTones: Record<HealthStatus, "positive" | "neutral" | "warning" | "negative"> = {
  healthy: "positive",
  caution: "neutral",
  warning: "warning",
  critical: "negative",
};

export function getHealthStatus(value: number): HealthStatus {
  if (value >= 75) return "healthy";
  if (value >= 55) return "caution";
  if (value >= 35) return "warning";
  return "critical";
}

export function getMetricDisplayValue(key: MetricLabelKey, value: number) {
  return key === "riskExposure" ? 100 - value : value;
}

export function getMetricHealthStatus(key: MetricLabelKey, value: number) {
  return getHealthStatus(getMetricDisplayValue(key, value));
}

export function getMetricStatusLabel(key: MetricLabelKey, value: number) {
  return healthStatusLabels[getMetricHealthStatus(key, value)];
}

export const difficultyLabels = {
  guided: "ガイド付き",
  standard: "標準",
  challenge: "上級",
} as const;

export const pmStyleLabels = {
  "VALUE BALANCER": "バランス調整型",
  "DELIVERY FIRST": "完遂重視型",
  "RISK CONTROLLER": "リスク先読み型",
  "CONSENSUS BUILDER": "合意形成型",
  "TEAM PROTECTOR": "チーム重視型",
} as const;

export function formatTimingLabel(value: string) {
  return value
    .replace(/WEEK\s+(\d+)\s*\/\s*(\d+)/gi, "$1週目 / 全$2週")
    .replace(/DAY\s+(\d+)/gi, "$1日目");
}

export function formatTurnLabel(current: number, total: number) {
  return `ターン ${current} / ${total}`;
}
