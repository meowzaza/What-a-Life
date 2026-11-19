import {
  TRAIT_GATED_ACTIONS,
  TRAIT_INTENSITY_META,
  TRAITS_BY_ID,
  type GatedActionDef,
} from '../data/traits';
import { evaluateAppearanceImpact } from './appearance';
import { clamp, round2 } from './rng';
import { computeReputationFromTraits } from './traits';
import type { GameState, Person, ReputationView, TraitIntensity } from './types';

const INTENSITY_RANK: Record<TraitIntensity, number> = {
  subtle: 1,
  clear: 2,
  core: 3,
};

export interface EvaluatedAction {
  action: GatedActionDef;
  available: boolean;
  lockedByTraitId?: string;
  lockReasonTh?: string;
}

/**
 * Way 1 of 4-way Trait Effects: Action Filtering + Explain Reason.
 * Example: `self_doubting` locks `public_speaking_stage` unless social skill >= 25.
 */
export function filterAvailableActions(
  state: GameState,
  actions: readonly GatedActionDef[] = TRAIT_GATED_ACTIONS
): EvaluatedAction[] {
  const { character } = state;
  const activeTraits = character.emergentTraits ?? [];
  const traitMap = new Map(activeTraits.map((t) => [t.id, t]));

  return actions.map((action) => {
    if (character.ageYears < action.minAge) {
      return {
        action,
        available: false,
        lockReasonTh: `ต้องมีอายุอย่างน้อย ${action.minAge} ปีขึ้นไป`,
      };
    }

    for (const block of action.blockedByTraits) {
      const inst = traitMap.get(block.traitId);
      if (!inst) continue;

      if (INTENSITY_RANK[inst.intensity] >= INTENSITY_RANK[block.minIntensity]) {
        if (block.overrideSkill && character.skills[block.overrideSkill.skill] >= block.overrideSkill.min) {
          continue; // Player overcame the trait lock through practice!
        }
        return {
          action,
          available: false,
          lockedByTraitId: block.traitId,
          lockReasonTh: block.reasonTh,
        };
      }
    }

    return {
      action,
      available: true,
    };
  });
}

export interface HazardModifierReport {
  multiplier: number;
  reasons: string[];
}

/**
 * Way 2 of 4-way Trait Effects: Risk / Hazard Probability Modifiers.
 */
export function hazardModifiers(state: GameState): HazardModifierReport {
  const traits = state.character.emergentTraits ?? [];
  let mult = 1.0;
  const reasons: string[] = [];

  for (const inst of traits) {
    const def = TRAITS_BY_ID.get(inst.id);
    if (!def || def.hazardModifier === 1.0) continue;
    const scale = TRAIT_INTENSITY_META[inst.intensity].multiplier;
    const delta = (def.hazardModifier - 1.0) * scale;
    mult *= 1 + delta;
    const pct = Math.round(delta * 100);
    reasons.push(`${def.nameTh} (${pct >= 0 ? `+${pct}` : pct}%)`);
  }

  const tension = state.character.innerTension ?? 0;
  if (tension > 0) {
    const tensionMult = 1 + tension * 0.0015;
    mult *= tensionMult;
    reasons.push(`ความขัดแย้งภายใน (+${Math.round((tensionMult - 1) * 100)}%)`);
  }

  return {
    multiplier: round2(clamp(mult, 0.5, 2.2)),
    reasons,
  };
}

export interface AutopilotTraitBiases {
  spendImpulse: number;
  restBias: number;
  selfDevBias: number;
  riskBias: number;
  socialBias: number;
}

/**
 * Way 3 of 4-way Trait Effects: Autopilot Decision Weighting.
 */
export function getAutopilotTraitBiases(person: Person): AutopilotTraitBiases {
  const bias: AutopilotTraitBiases = {
    spendImpulse: 0,
    restBias: 0,
    selfDevBias: 0,
    riskBias: 0,
    socialBias: 0,
  };

  for (const inst of person.emergentTraits ?? []) {
    const def = TRAITS_BY_ID.get(inst.id);
    if (!def) continue;
    const scale = TRAIT_INTENSITY_META[inst.intensity].multiplier;
    bias.spendImpulse += (def.autopilotBias.spendImpulse ?? 0) * scale;
    bias.restBias += (def.autopilotBias.restBias ?? 0) * scale;
    bias.selfDevBias += (def.autopilotBias.selfDevBias ?? 0) * scale;
    bias.riskBias += (def.autopilotBias.riskBias ?? 0) * scale;
    bias.socialBias += (def.autopilotBias.socialBias ?? 0) * scale;
  }

  return {
    spendImpulse: round2(clamp(bias.spendImpulse, -1.5, 1.5)),
    restBias: round2(clamp(bias.restBias, -1.5, 1.5)),
    selfDevBias: round2(clamp(bias.selfDevBias, -1.5, 1.5)),
    riskBias: round2(clamp(bias.riskBias, -1.5, 1.5)),
    socialBias: round2(clamp(bias.socialBias, -1.5, 1.5)),
  };
}

/**
 * Way 4 of 4-way Trait Effects: NPC Reputation View hook (Reputation vs Reality).
 */
export function computeReputationViews(state: GameState): ReputationView {
  const traits = state.character.emergentTraits ?? [];
  const pers = state.character.personality ?? { ambition: 50, agreeableness: 50, stability: 50 };
  const base = computeReputationFromTraits(traits, pers);
  const appImpact = evaluateAppearanceImpact(state.character);
  const familyOffset = state.employment?.shiftFamilyRelOffset ?? 0;
  return {
    family: Math.round(clamp(base.family + familyOffset, 0, 100)),
    friends: Math.round(clamp(base.friends + appImpact.friendsRepDelta, 0, 100)),
    work: Math.round(clamp(base.work + appImpact.workRepDelta, 0, 100)),
    community: Math.round(clamp(base.community + appImpact.communityRepDelta, 0, 100)),
  };
}
