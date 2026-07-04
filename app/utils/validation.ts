export interface FieldValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'email' | 'url'
  value?: number | string
  message?: string
}

export interface FieldDef {
  name: string
  title?: string
  type: string
  description?: string
  options?: Record<string, unknown>
  fields?: FieldDef[]
  of?: FieldDef[]
  to?: Array<{ type: string }>
  validation?: FieldValidationRule[]
}

export interface ValidationError {
  field: string
  message: string
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

function getRequiredRule(validation?: FieldValidationRule[]): FieldValidationRule | undefined {
  if (!Array.isArray(validation)) return undefined
  return validation.find(rule => rule.type === 'required')
}

export function validateDocumentData(
  data: Record<string, unknown>,
  fields: FieldDef[],
  pathPrefix = ''
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const field of fields) {
    const requiredRule = getRequiredRule(field.validation)
    const fieldPath = pathPrefix ? `${pathPrefix}.${field.name}` : field.name
    const value = data[field.name]

    if (requiredRule && isEmpty(value)) {
      errors.push({
        field: fieldPath,
        message: requiredRule.message || `Field "${field.title || field.name}" is required`
      })
      continue
    }

    if (value === undefined || value === null) continue

    if (field.type === 'object' || field.type === 'document') {
      if (typeof value === 'object' && !Array.isArray(value) && field.fields?.length) {
        errors.push(...validateDocumentData(value as Record<string, unknown>, field.fields, fieldPath))
      }
      continue
    }

    if (field.type === 'array' || Array.isArray(field.of)) {
      if (Array.isArray(value) && field.of?.length) {
        const itemField = field.of[0]
        if (!itemField) continue
        for (let i = 0; i < value.length; i++) {
          const item = value[i]
          const itemPath = `${fieldPath}[${i}]`
          if (itemField.type === 'object' || itemField.type === 'document') {
            if (typeof item === 'object' && !Array.isArray(item) && itemField.fields?.length) {
              errors.push(...validateDocumentData(item as Record<string, unknown>, itemField.fields, itemPath))
            }
          } else {
            const itemRequired = getRequiredRule(itemField.validation)
            if (itemRequired && isEmpty(item)) {
              errors.push({
                field: itemPath,
                message: itemRequired.message || 'Array item is required'
              })
            }
          }
        }
      }
      continue
    }
  }

  return errors
}
