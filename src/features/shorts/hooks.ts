export const HOOK_TEMPLATES = [
  'CAN YOU SOLVE THIS IN 10 SECONDS?',
  'MOST STUDENTS GET THIS WRONG.',
  'TGT CS EXAM TRAP ⚠️',
  'YOU HAVE 10 SECONDS.',
  'DON\'T FALL FOR THIS OPTION.',
  'CAN YOU BEAT THE TIMER?',
  'ONLY SERIOUS CS STUDENTS GET THIS.',
  'STOP SCROLLING. SOLVE THIS.',
];

export function getRandomHook(): string {
  const index = Math.floor(Math.random() * HOOK_TEMPLATES.length);
  return HOOK_TEMPLATES[index];
}
