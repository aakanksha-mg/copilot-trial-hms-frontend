import { useRef } from 'react'
import { FiFilter } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvailableField {
  name: string
  label: string
  description?: string
}

export interface SelectionExpressionBuilderProps {
  expression: string
  onChange: (expression: string) => void
  availableFields?: Array<AvailableField>
}

// ─── SQL Operator Groups ──────────────────────────────────────────────────────

const OPERATOR_GROUPS = [
  {
    label: 'Comparison',
    buttonClass: 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200',
    operators: [
      { label: '=', insert: ' = ' },
      { label: '!=', insert: ' != ' },
      { label: '<>', insert: ' <> ' },
      { label: '<', insert: ' < ' },
      { label: '>', insert: ' > ' },
      { label: '<=', insert: ' <= ' },
      { label: '>=', insert: ' >= ' },
    ],
  },
  {
    label: 'Logical',
    buttonClass: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
    operators: [
      { label: 'AND', insert: ' AND ' },
      { label: 'OR', insert: ' OR ' },
      { label: 'NOT', insert: ' NOT ' },
    ],
  },
  {
    label: 'Predicates',
    buttonClass: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100',
    operators: [
      { label: 'BETWEEN', insert: ' BETWEEN  AND ' },
      { label: 'IN (...)', insert: ' IN ()' },
      { label: 'NOT IN (...)', insert: ' NOT IN ()' },
      { label: "LIKE '...'", insert: " LIKE ''" },
      { label: "NOT LIKE '...'", insert: " NOT LIKE ''" },
      { label: 'IS NULL', insert: ' IS NULL' },
      { label: 'IS NOT NULL', insert: ' IS NOT NULL' },
      { label: 'EXISTS (...)', insert: 'EXISTS ()' },
      { label: 'NOT EXISTS (...)', insert: 'NOT EXISTS ()' },
    ],
  },
  {
    label: 'Grouping',
    buttonClass: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    operators: [
      { label: '(', insert: '(' },
      { label: ')', insert: ')' },
    ],
  },
]

// ─── SQL Syntax Highlighter ───────────────────────────────────────────────────

type TokenType =
  | 'keyword'
  | 'operator'
  | 'string'
  | 'number'
  | 'punctuation'
  | 'field'
  | 'whitespace'
  | 'other'

interface Token {
  type: TokenType
  value: string
}

