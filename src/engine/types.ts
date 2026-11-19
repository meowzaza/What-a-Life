export interface GameDate {
  yearCE: number;
  month: number;      // 1..12
  day: number;        // 1..31
  dayOfWeek: number;  // 0 (Sunday) .. 6 (Saturday)
  totalDays: number;  // Accumulated ticks since life start
}

export type GameSpeed = 0 | 1 | 3 | 5 | 10 | 20;

export type SceneTag =
  | 'home'
  | 'school'
  | 'work'
  | 'nightlife'
  | 'market'
  | 'cafe'
  | 'district';

export type LifeIndexKey =
  | 'physical'
  | 'mental'
  | 'financial'
  | 'social'
  | 'status'
  | 'competence';

export type LifeIndices = Record<LifeIndexKey, number>;

export type RawStatKey =
  | 'looks'
  | 'strength'
  | 'endurance'
  | 'wit'
  | 'memory'
  | 'creativity'
  | 'eq'
  | 'charisma'
  | 'reliability';

export type RawStats = Record<RawStatKey, number>;

export type ResourceKey = 'energy' | 'stress' | 'freeTime';
export type TempResources = Record<ResourceKey, number>;

export type CoreSkillId =
  | 'academic'
  | 'tech'
  | 'craft'
  | 'social'
  | 'business'
  | 'athletics';

export type DiscoveredSkillId =
  | 'foreign_lang'
  | 'culinary'
  | 'visual_arts'
  | 'music_vocal'
  | 'performing_acting'
  | 'dance_thai_modern'
  | 'literature_writing';

export type SkillKey = CoreSkillId | DiscoveredSkillId;

export type Skills = Record<SkillKey, number>;

export type ActivitySkillTagId =
  | 'tag_draw'
  | 'tag_music_play'
  | 'tag_stage'
  | 'tag_move'
  | 'tag_cook'
  | 'tag_read_write'
  | 'tag_lang_media'
  | 'tag_numbers'
  | 'tag_tech_play'
  | 'tag_make'
  | 'tag_sell'
  | 'tag_lead'
  | 'tag_sport';

export type RegionId = 'bangkok' | 'central' | 'north' | 'northeast' | 'east' | 'south';

export type FamilyWealthTier =
  | 'destitute'
  | 'working_poor'
  | 'lower_middle'
  | 'middle'
  | 'upper_middle'
  | 'wealthy';

export type FamilyStructure = 'two_parents' | 'single_parent' | 'grandparents';

export type ParentEducation = 'primary' | 'secondary' | 'vocational' | 'bachelor' | 'postgrad';

export type TemperamentId = 'calm' | 'fiery' | 'anxious' | 'optimistic' | 'ambitious';

export type EducationLevel =
  | 'none'
  | 'primary'
  | 'lower_secondary'
  | 'upper_secondary'
  | 'vocational'
  | 'nfe_lower'
  | 'nfe_upper'
  | 'bachelor'
  | 'master'
  | 'doctorate';

export type SchoolTier =
  | 'school_temple'
  | 'school_public'
  | 'school_private'
  | 'school_international';

export type HighSchoolTrack =
  | 'sci_math'
  | 'arts_math'
  | 'arts_lang'
  | 'arts_fine'
  | 'vocational';

export type VocationalBranchId = 'craft' | 'tech' | 'culinary' | 'business';

export type ReadinessLevel = 'ready' | 'risky' | 'very_risky';

export interface GpaTermRecord {
  termId: string;
  gpa: number;
  gpax: number;
  parts: Record<string, number>;
}

export interface PendingSchoolTransfer {
  targetTier: SchoolTier;
  requestedDay: number;
  dueDay: number;
  probability: number;
  yearCE: number;
}

export interface LifeHistoryEntry {
  id: string;
  ageYears: number;
  ageMonths: number;
  dateLabel: string;
  kind: string;
  titleTh: string;
  detailTh?: string;
}

export type SecondChanceEduType =
  | 'nfe_lower'
  | 'nfe_upper'
  | 'uni_open_evening';

