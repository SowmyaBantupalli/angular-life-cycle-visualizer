export type InteractionStepKind = 'zone' | 'cd' | 'component' | 'validation' | 'observable' | 'dom' | 'destroy';

export interface InteractionStep {
  id: number;
  kind: InteractionStepKind;
  title: string;
  detail: string;
  component?: string;
}

export interface InteractionRecord {
  action: string;
  component: string;
  triggerType: string;
  startedAtLabel: string;
  steps: InteractionStep[];
  hooks: string[];
  componentsChecked: string[];
  componentsSkipped: string[];
  reasons: string[];
  optimization: string;
  uiChange: string;
}

export interface InteractionStart {
  action: string;
  component: string;
  triggerType: string;
  reasons: string[];
  optimization: string;
  uiChange: string;
}
