import { socialWorkers } from "@/lib/caseloadMockData";

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

export const processResidents: ProcessResidentOption[] = [
  { id: "CS-2026-0142", displayName: "Resident A.", caseId: "CS-2026-0142", category: "Domestic violence" },
  { id: "CS-2026-0188", displayName: "Resident B.", caseId: "CS-2026-0188", category: "Trafficking" },
  { id: "CS-2025-0921", displayName: "Resident C.", caseId: "CS-2025-0921", category: "Abuse" },
  { id: "CS-2026-0201", displayName: "Resident D.", caseId: "CS-2026-0201", category: "Exploitation" },
  { id: "CS-2026-0110", displayName: "Resident F.", caseId: "CS-2026-0110", category: "Displacement" },
];

export const initialProcessSessions: ProcessSessionEntry[] = [
  {
    id: "PR-2401",
    residentId: "CS-2026-0142",
    date: "2026-04-04",
    worker: socialWorkers[0],
    sessionType: "Individual",
    emotionalState: "Hopeful",
    narrativePreview: "Explored boundaries and rehearsed safety phrases for upcoming court date…",
    emotionalObserved:
      "Affect brighter than last week; some somatic tension when discussing partner contact. Grounding exercises helped regulate.",
    narrativeFull:
      "Session focused on emotional regulation before the preliminary hearing. Resident identified two trusted contacts and practiced disclosing only what feels safe. Discussed sleep hygiene and journaling as nightly anchors.",
    interventions:
      "Trauma-informed CBT techniques; grounding (5-4-3-2-1); safety planning review with printed copy left in file.",
    followUp:
      "Co-check with legal advocate Apr 8; follow-up session Apr 11; barangay escort confirmed for court.",
  },
  {
    id: "PR-2395",
    residentId: "CS-2026-0142",
    date: "2026-03-28",
    worker: socialWorkers[0],
    sessionType: "Individual",
    emotionalState: "Anxious",
    narrativePreview: "Nightmares resurfaced; validated trauma response and normalized pacing…",
    emotionalObserved:
      "Visible fatigue; speech slightly rushed. Tearful when describing dreams — remained engaged throughout.",
    narrativeFull:
      "Resident reported increased nightmares after media exposure. We reframed arousal as protective signal and updated coping card. Partner agency referral for sleep group discussed.",
    interventions: "Psychoeducation on trauma triggers; breathing pacing; referral packet to sleep wellness group.",
    followUp: "Psychiatry consult if symptoms persist two weeks; peer support circle invite.",
  },
  {
    id: "PR-2388",
    residentId: "CS-2026-0188",
    date: "2026-04-05",
    worker: socialWorkers[2],
    sessionType: "Group",
    emotionalState: "Resilient",
    narrativePreview: "Peer group — shared strengths narrative; interpreter present for full access…",
    emotionalObserved:
      "Participation increased 40% vs prior group; sustained eye contact and reciprocal listening.",
    narrativeFull:
      "Facilitated strengths-based circle with four residents. Resident B. shared a goal related to vocational training; group offered concrete encouragement and accountability partners.",
    interventions: "Group modality; motivational interviewing snippets; accessibility check-in post-session.",
    followUp: "1:1 intake for vocational referral Apr 9; ensure interpreter for all group sessions.",
  },
  {
    id: "PR-2372",
    residentId: "CS-2026-0188",
    date: "2026-04-01",
    worker: socialWorkers[2],
    sessionType: "Individual",
    emotionalState: "Withdrawn",
    narrativePreview: "Low verbal output; used art-based prompt to externalize worry…",
    emotionalObserved: "Minimal speech; fidgeting with sleeves. Responded well to nonverbal modalities.",
    narrativeFull:
      "Used colored paper and metaphor to map worry vs control. Resident placed three worries outside the circle and named one supportive adult.",
    interventions: "Expressive arts prompt; gentle pacing; validation-heavy reflections.",
    followUp: "Short 30-min sessions twice weekly; consider assistive tech trial for group.",
  },
  {
    id: "PR-2360",
    residentId: "CS-2025-0921",
    date: "2026-03-30",
    worker: socialWorkers[1],
    sessionType: "Individual",
    emotionalState: "Stable",
    narrativePreview: "Transition planning — reviewed housing checklist and school transport…",
    emotionalObserved: "Calm, future-oriented tone; appropriate concern about children's adjustment.",
    narrativeFull:
      "Reviewed reintegration milestones and co-developed a two-week checklist with children's school liaison. Resident asked clarifying questions — indicates readiness.",
    interventions: "Solution-focused brief therapy; coordination call with school scheduled live in session.",
    followUp: "Home visit Apr 6; case conference Apr 12.",
  },
  {
    id: "PR-2351",
    residentId: "CS-2026-0201",
    date: "2026-04-05",
    worker: socialWorkers[3],
    sessionType: "Individual",
    emotionalState: "Distressed",
    narrativePreview: "Crisis de-escalation after online harassment incident…",
    emotionalObserved: "Shaking hands; rapid speech at intake, slower by minute 25 after grounding.",
    narrativeFull:
      "Documented incident per safeguarding protocol. Collaborated on immediate device settings and trusted contact tree. PNP follow-up number verified.",
    interventions: "Crisis Triage; grounding; joint safety plan with on-call supervisor.",
    followUp: "24h check-in; digital safety session Apr 7; urgent case conference scheduled.",
  },
];