export interface EducationState {
  level: EducationLevel;
  schoolTier: SchoolTier;
  highSchoolTrack?: HighSchoolTrack;
  fineArtSkill?: DiscoveredSkillId;
  vocationalBranch?: VocationalBranchId;
  universityId?: string;
  facultyId?: string;
  majorId?: string;
  currentGpa: number;
  cumulativeGpa: number;
  termCount?: number;
  gpaHistory?: GpaTermRecord[];
  trackReadiness?: ReadinessLevel;
  readinessTermsRemaining?: number;
  trackAdjustmentTermsRemaining?: number;
  trackChangeCountThisYear?: number;
  trackChangeLastYearCE?: number;
  teacherTermDelta?: number;
  pendingTransfer?: PendingSchoolTransfer | null;
  scholarshipMinGpa?: number | null;
  hasScholarship?: boolean;
  hasStudentLoan: boolean;
  completedRotc: boolean;
  rotcEnrolled?: boolean;
  rotcYearsCompleted?: number;
  rotcGovServiceBonus?: number;
  draftExemption?: boolean;
  remedialDue?: boolean;
  secondChanceEnrolled?: SecondChanceEduType | null;
  secondChanceProgressTerms?: number;
  tcasExamScore?: number | null;
}

export type TalentKind = 'skill' | 'personality' | 'genius' | 'limitation' | 'special';
export type TalentTier = 1 | 2 | 3;

export interface Talent {
  id: string;
  kind: TalentKind;
  tier: TalentTier;
  revealed: boolean;
  acquiredAtAge: number;
  source: 'birth' | 'gacha' | 'event';
  fixableBy?: string[];
  curedAtAge?: number;
  hintShownCount?: number;
}

export interface DiscoveredSkillProgress {
  sessions: number;
  hours: number;
}

export type Gender = 'male' | 'female' | 'nonbinary';

export interface BackgroundProfile {
  region: RegionId;
  province: string;
  familyWealth: FamilyWealthTier;
  fatherJob: string;
  motherJob: string;
  familyStructure: FamilyStructure;
  parentEducation: ParentEducation;
  temperament: TemperamentId;
  geneticHealth: number;
}

export interface BackstorySummary {
  educationHistory: string;
  keyRelationships: string[];
  turningPoints: string[];
  narrativeCard: string;
}

export type AppearanceStage = 'baby' | 'kid' | 'adult' | 'elder';

export type GeneticEyeColor = 'dark' | 'blue' | 'green' | 'gray' | 'amber' | 'purple';

export type AppearanceStyleOverride = 'natural' | 'formal' | 'casual' | 'flashy' | 'creative' | 'neat';

export interface CharacterAppearance {
  charId: string;
  stage: AppearanceStage;
  geneticEyeColor?: GeneticEyeColor;
  geneticHairColor?: string;
  revealedAtAge2?: boolean;
  dyedHairColor?: string;
  styleOverride?: AppearanceStyleOverride;
}

// --- Phase 2: 3-Layer Trait System, Evidence, Life Stage, Time Alloc, Autopilot ---

export interface TemperamentDimensions {
  energy: number;        // 0..100
  positivity: number;    // 0..100
  sensitivity: number;   // 0..100
  obsessiveness: number; // 0..100
}

export type PersonalityAxisKey = 'ambition' | 'agreeableness' | 'stability';
export type PersonalityAxes = Record<PersonalityAxisKey, number>; // 0..100

export type TraitIntensity = 'subtle' | 'clear' | 'core';
export type TraitVisibility = 'known' | 'hidden_to_self';
export type TraitCategory = 'emotion' | 'social' | 'work' | 'finance' | 'mindset';

export interface EmergentTraitInstance {
  id: string;
  intensity: TraitIntensity;
  intensityScore: number; // 0..100
  visibility: TraitVisibility;
  formedAtAge: number;
  formedAtDay: number;
  originStory: string;
  evidenceReason: string;
  lastReinforcedDay: number;
}

