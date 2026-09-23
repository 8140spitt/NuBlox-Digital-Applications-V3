import type { ValidationRuleDefinition, ValidationRuleResultStatus } from './validation.js';

export interface ValidationEvaluationContext {
  subject: Readonly<Record<string, unknown>>;
}

export interface ValidationHandlerOutcome {
  status: ValidationRuleResultStatus;
  message?: string;
  evidence?: Readonly<Record<string, unknown>>;
}

export type ValidationHandler = (
  rule: ValidationRuleDefinition,
  context: ValidationEvaluationContext
) => ValidationHandlerOutcome | Promise<ValidationHandlerOutcome>;

export type ValidationHandlerRegistry = ReadonlyMap<string, ValidationHandler>;

function nestedValue(
  subject: Readonly<Record<string, unknown>>,
  path: string
): unknown {
  return path.split('.').reduce<unknown>((current, part) => {
    if (typeof current !== 'object' || current === null || Array.isArray(current)) return undefined;
    return (current as Readonly<Record<string, unknown>>)[part];
  }, subject);
}

function stringArray(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${label} must be an array of strings.`);
  }
  return value as readonly string[];
}

const requiredFields: ValidationHandler = (rule, context) => {
  const fields = stringArray(rule.configuration?.fields, 'Required fields configuration');
  const missing = fields.filter((field) => {
    const value = nestedValue(context.subject, field);
    return value === undefined || value === null || value === '';
  });
  return missing.length === 0
    ? { status: 'PASSED', evidence: { checkedFields: fields } }
    : {
        status: 'FAILED',
        message: `Required data is missing: ${missing.join(', ')}.`,
        evidence: { checkedFields: fields, missingFields: missing }
      };
};

const fieldIn: ValidationHandler = (rule, context) => {
  const field = String(rule.configuration?.field ?? '').trim();
  if (!field) throw new Error('Allowed-values handler requires configuration.field.');
  const allowedValues = rule.configuration?.allowedValues;
  if (!Array.isArray(allowedValues)) {
    throw new Error('Allowed-values handler requires configuration.allowedValues.');
  }
  const actual = nestedValue(context.subject, field);
  const passed = allowedValues.some((value) => Object.is(value, actual));
  return passed
    ? { status: 'PASSED', evidence: { field, actual, allowedValues } }
    : {
        status: 'FAILED',
        message: `${field} is not an allowed value.`,
        evidence: { field, actual, allowedValues }
      };
};

const fieldEquals: ValidationHandler = (rule, context) => {
  const field = String(rule.configuration?.field ?? '').trim();
  if (!field) throw new Error('Equality handler requires configuration.field.');
  const expected = rule.configuration?.expected;
  const actual = nestedValue(context.subject, field);
  return Object.is(actual, expected)
    ? { status: 'PASSED', evidence: { field, actual, expected } }
    : {
        status: 'FAILED',
        message: `${field} does not match the required value.`,
        evidence: { field, actual, expected }
      };
};

const requiredState: ValidationHandler = (rule, context) => {
  const allowedStates = stringArray(rule.configuration?.allowedStates, 'Allowed states configuration');
  const actual = nestedValue(context.subject, 'lifecycleState');
  return typeof actual === 'string' && allowedStates.includes(actual)
    ? { status: 'PASSED', evidence: { actualState: actual, allowedStates } }
    : {
        status: 'FAILED',
        message: 'Subject lifecycle state does not satisfy the rule.',
        evidence: { actualState: actual ?? null, allowedStates }
      };
};

const alwaysPass: ValidationHandler = () => ({ status: 'PASSED' });
const alwaysFail: ValidationHandler = (rule) => ({
  status: 'FAILED',
  message: String(rule.configuration?.message ?? 'Validation rule failed.')
});

export function createDefaultValidationHandlerRegistry(): ValidationHandlerRegistry {
  return new Map<string, ValidationHandler>([
    ['subject.required_fields', requiredFields],
    ['subject.field_in', fieldIn],
    ['subject.field_equals', fieldEquals],
    ['lifecycle.required_state', requiredState],
    ['validation.always_pass', alwaysPass],
    ['validation.always_fail', alwaysFail]
  ]);
}

export async function executeValidationHandler(
  registry: ValidationHandlerRegistry,
  rule: ValidationRuleDefinition,
  context: ValidationEvaluationContext
): Promise<ValidationHandlerOutcome> {
  const handler = registry.get(rule.handlerKey);
  if (!handler) {
    return {
      status: 'ERROR',
      message: `No validation handler is registered for ${rule.handlerKey}.`,
      evidence: { handlerKey: rule.handlerKey }
    };
  }

  try {
    return await handler(rule, context);
  } catch (error) {
    return {
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Validation handler failed.',
      evidence: { handlerKey: rule.handlerKey }
    };
  }
}