// Order matters: multi-word keywords before single ones, longer operators before shorter
const PATTERNS: Array<[TokenType, RegExp]> = [
  ['whitespace', /^(\s+)/],
  [
    'keyword',
    /^(NOT\s+EXISTS|NOT\s+IN|NOT\s+LIKE|IS\s+NOT\s+NULL|IS\s+NULL|AND|OR|NOT|BETWEEN|EXISTS|IN|LIKE|NULL|TRUE|FALSE)\b/i,
  ],
  ['string', /^('[^']*'|"[^"]*")/],
  ['number', /^(\d+(?:\.\d+)?)\b/],
  ['operator', /^(<=|>=|<>|!=|<|>|=)/],
  ['punctuation', /^([(),])/],
  ['other', /^([A-Za-z_][A-Za-z0-9_.]*)/],
]

function tokenizeSQL(expression: string, fieldNames: ReadonlySet<string>): Array<Token> {
  const tokens: Array<Token> = []
  let remaining = expression

  while (remaining.length > 0) {
    let matched = false
    for (const [type, pattern] of PATTERNS) {
      const m = remaining.match(pattern)
      if (m) {
        const value = m[0]
        if (type === 'other' && fieldNames.has(value)) {
          tokens.push({ type: 'field', value })
        } else {
          tokens.push({ type, value })
        }
        remaining = remaining.slice(value.length)
        matched = true
        break
      }
    }
    if (!matched) {
      // Consume one character as 'other' to avoid infinite loop on unknown chars
      tokens.push({ type: 'other', value: remaining[0] })
      remaining = remaining.slice(1)
    }
  }
  return tokens
}

const TOKEN_CLASSES: Record<TokenType, string> = {
  keyword: 'text-blue-600 font-semibold',
  operator: 'text-red-500 font-medium',
  string: 'text-green-700',
  number: 'text-orange-600',
  punctuation: 'text-neutral-500 font-medium',
  field: 'text-teal-700 font-medium',
  whitespace: '',
  other: 'text-neutral-700',
}

interface HighlightedSQLProps {
  expression: string
  fieldNames: ReadonlySet<string>
}

function HighlightedSQL({ expression, fieldNames }: HighlightedSQLProps) {
  const tokens = tokenizeSQL(expression, fieldNames)
  return (
    <pre className="whitespace-pre-wrap break-all font-mono text-sm leading-relaxed">
      {tokens.map((tok, i) => (
        <span key={i} className={TOKEN_CLASSES[tok.type]}>
          {tok.value}
        </span>
      ))}
    </pre>
  )
}

// ─── Validation ───────────────────────────────────────────────────────────────

interface ValidationResult {
  valid: boolean
  error?: string
}

function validateExpression(expression: string): ValidationResult {
  if (!expression.trim()) return { valid: true }

  let depth = 0
  let inString = false
  let stringChar = ''

  for (const ch of expression) {
    if (inString) {
      if (ch === stringChar) inString = false
    } else if (ch === "'" || ch === '"') {
      inString = true
      stringChar = ch
    } else if (ch === '(') {
      depth++
    } else if (ch === ')') {
      depth--
      if (depth < 0) {
        return { valid: false, error: 'Unmatched closing parenthesis ")"' }
      }
    }
  }

  if (depth > 0) {
    return {
      valid: false,
      error: `${depth} unclosed parenthesi${depth === 1 ? 's' : 'es'} "("`,
    }
  }
  if (inString) {
    return { valid: false, error: 'Unclosed string literal' }
  }
  return { valid: true }
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SelectionExpressionBuilder = ({
  expression,
  onChange,
  availableFields = [],
}: SelectionExpressionBuilderProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fieldNameSet = new Set(availableFields.map((f) => f.name))

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      onChange(expression + text)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = expression.slice(0, start) + text + expression.slice(end)
    onChange(newValue)
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length
      textarea.focus()
    }, 0)
  }

  const validation = validateExpression(expression)

  return (
    <Card className="rounded-lg border border-neutral-200">
      <CardHeader className="px-4 pb-2 pt-4">
        <div className="flex items-center gap-2">
          <FiFilter className="h-4 w-4 text-blue-500" />
          <CardTitle className="text-base">Selection Expression</CardTitle>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">
          Write an ANSI SQL WHERE clause expression to identify the sales personnel who meet the
          criteria for this program. Use the operator buttons and field chips to build your
          expression, or type directly in the editor.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {/* Available Fields */}
        {availableFields.length > 0 && (
          <div>
            <Label className="mb-1.5 block text-xs font-semibold text-neutral-600">
              Available Fields
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {availableFields.map((field) => (
                <button
                  key={field.name}
                  type="button"
                  title={field.description ?? field.label}
                  onClick={() => insertAtCursor(field.name)}
                  className="rounded border border-teal-200 bg-teal-50 px-2 py-0.5 font-mono text-xs text-teal-800 transition hover:bg-teal-100"
                >
                  {field.name}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              Click a field chip to insert it at the cursor position.
            </p>
          </div>
        )}

        {/* SQL Operator Toolbar */}
        <div className="space-y-2">
          <Label className="block text-xs font-semibold text-neutral-600">SQL Operators</Label>
          {OPERATOR_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-wrap items-center gap-1.5">
              <span className="w-[4.5rem] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                {group.label}
              </span>
              <div className="flex flex-wrap gap-1">
                {group.operators.map((op) => (
                  <button
                    key={op.label}
                    type="button"
                    onClick={() => insertAtCursor(op.insert)}
                    className={`rounded border px-2 py-0.5 font-mono text-xs font-medium transition ${group.buttonClass}`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Expression Textarea */}
        <div>
          <Label className="mb-1 block text-xs font-semibold text-neutral-600">
            WHERE Expression *
          </Label>
          <textarea
            ref={textareaRef}
            className={`w-full rounded-md border px-3 py-2 font-mono text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 ${
              !validation.valid
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-500'
            }`}
            rows={5}
            placeholder={
              `e.g., total_premium_by_sales_personnel >= 50000\n` +
              `  AND training_completion_rate > 0.80\n` +
              `  AND region IN ('North', 'South')\n` +
              `  AND lead_conversion_count BETWEEN 10 AND 100`
            }
            value={expression}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
          {!validation.valid && validation.error && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <span>⚠</span>
              <span>{validation.error}</span>
            </p>
          )}
          <p className="mt-1 text-xs text-neutral-400">
            Supports full ANSI SQL WHERE clause syntax: comparison operators (
            {'= != <> < > <= >='} ), logical operators (AND, OR, NOT), predicates (BETWEEN, IN,
            LIKE, IS NULL, EXISTS), and parentheses for grouping.
          </p>
        </div>

        {/* Expression Preview */}
        {expression.trim() && (
          <div
            className={`rounded-lg border p-3 ${
              validation.valid ? 'border-blue-100 bg-blue-50' : 'border-red-100 bg-red-50'
            }`}
          >
            <p
              className={`mb-2 text-xs font-semibold ${
                validation.valid ? 'text-blue-700' : 'text-red-700'
              }`}
            >
              Expression Preview:
            </p>
            <HighlightedSQL expression={expression} fieldNames={fieldNameSet} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SelectionExpressionBuilder