export type EvidenceState = Record<string, number>;

export type LifeSubStageId =
  | 'newborn'
  | 'toddler'
  | 'school_kid'
  | 'teen'
  | 'young_adult'
  | 'mid_adult'
  | 'senior';

export type ReputationGroupKey = 'family' | 'friends' | 'work' | 'community';
export type ReputationView = Record<ReputationGroupKey, number>; // 0..100 (50 = neutral)

export type TimeAllocCategory =
  | 'sleep'
  | 'workOrStudy'
  | 'sideGig'
  | 'social'
  | 'hobby'
  | 'family'
  | 'selfDev'
  | 'nightlife';

export type TimeAllocation = Record<TimeAllocCategory, number>; // Sum must strictly equal 168

export type LifestylePresetId =
  | 'balanced'
  | 'study_focus'
  | 'kid_play'
  | 'workaholic'
  | 'skill_grind'
  | 'social_party'
  | 'friends_only'
  | 'fitness'
  | 'homebody'
  | 'family_first'
  | 'work_and_gig'
  | 'rest_recover';

export type Slot = 'morning' | 'afternoon' | 'evening' | 'night';

export type DayType = 'weekday' | 'weekend';

export type ActivityMajorGroup =
  | 'work_study'
  | 'self_dev'
  | 'social_family'
  | 'self_care'
  | 'hobby_special'
  | 'rest';

export type ActivityId =
  | 'school_class'
  | 'work_shift'
  | 'overtime_work'
  | 'flexible_work'
  | 'freelance_work'
  | 'side_gig_work'
  | 'university_club'
  | 'internship'
  | 'stream_content'
  | 'raise_child'
  | 'advanced_competition'
  | 'self_study'
  | 'attend_course'
  | 'field_practice'
  | 'read_review'
  | 'meet_friends'
  | 'family_time'
  | 'party_night'
  | 'workout'
  | 'skincare_grooming'
  | 'health_check_rest'
  | 'hobby_leisure'
  | 'quiet_rest'
  | 'sleep_full'
  | 'sleep_normal'
  | 'kid_play_neighbors'
  | 'kid_playground'
  | 'kid_ride_bike'
  | 'kid_thai_games'
  | 'kid_soccer_field'
  | 'kid_swim_guardian'
  | 'kid_cartoons_family'
  | 'kid_read_library'
  | 'kid_draw_home'
  | 'kid_sing_play'
  | 'kid_dance_clip'
  | 'kid_help_cook'
  | 'kid_chores'
  | 'kid_water_plants'
  | 'kid_homework_group'
  | 'kid_homework_alone'
  | 'kid_exam_review'
  | 'kid_computer_play'
  | 'kid_build_toys'
  | 'kid_fix_with_dad'
  | 'kid_scout_practice'
  | 'kid_temple_day'
  | 'kid_visit_grandparents'
  | 'kid_night_market_walk'
  | 'kid_stargazing'
  | 'kid_pet_care'
  | 'kid_board_games'
  | 'kid_write_stories'
  | 'kid_act_play'
  | 'kid_flag_announce'
  | 'kid_sleepover'
  | 'kid_nap_rest'
  | 'kid_home_games';

export type AnnualFocusId =
  | 'save_money'
  | 'skill_career'
  | 'health_recovery'
  | 'family_close'
  | 'social_network'
  | 'study_focus'
  | 'none';

export interface AnnualFocusSnapshot {
  yearCE: number;
  startCash: number;
  startAvgSkill: number;
  startPhysical: number;
  stressSum: number;
  stressSamples: number;
}

export interface AnnualFocusState {
  current: AnnualFocusId;
  yearCE: number;
  changesThisYear: number;
  lastPromptedAge?: number;
  lastSummaryYearCE?: number;
  snapshot?: AnnualFocusSnapshot;
}

export interface CalendarPin {
  id: string;
  month: number;
  day: number;
  title: string;
  note?: string;
}

