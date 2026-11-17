import type { ActivityId, DayType, LifestylePresetId, Slot } from '../engine/types';

export type PlannerArchetype =
  | 'infant'
  | 'school_kid'
  | 'teen'
  | 'adult_worker'
  | 'adult_unemployed'
  | 'senior';

export type DayTemplate = Record<Slot, ActivityId>;
export type PresetTemplateGrid = Record<DayType, DayTemplate>;

const INFANT_TEMPLATE: PresetTemplateGrid = {
  weekday: {
    morning: 'hobby_leisure',
    afternoon: 'quiet_rest',
    evening: 'family_time',
    night: 'sleep_full',
  },
  weekend: {
    morning: 'hobby_leisure',
    afternoon: 'quiet_rest',
    evening: 'family_time',
    night: 'sleep_full',
  },
};

const BASE_ARCHETYPE_TEMPLATES: Record<PlannerArchetype, PresetTemplateGrid> = {
  infant: INFANT_TEMPLATE,
  school_kid: {
    weekday: {
      morning: 'school_class',
      afternoon: 'school_class',
      evening: 'family_time',
      night: 'sleep_full',
    },
    weekend: {
      morning: 'hobby_leisure',
      afternoon: 'meet_friends',
      evening: 'family_time',
      night: 'sleep_full',
    },
  },
  teen: {
    weekday: {
      morning: 'school_class',
      afternoon: 'school_class',
      evening: 'self_study',
      night: 'sleep_normal',
    },
    weekend: {
      morning: 'hobby_leisure',
      afternoon: 'meet_friends',
      evening: 'family_time',
      night: 'sleep_normal',
    },
  },
  adult_worker: {
    weekday: {
      morning: 'work_shift',
      afternoon: 'work_shift',
      evening: 'hobby_leisure',
      night: 'sleep_normal',
    },
    weekend: {
      morning: 'family_time',
      afternoon: 'meet_friends',
      evening: 'hobby_leisure',
      night: 'sleep_normal',
    },
  },
  adult_unemployed: {
    weekday: {
      morning: 'self_study',
      afternoon: 'read_review',
      evening: 'family_time',
      night: 'sleep_normal',
    },
    weekend: {
      morning: 'hobby_leisure',
      afternoon: 'meet_friends',
      evening: 'quiet_rest',
      night: 'sleep_normal',
    },
  },
  senior: {
    weekday: {
      morning: 'workout',
      afternoon: 'family_time',
      evening: 'quiet_rest',
      night: 'sleep_full',
    },
    weekend: {
      morning: 'family_time',
      afternoon: 'meet_friends',
      evening: 'hobby_leisure',
      night: 'sleep_full',
    },
  },
};

type PresetOverrideMap = Partial<Record<PlannerArchetype, Partial<PresetTemplateGrid>>>;

