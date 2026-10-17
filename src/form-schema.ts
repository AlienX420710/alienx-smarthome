import { isValidEmail } from './form-engine';

export type StringRule = {
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowed?: ReadonlySet<string>;
  validate?: (value: string) => boolean;
};
export function validateString(value: string, rule: StringRule): boolean {
  return (
    (rule.min === undefined || value.length >= rule.min) &&
    (rule.max === undefined || value.length <= rule.max) &&
    (!rule.pattern || rule.pattern.test(value)) &&
    (!rule.allowed || rule.allowed.has(value)) &&
    (!rule.validate || rule.validate(value))
  );
}
export function validateFields(
  values: Record<string, string>,
  schema: Record<string, StringRule>,
): string[] {
  return Object.entries(schema)
    .filter(([key, rule]) => !validateString(values[key] ?? '', rule))
    .map(([key]) => key);
}
export const trimmedText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';
export const singleLineText = (value: string) =>
  value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
export const multilineText = (value: string) =>
  value.replace(/[\u0000\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
export function validPhone(value: string, max: number, pattern?: RegExp) {
  const digits = value.replace(/\D/g, '');
  return (
    validateString(value, { max, pattern }) &&
    digits.length >= 7 &&
    digits.length <= 15
  );
}
export function validHttpUrl(value: string, max: number) {
  if (value.length > max) return false;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
export function validCalendarDate(value: string) {
  const date = new Date(value + 'T00:00:00.000Z');
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}
export { isValidEmail };