export interface PlannerStreakState {
  presetId?: LifestylePresetId | 'custom';
  presetWeeks: number;
  majorGroupWeeks: Partial<Record<ActivityMajorGroup, number>>;
  overtimeWeeks: number;
  workoutWeeks: number;
  sleepDeficitWeeks: number;
  sleepFullWeeks: number;
  clubWeeks: number;
  streamUnlockedWeeks: number;
  mismatchPresetWeeks: number;
  studyTeenWeeks: number;
  socialKidsPlayWeeks: number;
}

export type WorkShiftSchedule =
  | 'morning-afternoon'
  | 'afternoon-evening'
  | 'night-morning'
  | 'flexible';

export interface EmploymentState {
  status: 'none' | 'student' | 'employed';
  jobId: string;
  workShift: WorkShiftSchedule;
  allowsOvertime: boolean;
  contractHoursPerWeek: number;
  overtimeStreakWeeks: number;
  shiftFamilyRelOffset?: number;
}

export type PlannerGrid = Record<DayType, Record<Slot, ActivityId | null>>;

export interface PlannerState {
  grid: PlannerGrid;
  presetId?: LifestylePresetId | 'custom';
  draft?: PlannerGrid;
  pendingGrid?: PlannerGrid;
  pendingPresetId?: LifestylePresetId | 'custom';
  effectiveFromDay?: number;
  lastCostFallbackReasonTh?: string;
  lastRelockReasonTh?: string;
  annualFocus?: AnnualFocusState;
  calendarPins?: CalendarPin[];
  streaks?: PlannerStreakState;
  activitySkillTags?: Partial<
    Record<'hobby_leisure' | 'attend_course' | 'university_club' | 'self_study', ActivitySkillTagId>
  >;
}

export interface SideGigRecord {
  id: string;
  title: string;
  sceneId: string;
  hourlyPay: number;
  maxWeeklyHours: number;
  isNightShift: boolean;
  hiredAtTotalDay: number;
}

export type SkillCourseDuration = 4 | 8 | 12;
export type SkillTierId = 1 | 2 | 3;
export type SkillLevelNum = 1 | 2 | 3 | 4 | 5;

export interface SkillLevelState {
  level: SkillLevelNum;
  xp: number;
  unlockedTier: SkillTierId;
  unlockedTierSourceTh?: string;
  unlockedViaChildEvent?: boolean;
  discoveredHours?: number;
  certificates: string[];
}

export interface SkillCourseState {
  skillId: SkillKey;
  weeksLeft: number;
  totalWeeks: SkillCourseDuration;
  feePerWeek: number;
  missedWeeks?: number;
  feePaid?: number;
  practiceHoursThisWeek?: number;
}

export interface SkillTrainingState {
  focus: SkillKey[];
  course?: SkillCourseState | null;
  xp: Record<SkillKey, number>;
  skillStates?: Record<SkillKey, SkillLevelState>;
  lastPracticedWeek: Record<SkillKey, number>;
  discoveredSkills?: DiscoveredSkillId[];
  tagProgress?: Partial<Record<ActivitySkillTagId, DiscoveredSkillProgress>>;
  limitationProgress?: Record<string, { sessions: number; weeks: number }>;
  socialHighWeeks?: number;
  savingStreakWeeks?: number;
  lastLoggedCap?: Partial<Record<SkillKey, 30 | 60 | 2 | 4>>;
}

export type RiskProfile = 'cautious' | 'balanced' | 'bold';

export type StandingConditionKey =
  | 'low_cash'
  | 'high_stress'
  | 'payday_surplus'
  | 'night_invite'
  | 'overtime_offer'
  | 'risky_windfall';

export type StandingActionKey =
  | 'save_reserve'
  | 'take_side_gig'
  | 'rest_priority'
  | 'decline_spend'
  | 'accept_if_safe'
  | 'ask_player';

export interface StandingOrderRule {
  id: string;
  enabled: boolean;
  conditionKey: StandingConditionKey;
  actionKey: StandingActionKey;
  labelTh: string;
}