const PRESET_OVERRIDES: Record<LifestylePresetId, PresetOverrideMap> = {
  balanced: {},

  study_focus: {
    school_kid: {
      weekday: { morning: 'school_class', afternoon: 'school_class', evening: 'read_review', night: 'sleep_full' },
      weekend: { morning: 'read_review', afternoon: 'self_study', evening: 'family_time', night: 'sleep_full' },
    },
    teen: {
      weekday: { morning: 'school_class', afternoon: 'school_class', evening: 'read_review', night: 'sleep_normal' },
      weekend: { morning: 'read_review', afternoon: 'self_study', evening: 'family_time', night: 'sleep_normal' },
    },
    adult_worker: {
      weekday: { morning: 'work_shift', afternoon: 'work_shift', evening: 'read_review', night: 'sleep_normal' },
      weekend: { morning: 'read_review', afternoon: 'self_study', evening: 'quiet_rest', night: 'sleep_normal' },
    },
    adult_unemployed: {
      weekday: { morning: 'read_review', afternoon: 'self_study', evening: 'read_review', night: 'sleep_normal' },
      weekend: { morning: 'read_review', afternoon: 'self_study', evening: 'family_time', night: 'sleep_normal' },
    },
  },

  kid_play: {
    school_kid: {
      weekday: { morning: 'school_class', afternoon: 'school_class', evening: 'hobby_leisure', night: 'sleep_full' },
      weekend: { morning: 'meet_friends', afternoon: 'hobby_leisure', evening: 'meet_friends', night: 'sleep_full' },
    },
    teen: {
      weekday: { morning: 'school_class', afternoon: 'school_class', evening: 'meet_friends', night: 'sleep_normal' },
      weekend: { morning: 'meet_friends', afternoon: 'hobby_leisure', evening: 'meet_friends', night: 'hobby_leisure' },
    },
  },

  workaholic: {
    adult_worker: {
      weekday: { morning: 'work_shift', afternoon: 'work_shift', evening: 'overtime_work', night: 'sleep_normal' },
      weekend: { morning: 'quiet_rest', afternoon: 'quiet_rest', evening: 'family_time', night: 'sleep_full' },
    },
  },

  skill_grind: {
    adult_worker: {
      weekday: { morning: 'work_shift', afternoon: 'work_shift', evening: 'self_study', night: 'sleep_normal' },
      weekend: { morning: 'self_study', afternoon: 'read_review', evening: 'self_study', night: 'sleep_normal' },
    },
    adult_unemployed: {
      weekday: { morning: 'self_study', afternoon: 'self_study', evening: 'read_review', night: 'sleep_normal' },
      weekend: { morning: 'self_study', afternoon: 'read_review', evening: 'quiet_rest', night: 'sleep_normal' },
    },
  },

  social_party: {
    adult_worker: {
      weekday: { morning: 'work_shift', afternoon: 'work_shift', evening: 'meet_friends', night: 'sleep_normal' },
      weekend: { morning: 'quiet_rest', afternoon: 'meet_friends', evening: 'party_night', night: 'party_night' },
    },
    adult_unemployed: {
      weekday: { morning: 'hobby_leisure', afternoon: 'meet_friends', evening: 'party_night', night: 'sleep_normal' },
      weekend: { morning: 'quiet_rest', afternoon: 'meet_friends', evening: 'party_night', night: 'party_night' },
    },
  },

  friends_only: {
    teen: {
      weekday: { morning: 'school_class', afternoon: 'school_class', evening: 'meet_friends', night: 'sleep_normal' },
      weekend: { morning: 'meet_friends', afternoon: 'meet_friends', evening: 'hobby_leisure', night: 'sleep_normal' },
    },
    adult_worker: {
      weekday: { morning: 'work_shift', afternoon: 'work_shift', evening: 'meet_friends', night: 'sleep_normal' },
      weekend: { morning: 'meet_friends', afternoon: 'meet_friends', evening: 'family_time', night: 'sleep_normal' },
    },
    adult_unemployed: {
      weekday: { morning: 'hobby_leisure', afternoon: 'meet_friends', evening: 'meet_friends', night: 'sleep_normal' },
      weekend: { morning: 'meet_friends', afternoon: 'meet_friends', evening: 'family_time', night: 'sleep_normal' },
    },
    senior: {
      weekday: { morning: 'workout', afternoon: 'meet_friends', evening: 'family_time', night: 'sleep_full' },
      weekend: { morning: 'meet_friends', afternoon: 'meet_friends', evening: 'family_time', night: 'sleep_full' },
    },
  },

  fitness: {
    teen: {
      weekday: { morning: 'school_class', afternoon: 'school_class', evening: 'workout', night: 'sleep_full' },
      weekend: { morning: 'workout', afternoon: 'hobby_leisure', evening: 'family_time', night: 'sleep_full' },
    },
    adult_worker: {
      weekday: { morning: 'work_shift', afternoon: 'work_shift', evening: 'workout', night: 'sleep_full' },
      weekend: { morning: 'workout', afternoon: 'skincare_grooming', evening: 'quiet_rest', night: 'sleep_full' },
    },
    adult_unemployed: {
      weekday: { morning: 'workout', afternoon: 'self_study', evening: 'workout', night: 'sleep_full' },
      weekend: { morning: 'workout', afternoon: 'health_check_rest', evening: 'quiet_rest', night: 'sleep_full' },
    },
    senior: {
      weekday: { morning: 'workout', afternoon: 'health_check_rest', evening: 'family_time', night: 'sleep_full' },
      weekend: { morning: 'workout', afternoon: 'family_time', evening: 'quiet_rest', night: 'sleep_full' },
    },
  },

  homebody: {
    teen: {
      weekday: { morning: 'school_class', afternoon: 'school_class', evening: 'hobby_leisure', night: 'sleep_normal' },
      weekend: { morning: 'hobby_leisure', afternoon: 'hobby_leisure', evening: 'quiet_rest', night: 'sleep_normal' },
    },
    adult_worker: {
      weekday: { morning: 'work_shift', afternoon: 'work_shift', evening: 'hobby_leisure', night: 'sleep_normal' },
      weekend: { morning: 'hobby_leisure', afternoon: 'hobby_leisure', evening: 'quiet_rest', night: 'sleep_normal' },
    },
    adult_unemployed: {
      weekday: { morning: 'hobby_leisure', afternoon: 'hobby_leisure', evening: 'quiet_rest', night: 'sleep_normal' },
      weekend: { morning: 'hobby_leisure', afternoon: 'hobby_leisure', evening: 'quiet_rest', night: 'sleep_normal' },
    },
    senior: {
      weekday: { morning: 'hobby_leisure', afternoon: 'quiet_rest', evening: 'hobby_leisure', night: 'sleep_full' },
      weekend: { morning: 'hobby_leisure', afternoon: 'quiet_rest', evening: 'family_time', night: 'sleep_full' },
    },
  },

  family_first: {
    teen: {
      weekday: { morning: 'school_class', afternoon: 'school_class', evening: 'family_time', night: 'sleep_normal' },
      weekend: { morning: 'family_time', afternoon: 'family_time', evening: 'family_time', night: 'sleep_normal' },
    },
    adult_worker: {
      weekday: { morning: 'work_shift', afternoon: 'work_shift', evening: 'family_time', night: 'sleep_normal' },
      weekend: { morning: 'family_time', afternoon: 'family_time', evening: 'family_time', night: 'sleep_normal' },
    },
    adult_unemployed: {
      weekday: { morning: 'family_time', afternoon: 'self_study', evening: 'family_time', night: 'sleep_normal' },
      weekend: { morning: 'family_time', afternoon: 'family_time', evening: 'quiet_rest', night: 'sleep_normal' },
    },
    senior: {
      weekday: { morning: 'family_time', afternoon: 'family_time', evening: 'family_time', night: 'sleep_full' },
      weekend: { morning: 'family_time', afternoon: 'family_time', evening: 'quiet_rest', night: 'sleep_full' },
    },
  },

  work_and_gig: {
    teen: {
      weekday: { morning: 'school_class', afternoon: 'school_class', evening: 'family_time', night: 'sleep_normal' },
      // 30h school + 2*(4+4) = 46h <= 48h minor limit; daytime/evening only (never night!)
      weekend: { morning: 'side_gig_work', afternoon: 'hobby_leisure', evening: 'side_gig_work', night: 'sleep_normal' },
    },
    adult_worker: {
      weekday: { morning: 'work_shift', afternoon: 'work_shift', evening: 'side_gig_work', night: 'sleep_normal' },
      weekend: { morning: 'quiet_rest', afternoon: 'hobby_leisure', evening: 'family_time', night: 'sleep_normal' },
    },
    adult_unemployed: {
      weekday: { morning: 'side_gig_work', afternoon: 'self_study', evening: 'hobby_leisure', night: 'sleep_normal' },
      weekend: { morning: 'side_gig_work', afternoon: 'meet_friends', evening: 'quiet_rest', night: 'sleep_normal' },
    },
  },

  rest_recover: {
    school_kid: {
      weekday: { morning: 'school_class', afternoon: 'school_class', evening: 'quiet_rest', night: 'sleep_full' },
      weekend: { morning: 'quiet_rest', afternoon: 'hobby_leisure', evening: 'family_time', night: 'sleep_full' },
    },
    teen: {
      weekday: { morning: 'school_class', afternoon: 'school_class', evening: 'quiet_rest', night: 'sleep_full' },
      weekend: { morning: 'quiet_rest', afternoon: 'hobby_leisure', evening: 'quiet_rest', night: 'sleep_full' },
    },
    adult_worker: {
      weekday: { morning: 'work_shift', afternoon: 'work_shift', evening: 'quiet_rest', night: 'sleep_full' },
      weekend: { morning: 'quiet_rest', afternoon: 'quiet_rest', evening: 'family_time', night: 'sleep_full' },
    },
    adult_unemployed: {
      weekday: { morning: 'quiet_rest', afternoon: 'hobby_leisure', evening: 'quiet_rest', night: 'sleep_full' },
      weekend: { morning: 'quiet_rest', afternoon: 'quiet_rest', evening: 'family_time', night: 'sleep_full' },
    },
    senior: {
      weekday: { morning: 'quiet_rest', afternoon: 'quiet_rest', evening: 'family_time', night: 'sleep_full' },
      weekend: { morning: 'quiet_rest', afternoon: 'family_time', evening: 'quiet_rest', night: 'sleep_full' },
    },
  },
};

export function getTemplateForPresetAndArchetype(
  presetId: LifestylePresetId,
  archetype: PlannerArchetype
): PresetTemplateGrid {
  const base = BASE_ARCHETYPE_TEMPLATES[archetype];
  const ov = PRESET_OVERRIDES[presetId]?.[archetype];
  return {
    weekday: { ...base.weekday, ...(ov?.weekday ?? {}) },
    weekend: { ...base.weekend, ...(ov?.weekend ?? {}) },
  };
}
