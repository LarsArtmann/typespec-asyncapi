export type ErrorHandlingConfig = {
  enableErrorRecovery: boolean;
  enableDetailedLogging: boolean;
  enableStackTraces: boolean;
  errorReportingPath?: string;
  maxErrorHistory: number;
};