export interface FinancialStandingPolicy {
  minSavingsRatePct: number; // 0..60
  lowCashThreshold: number;  // e.g. 5000 THB
  avoidDebt: boolean;
  strictBudget: boolean;
}

export type HealthCheckupPackage = 'off' | 'basic_500' | 'private_3500';
export type FamilyRemittanceMode = 'off' | 'pct_5' | 'pct_15';

export interface SelfCareOrders {
  healthCheckupPackage: HealthCheckupPackage;
  groomingMonthlyEnabled: boolean;
  familyRemittanceMode: FamilyRemittanceMode;
  lastAnnualCheckupAge?: number;
  pausedByLowCash?: {
    healthCheckup?: boolean;
    grooming?: boolean;
    familyRemittance?: boolean;
  };
}

export interface StandingOrders {
  autopilotEnabled: boolean;
  riskProfile: RiskProfile;
  financial: FinancialStandingPolicy;
  rules: StandingOrderRule[];
  selfCare?: SelfCareOrders;
}

export interface AutopilotOption {
  id: string;
  label: string;
  hint: string;
  tags: string[];
  requiresAdult?: boolean;
  effects: Effect[];
}

export interface AutopilotSituation {
  id: string;
  kind: StandingConditionKey | 'payday_temptation';
  title: string;
  description: string;
  options: AutopilotOption[];
}

export interface PeriodDigest {
  title: string;
  daysElapsed: number;
  summaryLines: string[];
  newTraits: string[];
  turningPointsCount: number;
  autopilotActionsCount: number;
  cashDelta: number;
}

export interface GameSettings {
  pubVisitAge: 18 | 20;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  gender: Gender;
  birthYearCE: number;
  ageYears: number;
  isMinor: boolean; // Hard rule: ageYears < 18
  isAlive: boolean;
  causeOfDeath?: string;
  education: EducationLevel;
  lifeStage?: LifeSubStageId;
  background: BackgroundProfile;
  backstory: BackstorySummary;
  rawStats: RawStats;
  resources: TempResources;
  skills: Skills;
  indices: LifeIndices;
  traits: string[]; // Legacy/simple tag list kept synced with emergentTraits + temperament
  temperamentProfile?: TemperamentDimensions; // Layer A
  personality?: PersonalityAxes;              // Layer B (0..100)
  emergentTraits?: EmergentTraitInstance[];   // Layer C
  innerTension?: number;                      // 0..100 when conflicting traits coexist
  reputationView?: ReputationView;            // Phase 4 NPC perception hook
  talents?: Talent[];                         // Phase 3.3.1-FIX positive/special active/unrevealed talents (revealed active <= 3)
  talentVault?: Talent[];                     // Phase 3.3.1-FIX overflow talent vault (<= 5)
  lastTalentRevealAgeMonths?: number;         // Phase 3.3.1-FIX 36-month cooldown anchor
  lastTalentRevealLifeStage?: string;         // Phase 3.3.1-FIX life stage reveal cap
  talentSwapWindowTag?: string;               // Phase 3.3.1-FIX turning-point swap window id
  lastTalentSwapWindowTag?: string;           // Phase 3.3.1-FIX last used swap window id
  limitations?: Talent[];                     // Phase 3.3.1 fixable limitations (debuffs)
  educationState?: EducationState;            // Phase 3.3.1 schooling / GPA / track / ROTC
  lifeHistory?: LifeHistoryEntry[];           // Phase 3.3.1-FIX major turning points (MeTab displays latest 8)
  flags: Record<string, boolean>;
  appearance?: CharacterAppearance;
}

export type HousingId = 'parents_home' | 'cheap_room' | 'townhouse_rent' | 'condo';

export type RoutineFocus = 'balanced' | 'hustle' | 'study' | 'rest' | 'side_gig';

export interface EconomyState {
  cash: number;
  monthlySalary: number;
  monthlySideIncome: number;
  monthlyExpenses: number;
  housingId: HousingId;
  jobId: string;
  jobTitle: string;
  debt: number;
  creditScore: number;
  creditLimit: number;
  missedPayments: number;
  assetsValue: number;
}

