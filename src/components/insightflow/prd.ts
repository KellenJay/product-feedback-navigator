export type PRDEffort = "S" | "M" | "L" | "XL";
export type PRDPriority = "P1" | "P2" | "P3";

export interface PRDUserStory {
  id: string;
  title: string;
  story: string;
  acceptanceCriteria: string[];
  designNotes: string;
  devNotes: string;
  estimatedEffort: PRDEffort;
  priority: PRDPriority;
}

export interface PRDEpic {
  id: string;
  title: string;
  description: string;
  businessValue: string;
  userStories: PRDUserStory[];
}

export interface PRDExecutionPhase {
  phase: string;
  sprint: string;
  focus: string;
  tasks: string[];
  dependencies: string[];
  risks: string[];
  recommendedApproach: string;
}

export interface PRD {
  title: string;
  version: string;
  status: string;
  overview: string;
  problemStatement: string;
  goals: string[];
  nonGoals: string[];
  epics: PRDEpic[];
  executionGuide: PRDExecutionPhase[];
  successMetrics: string[];
  openQuestions: string[];
}

export interface PRDResponse {
  prd: PRD;
}

export function effortClasses(e: PRDEffort): string {
  switch (e) {
    case "S":
      return "bg-success/15 text-success";
    case "M":
      return "bg-primary/15 text-primary";
    case "L":
      return "bg-warning/15 text-warning";
    case "XL":
      return "bg-destructive/15 text-destructive";
  }
}

export function buildPRDText(prd: PRD): string {
  const L: string[] = [];
  L.push(`# ${prd.title}`);
  L.push(`${prd.version} · ${prd.status}`);
  L.push("");
  L.push("## Overview");
  L.push(prd.overview);
  L.push("");
  L.push("## Problem statement");
  L.push(prd.problemStatement);
  L.push("");
  L.push("## Goals");
  prd.goals.forEach((g, i) => L.push(`${i + 1}. ${g}`));
  L.push("");
  L.push("## Non-goals");
  prd.nonGoals.forEach((g) => L.push(`- ${g}`));
  L.push("");
  L.push("## Epics & User Stories");
  for (const e of prd.epics) {
    L.push("");
    L.push(`### ${e.id} — ${e.title}`);
    L.push(e.description);
    L.push(`Business value: ${e.businessValue}`);
    for (const s of e.userStories) {
      L.push("");
      L.push(`#### ${s.id} — ${s.title}  [${s.priority} · Effort ${s.estimatedEffort}]`);
      L.push(`_${s.story}_`);
      L.push("Acceptance criteria:");
      s.acceptanceCriteria.forEach((a) => L.push(`- [ ] ${a}`));
      if (s.designNotes) L.push(`Design notes: ${s.designNotes}`);
      if (s.devNotes) L.push(`Dev notes: ${s.devNotes}`);
    }
  }
  L.push("");
  L.push("## Execution guide");
  for (const p of prd.executionGuide) {
    L.push("");
    L.push(`### ${p.phase} (${p.sprint})`);
    L.push(`Focus: ${p.focus}`);
    if (p.tasks.length) {
      L.push("Tasks:");
      p.tasks.forEach((t) => L.push(`- ${t}`));
    }
    if (p.dependencies.length) {
      L.push("Dependencies:");
      p.dependencies.forEach((t) => L.push(`- ${t}`));
    }
    if (p.risks.length) {
      L.push("Risks:");
      p.risks.forEach((t) => L.push(`- ${t}`));
    }
    L.push(`PM Recommendation: ${p.recommendedApproach}`);
  }
  L.push("");
  L.push("## Success metrics");
  prd.successMetrics.forEach((m, i) => L.push(`${i + 1}. ${m}`));
  L.push("");
  L.push("## Open questions");
  prd.openQuestions.forEach((q) => L.push(`- (Unresolved) ${q}`));
  return L.join("\n");
}
