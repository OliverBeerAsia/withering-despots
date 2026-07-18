import type { ContentRepository, WorldState } from "../narrative/types";

export type CharacterPresentationPose =
  "seated_talk" | "lean_in" | "lean_back" | "signature" | "exhausted";

const PRESENTATION_POSE_BY_NODE_ID: Readonly<Record<string, CharacterPresentationPose>> = {
  sample_gennady_workers_claim: "signature",
  sample_gennady_accident_approach: "lean_in",
  sample_gennady_deflects_role: "lean_back",
  sample_silence_gennady_continues: "exhausted",
  sample_arkady_emergency_claim: "signature",
  sample_arkady_procedural_answer: "lean_back",
  sample_silence_arkady_qualifies: "lean_in",
  sample_attention_arkady_direct: "signature",
  sample_arkady_contradiction_response: "lean_back",
  sample_lev_uncertainty_check: "signature",
  sample_nikolai_responsibility: "lean_in",
};

export interface NarrativeGrayboxProjection {
  readonly focusedCharacterId: string | null;
  readonly presentationPoseByCharacterId: Readonly<Record<string, CharacterPresentationPose>>;
  readonly glassState: string;
  readonly photographState: string;
  readonly televisionState: string;
  readonly doorState: string;
  readonly radioMusicState: "instrumental_low" | "lowered" | "silent";
  readonly attentionOpen: boolean;
  readonly missedTargets: readonly string[];
  readonly complete: boolean;
}

export function selectNarrativeGrayboxProjection(
  repository: ContentRepository,
  state: WorldState,
): NarrativeGrayboxProjection {
  const node = state.currentNodeId === null ? undefined : repository.nodes[state.currentNodeId];
  const presentationPose = node === undefined ? undefined : PRESENTATION_POSE_BY_NODE_ID[node.id];
  const presentationPoseByCharacterId =
    presentationPose === undefined || node?.speakerId === null || node?.speakerId === undefined
      ? {}
      : { [node.speakerId]: presentationPose };
  const rawRadioMusicState = state.objects.radio_music;
  const radioMusicState =
    rawRadioMusicState === "lowered" || rawRadioMusicState === "silent"
      ? rawRadioMusicState
      : "instrumental_low";
  return {
    focusedCharacterId: node?.speakerId ?? null,
    presentationPoseByCharacterId,
    glassState: state.objects.prop_gennady_glass ?? "steady",
    photographState: state.objects.prop_gennady_factory_photo ?? "covered",
    televisionState: state.objects.television ?? "idle",
    doorState: state.objects.street_door ?? state.objects.door ?? "closed",
    radioMusicState,
    attentionOpen: state.mode === "attention",
    missedTargets:
      state.attention === null
        ? []
        : Object.entries(state.attention.outcomes)
            .filter(([, outcome]) => outcome === "missed")
            .map(([target]) => target),
    complete: state.mode === "complete",
  };
}