export type MoneyCategory = 'salary' | 'side' | 'living' | 'rent' | 'debt' | 'event';

export type EventTier = 'T0' | 'T1' | 'T2' | 'T3';

export type StoryletCategory =
  | 'work'
  | 'romance'
  | 'family'
  | 'health'
  | 'finance'
  | 'social'
  | 'quirky'
  | 'system';

export type Effect =
  | { type: 'ChangeRawStat'; stat: RawStatKey; delta: number; reason: string }
  | { type: 'ChangeResource'; resource: ResourceKey; delta: number; reason: string }
  | { type: 'ChangeSkill'; skill: SkillKey; delta: number; reason: string }
  | { type: 'ChangeStat'; stat: RawStatKey | ResourceKey | SkillKey; delta: number; reason: string }
  | { type: 'AddMoney'; amount: number; category: MoneyCategory; reason: string }
  | { type: 'ChangeMoney'; amount: number; category: MoneyCategory; reason: string }
  | { type: 'AddDebt'; amount: number; reason: string }
  | { type: 'RepayDebt'; amount: number; reason: string }
  | { type: 'ChangeCredit'; delta: number; reason: string }
  | { type: 'SetHousing'; housingId: HousingId; reason: string }
  | { type: 'SetJob'; jobId: string; reason: string }
  | { type: 'AddTrait'; traitId: string; reason: string }
  | { type: 'RemoveTrait'; traitId: string; reason: string }
  | { type: 'AddFlag'; flag: string; value: boolean; reason: string }
  | { type: 'RemoveFlag'; flag: string; reason: string }
  | { type: 'RecordEvidence'; key: string; amount: number; reason: string }
  | { type: 'AdjustPersonality'; axis: PersonalityAxisKey; delta: number; reason: string }
  | { type: 'ApplyTurningPoint'; kind: string; reason: string }
  | { type: 'RevealTrait'; traitId: string; reason: string }
  | { type: 'SetAnnualFocus'; focusId: AnnualFocusId; reason: string }
  | { type: 'ModifyTeacherGpa'; delta: number; reason: string }
  | {
      type: 'ScheduleEcho';
      delayDays: number;
      title: string;
      description: string;
      effects: Effect[];
      sourceEventId: string;
    }
  | {
      type: 'StartScene';
      sceneId: string;
      daypart?: 'morning' | 'afternoon' | 'evening' | 'night';
      durationDays?: number;
      reason?: string;
      returnSummary?: string;
    }
  | { type: 'MoveIn'; housingId: HousingId; tenure?: string; note?: string }
  | { type: 'ChangeTenure'; tenure: string; note?: string }
  | { type: 'StartJobShift'; jobId: string; note?: string }
  | { type: 'SetDeath'; cause: string };

export interface EchoItem {
  id: string;
  triggerOnDay: number;
  title: string;
  description: string;
  effects: Effect[];
  sourceEventId: string;
}

export interface EventChoice {
  id: string;
  label: string;
  hint?: string;
  requiresAdult?: boolean;
  blockedByTraits?: Array<{ traitId: string; minIntensity?: string; reasonTh: string }>;
  requiredWealth?: FamilyWealthTier[];
  requiredAnyTalents?: string[];
  requiredSkills?: Partial<Record<SkillKey, number>>;
  requiredMinGpa?: number;
  requiredMinRawStats?: Partial<Record<RawStatKey, number>>;
  conditionalUnlockReasonTh?: string;
  fallbackAutopilotAction?: string;
  effects: Effect[];
  costCash?: number;
  disabled?: boolean;
  disabledReason?: string;
  twistChance?: number;
  twistEffects?: Effect[];
  twistSummary?: string;
}

