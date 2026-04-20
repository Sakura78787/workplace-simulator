import { SPEC_INPUT_MAX_LENGTH } from '../config/specCopy'

export type SafetyBlockResult = {
  blocked: true
  reasonCode: string
  reply: string
}

export type SafetyPassResult = {
  blocked: false
}

export type SafetyCheckResult = SafetyBlockResult | SafetyPassResult

const INJECTION_PATTERNS = [
  /忽略指令/gi,
  /system\s*prompt/gi,
  /ignore\s+all\s+previous\s+instructions/gi,
  /developer\s+mode/gi,
]

export function runSafetyCheck(input: string): SafetyCheckResult {
  const trimmedInput = input.trim()

  if (trimmedInput.length === 0) {
    return {
      blocked: true,
      reasonCode: 'empty_input',
      reply: '输入内容为空，无法进行判定。',
    }
  }

  if (trimmedInput.length > SPEC_INPUT_MAX_LENGTH) {
    return {
      blocked: true,
      reasonCode: 'input_too_long',
      reply: '输入内容过长，已触发安全拦截。',
    }
  }

  const hitInjection = INJECTION_PATTERNS.some((pattern) => pattern.test(trimmedInput))
  if (hitInjection) {
    return {
      blocked: true,
      reasonCode: 'prompt_injection',
      reply: '检测到潜在注入指令，已触发安全拦截。',
    }
  }

  return {
    blocked: false,
  }
}
