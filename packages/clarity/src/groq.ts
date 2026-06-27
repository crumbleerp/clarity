export function groq(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, str, i) => acc + str + (values[i] != null ? String(values[i]) : ''), '')
}