export interface PendingEventPrompt {
  id: string;
  title: string;
  category: StoryletCategory | 'milestone' | 'dilemma' | 'economy' | 'health' | 'twist';
  tier?: EventTier;
  description: string;
  choices: EventChoice[];
  isAdultContent?: boolean;
  sceneId?: string;
  sceneTag?: SceneTag;
  daypart?: 'morning' | 'afternoon' | 'evening' | 'night';
  deadlineDay?: number;
  importance?: number; // 1..10 for x20 / attention budget filtering
  isTwist?: boolean;
  directorReason?: string;
  hiddenBlockedReasons?: string[];
  storyletId?: string;
}

export interface ActiveToast {
  id: string;
  title: string;
  description: string;
  tier: 'T0' | 'T1';
  category: StoryletCategory | 'milestone' | 'health' | 'finance';
  expiresAtTotalDay: number;
  storyletId?: string;
  explainReason?: string;
}

export interface ConsequenceQueueItem {
  storyletId: string;
  dueTotalDay: number;
  originId: string;
}

export interface DirectorState {
  lastT2Day: number;
  lastT3Day: number;
  lastCategoryDays: Record<string, number>;
  activeForeshadows: string[];
  twistCount: number;
  lastTwistDay: number;
  seenStoryletIds: string[];
  consequenceQueue?: ConsequenceQueueItem[];
  tensionBudget?: number;
}

export interface TimelineEntry {
  id: string;
  totalDay: number;
  dateLabel: string;
  ageYears: number;
  category:
    | 'life'
    | 'work'
    | 'finance'
    | 'health'
    | 'milestone'
    | 'echo'
    | 'trait'
    | 'autopilot'
    | 'romance'
    | 'family'
    | 'social'
    | 'quirky'
    | 'system';
  tier?: EventTier;
  title: string;
  description: string;
  effectsSummary?: string[];
  explainReason?: string;
  appearance?: CharacterAppearance;
  storyletId?: string;
}

export interface StatChangeLog {
  id: string;
  totalDay: number;
  dateLabel: string;
  target: string;
  delta: number;
  newValue: number;
  reason: string;
}

export interface GameState {
  version: number;
  seed: number;
  rngState: number;
  date: GameDate;
  character: Person;
  economy: EconomyState;
  /** @deprecated Legacy Phase 1/2 routine kept strictly for migrating pre-3.2.1 saves in save.ts */
  routine?: RoutineFocus;
  lifestylePresetId?: LifestylePresetId | 'custom';
  employment?: EmploymentState;
  planner?: PlannerState;
  sideGigRecord?: SideGigRecord | null;
  skillTraining?: SkillTrainingState;
  evidence?: EvidenceState;
  /** @derived Strictly computed from planner.grid via deriveWeeklyAllocation */
  timeAllocation?: TimeAllocation;
  standingOrders?: StandingOrders;
  pendingAutopilotSituation?: AutopilotSituation | null;
  lastDigest?: PeriodDigest | null;
  settings?: GameSettings;
  echoQueue: EchoItem[];
  pendingPrompt: PendingEventPrompt | null;
  activeToast?: ActiveToast | null;
  directorState?: DirectorState;
  sceneMode?: {
    sceneId: string;
    daypart?: 'morning' | 'afternoon' | 'evening' | 'night';
    reason?: string;
    startedAtTotalDay?: number;
    expiresAtTotalDay?: number;
    returnSummary?: string;
  } | null;
  gameSpeed?: GameSpeed;
  needsPlayer: boolean;
  timeline: TimelineEntry[];
  statLogs: StatChangeLog[];
  triggeredEventIds: string[];
  pendingAutosave: boolean;
}

