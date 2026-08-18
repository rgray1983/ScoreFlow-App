export function shouldShowResumeMatch(input: {
  liveActive: boolean;
  hasRecovery: boolean;
  matchHasProgress: boolean;
}): boolean {
  return input.liveActive || input.hasRecovery || input.matchHasProgress;
}

export function shouldPromptLiveReturn(input: {
  liveActive: boolean;
  hasRecovery: boolean;
  returnedToApp: boolean;
}): boolean {
  return input.returnedToApp && (input.liveActive || input.hasRecovery);
}
