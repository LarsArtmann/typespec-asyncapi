export type Violation = string

export type CheckBudgetCompliance = {
	compliant: boolean;
	violations: Violation[]
}