export type PlayerAction =
  | { type: 'APPLY_LIFESTYLE_PRESET'; presetId: LifestylePresetId }
  | { type: 'CHANGE_HOUSING'; housingId: HousingId }
  | { type: 'APPLY_JOB'; jobId: string }
  | { type: 'CHANGE_WORK_SHIFT'; workShift: WorkShiftSchedule }
  | { type: 'SET_SKILL_FOCUS'; focus: SkillKey[] }
  | { type: 'ENROLL_SKILL_COURSE'; skillId: SkillKey; weeks: SkillCourseDuration }
  | { type: 'SWAP_TALENT_SLOT'; activeIdx: number; vaultIdx: number }
  | { type: 'BORROW_MONEY'; amount: number }
  | { type: 'REPAY_DEBT'; amount: number }
  | { type: 'RESOLVE_PROMPT'; promptId: string; choiceId: string }
  | { type: 'CONFIRM_LIFE_PLANNER'; grid: PlannerGrid; presetId?: LifestylePresetId | 'custom' }
  | { type: 'UPDATE_STANDING_ORDERS'; orders: StandingOrders }
  | { type: 'TRIGGER_TURNING_POINT'; kind: string }
  | { type: 'RESOLVE_AUTOPILOT'; situationId: string; optionId: string }
  | { type: 'TRIGGER_AUTOPILOT_SITUATION'; kind?: StandingConditionKey }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<GameSettings> }
  | { type: 'CLEAR_DIGEST' }
  | { type: 'EXECUTE_GATED_ACTION'; actionId: string }
  | { type: 'DISMISS_TOAST' }
  | { type: 'TRIGGER_STORYLET'; storyletId: string }
  | { type: 'RESOLVE_AUTOPILOT_PROMPT'; promptId: string }
  | { type: 'SET_ANNUAL_FOCUS'; focusId: AnnualFocusId }
  | { type: 'ADD_CALENDAR_PIN'; month: number; day: number; title: string; note?: string }
  | { type: 'REMOVE_CALENDAR_PIN'; pinId: string }
  | {
      type: 'SET_ACTIVITY_SUBFOCUS';
      activityId: 'hobby_leisure' | 'attend_course' | 'university_club' | 'self_study';
      tagId: ActivitySkillTagId;
    }
  | { type: 'CHOOSE_HIGH_SCHOOL_TRACK'; track: HighSchoolTrack; fineArtSkill?: DiscoveredSkillId; vocationalBranch?: VocationalBranchId }
  | { type: 'ENROLL_ROTC'; enroll: boolean }
  | { type: 'CHANGE_SCHOOL_TIER'; schoolTier: SchoolTier }
  | { type: 'ENROLL_SECOND_CHANCE_EDU'; program: SecondChanceEduType | null }
  | { type: 'DEV_SET_PLANNER_STREAKS'; patch: Partial<PlannerStreakState> }
  | { type: 'DEV_TOGGLE_FLAG'; flag: string; value?: boolean }
  | { type: 'DEV_TRIGGER_ANNUAL_FOCUS_PROMPT' };

export interface ActionRecord {
  atTotalDay: number;
  action: PlayerAction;
}

export interface ExplainComponent {
  label: string;
  value: number;
  weight?: string;
  contribution: number;
}

export interface ExplainBreakdown {
  key: string;
  title: string;
  currentValue: number;
  formulaText: string;
  components: ExplainComponent[];
  recentLogs: StatChangeLog[];
}

export type LifeGenMode = 'random' | 'custom' | 'at_age';

export type RandomStartPoint = 'birth' | 'age6' | 'age12' | 'late_teen';

export interface CustomLifeOptions {
  startingAge?: number; // 0..65, default 0
  firstName?: string;
  lastName?: string;
  nickname?: string;
  gender?: Gender;
  region?: RegionId;
  province?: string;
  familyWealth?: FamilyWealthTier;
  familyStructure?: FamilyStructure;
  parentEducation?: ParentEducation;
  temperament?: TemperamentId;
  geneticHealth?: number;
}

export interface AtAgeLifeOptions extends CustomLifeOptions {
  targetAge: number; // e.g., 18, 25, 40
  education?: EducationLevel;
  wealthFocus?: 'struggling' | 'average' | 'comfortable';
}

export interface LifeGenRequest {
  mode: LifeGenMode;
  seed: number;
  randomStartPoint?: RandomStartPoint;
  custom?: CustomLifeOptions;
  atAge?: AtAgeLifeOptions;
  appearanceOverride?: string;
}
