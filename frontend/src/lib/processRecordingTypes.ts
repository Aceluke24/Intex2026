export interface ProcessResidentOption {
  id: string;
  displayName: string;
  caseId: string;
  category: string;
}

export type SessionType = "Individual" | "Group";

export type EmotionalTag = "Stable" | "Anxious" | "Hopeful" | "Distressed" | "Resilient" | "Withdrawn";

export interface ProcessSessionEntry {
  id: string;
  residentId: string;
  date: string;
  worker: string;
  sessionType: SessionType;
  emotionalState: EmotionalTag;
  narrativePreview: string;
  emotionalObserved: string;
  narrativeFull: string;
  interventions: string;
  followUp: string;
}

/** Map API/clinical strings to UI tag palette */
export function mapApiEmotionalState(raw: string): EmotionalTag {
  const s = raw.trim();
  const m: Record<string, EmotionalTag> = {
    Calm: "Stable",
    Stable: "Stable",
    Anxious: "Anxious",
    Sad: "Withdrawn",
    Angry: "Distressed",
    Hopeful: "Hopeful",
    Withdrawn: "Withdrawn",
    Happy: "Resilient",
    Distressed: "Distressed",
    Resilient: "Resilient",
  };
  return m[s] ?? "Hopeful";
}
