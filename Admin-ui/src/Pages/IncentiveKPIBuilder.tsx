import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { FiCode, FiEye, FiPlay, FiPlus, FiTrash2 } from 'react-icons/fi'

// ─── Types ────────────────────────────────────────────────────────────────────

type ObjectType = 'policy' | 'training' | 'sales_activity'
type AggregationType = 'SUM' | 'COUNT' | 'DISTINCT_COUNT' | 'AVG'
type FieldType = 'numeric' | 'identifier' | 'categorical' | 'date' | 'boolean'
type OperatorType = '=' | '!=' | 'IN' | 'NOT_IN' | 'BETWEEN' | '>' | '<' | '>=' | '<='
type TimeWindowType = 'PROGRAM_DURATION' | 'CUSTOM_RANGE' | 'ROLLING_WINDOW'
type GroupByType = 'sales_personnel_id' | 'team' | 'region'

interface FieldMetadata {
  key: string
  label: string
  type: FieldType
}

interface FilterCondition {
  id: string
  field: string
  operator: OperatorType
  value: string
  logicalOperator: 'AND' | 'OR'
}

interface TimeWindow {
  type: TimeWindowType
  startDate?: string
  endDate?: string
  rollingDays?: number
}

/** A single data-source component within a KPI (one object + aggregation + field + filters). */
interface KPIDataSource {
  id: string
  object: ObjectType | ''
  aggregation: AggregationType | ''
  field: string
  filters: FilterCondition[]
}

/** Full KPI configuration — now supports multiple independent data sources. */
interface KPIConfig {
  dataSources: Array<{
    id: string
    object: ObjectType | ''
    aggregation: AggregationType | ''
    field: string
    filters: Array<{
      field: string
      operator: string
      value: string | string[]
      logical_operator?: string
    }>
  }>
  group_by: GroupByType[]
  time_window: TimeWindow
}

// ─── Metadata ────────────────────────────────────────────────────────────────

const OBJECT_FIELDS: Record<ObjectType, FieldMetadata[]> = {
  policy: [
    { key: 'premium_amount', label: 'Premium Amount', type: 'numeric' },
    { key: 'sum_assured', label: 'Sum Assured', type: 'numeric' },
    { key: 'annualized_premium', label: 'Annualized Premium', type: 'numeric' },
    { key: 'policy_id', label: 'Policy ID', type: 'identifier' },
    { key: 'policy_status', label: 'Policy Status', type: 'categorical' },
    { key: 'product_type', label: 'Product Type', type: 'categorical' },
    { key: 'policy_date', label: 'Policy Date', type: 'date' },
    { key: 'maturity_date', label: 'Maturity Date', type: 'date' },
  ],
  training: [
    { key: 'score', label: 'Training Score', type: 'numeric' },
    { key: 'completion_percentage', label: 'Completion %', type: 'numeric' },
    { key: 'training_id', label: 'Training ID', type: 'identifier' },
    { key: 'training_type', label: 'Training Type', type: 'categorical' },
    { key: 'status', label: 'Status', type: 'categorical' },
    { key: 'completion_date', label: 'Completion Date', type: 'date' },
  ],
  sales_activity: [
    { key: 'leads_count', label: 'Leads Count', type: 'numeric' },
    { key: 'conversion_count', label: 'Conversion Count', type: 'numeric' },
    { key: 'meeting_count', label: 'Meeting Count', type: 'numeric' },
    { key: 'activity_id', label: 'Activity ID', type: 'identifier' },
    { key: 'activity_type', label: 'Activity Type', type: 'categorical' },
    { key: 'status', label: 'Status', type: 'categorical' },
    { key: 'activity_date', label: 'Activity Date', type: 'date' },
  ],
}

/** Which field types each aggregation function accepts */
const AGGREGATION_FIELD_TYPES: Record<AggregationType, FieldType[]> = {
  SUM: ['numeric'],
  AVG: ['numeric'],
  COUNT: ['numeric', 'identifier', 'categorical', 'date', 'boolean'],
  DISTINCT_COUNT: ['identifier', 'categorical'],
}

const OPERATORS: Array<{ value: OperatorType; label: string }> = [
  { value: '=', label: '= (Equals)' },
  { value: '!=', label: '≠ (Not Equals)' },
  { value: 'IN', label: 'IN (Includes)' },
  { value: 'NOT_IN', label: 'NOT IN (Excludes)' },
  { value: '>', label: '> (Greater Than)' },
  { value: '<', label: '< (Less Than)' },
  { value: '>=', label: '>= (At Least)' },
  { value: '<=', label: '<= (At Most)' },
  { value: 'BETWEEN', label: 'BETWEEN (Range)' },
]

const OBJECT_LABELS: Record<ObjectType, string> = {
  policy: 'Policy',
  training: 'Training',
  sales_activity: 'Sales Activity',
}

const AGGREGATION_LABELS: Record<AggregationType, string> = {
  SUM: 'SUM',
  COUNT: 'COUNT',
  DISTINCT_COUNT: 'DISTINCT COUNT',
  AVG: 'AVG',
}

const MOCK_PREVIEW_DATA = [
  { personnel_id: 'SP001', sales_person: 'Rahul Sharma', kpi_value: 450000 },
  { personnel_id: 'SP002', sales_person: 'Priya Patel', kpi_value: 380000 },
  { personnel_id: 'SP003', sales_person: 'Amit Kumar', kpi_value: 320000 },
  { personnel_id: 'SP004', sales_person: 'Sneha Reddy', kpi_value: 290000 },
  { personnel_id: 'SP005', sales_person: 'Vijay Singh', kpi_value: 260000 },
]

// ─── Section Badge ────────────────────────────────────────────────────────────

const SECTION_COLORS: Record<string, string> = {
  A: 'bg-teal-100 text-teal-800',
  B: 'bg-purple-100 text-purple-800',
  C: 'bg-amber-100 text-amber-800',
  D: 'bg-blue-100 text-blue-800',
  E: 'bg-rose-100 text-rose-800',
  F: 'bg-indigo-100 text-indigo-800',
}

function SectionBadge({ letter }: { letter: string }) {
  return (
    <span
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${SECTION_COLORS[letter]}`}
    >
      {letter}
    </span>
  )
}

// ─── Helper: create a blank data source ──────────────────────────────────────

function newDataSource(): KPIDataSource {
  return {
    id: crypto.randomUUID(),
    object: '',
    aggregation: '',
    field: '',
    filters: [],
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

const IncentiveKPIBuilder = () => {
  const [kpiName, setKpiName] = useState('')
  // Multiple data sources — each KPI can aggregate over one or more objects
  const [dataSources, setDataSources] = useState<KPIDataSource[]>([newDataSource()])
  const [groupBy, setGroupBy] = useState<GroupByType[]>(['sales_personnel_id'])
  const [timeWindow, setTimeWindow] = useState<TimeWindow>({ type: 'PROGRAM_DURATION' })
  const [showPreview, setShowPreview] = useState(false)
  const [showJSON, setShowJSON] = useState(false)
  const [testPersonnelId, setTestPersonnelId] = useState('')

  // Derived KPI config JSON (multi-source)
  const kpiConfig: KPIConfig = useMemo(
    () => ({
      dataSources: dataSources.map((ds) => ({
        id: ds.id,
        object: ds.object,
        aggregation: ds.aggregation,
        field: ds.field,
        filters: ds.filters.map((f, idx) => ({
          field: f.field,
          operator: f.operator,
          value:
            f.operator === 'IN' || f.operator === 'NOT_IN'
              ? f.value.split(',').map((v) => v.trim())
              : f.value,
          ...(idx > 0 && { logical_operator: f.logicalOperator }),
        })),
      })),
      group_by: groupBy,
      time_window: timeWindow,
    }),
    [dataSources, groupBy, timeWindow],
  )

  // Human-readable formula breakdown (one line per data source)
  const formulaLines = useMemo(() => {
    return dataSources
      .filter((ds) => ds.object && ds.aggregation && ds.field)
      .map((ds) => {
        const fields = OBJECT_FIELDS[ds.object as ObjectType] ?? []
        const fieldLabel = fields.find((f) => f.key === ds.field)?.label ?? ds.field
        const aggLabel = AGGREGATION_LABELS[ds.aggregation as AggregationType] ?? ds.aggregation
        const filterLines = ds.filters
          .map((f, idx) => {
            const fl = fields.find((x) => x.key === f.field)?.label ?? f.field
            const valPart =
              f.operator === 'IN' || f.operator === 'NOT_IN'
                ? `${f.operator} (${f.value})`
                : `${f.operator} ${f.value}`
            return `${idx > 0 ? f.logicalOperator + ' ' : ''}${fl} ${valPart}`
          })
          .join('\n')
        return {
          main: `${aggLabel}(${fieldLabel})`,
          object: `FROM ${OBJECT_LABELS[ds.object as ObjectType] ?? ds.object}`,
          where: filterLines || null,
        }
      })
  }, [dataSources])

  const isConfigValid = dataSources.some(
    (ds) => ds.object && ds.aggregation && ds.field,
  )

  // ── Data source helpers ─────────────────────────────────────────────────────

  const addDataSource = () => setDataSources((prev) => [...prev, newDataSource()])

  const removeDataSource = (id: string) =>
    setDataSources((prev) => (prev.length > 1 ? prev.filter((ds) => ds.id !== id) : prev))

  const updateDataSource = (id: string, updates: Partial<KPIDataSource>) =>
    setDataSources((prev) => prev.map((ds) => (ds.id === id ? { ...ds, ...updates } : ds)))

  // ── Filter helpers (scoped to a data source) ────────────────────────────────

  const addFilter = (dsId: string) => {
    updateDataSource(dsId, {
      filters: [
        ...(dataSources.find((ds) => ds.id === dsId)?.filters ?? []),
        {
          id: crypto.randomUUID(),
          field: '',
          operator: '=',
          value: '',
          logicalOperator: 'AND',
        },
      ],
    })
  }

  const removeFilter = (dsId: string, filterId: string) => {
    const ds = dataSources.find((d) => d.id === dsId)
    if (!ds) return
    updateDataSource(dsId, { filters: ds.filters.filter((f) => f.id !== filterId) })
  }

  const updateFilter = (dsId: string, filterId: string, updates: Partial<FilterCondition>) => {
    const ds = dataSources.find((d) => d.id === dsId)
    if (!ds) return
    updateDataSource(dsId, {
      filters: ds.filters.map((f) => (f.id === filterId ? { ...f, ...updates } : f)),
    })
  }

  // ── Grouping helpers ────────────────────────────────────────────────────────

  const toggleGroupBy = (value: GroupByType) => {
    if (value === 'sales_personnel_id') return
    setGroupBy((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value],
    )
  }

  // ── Simulated KPI value for sample testing ──────────────────────────────────

  const firstAgg = dataSources.find((ds) => ds.aggregation)?.aggregation
  const simulatedValue =
    firstAgg === 'SUM' || firstAgg === 'AVG' ? '₹3,42,000' : '47'

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen py-2">
      <div className="max-w-full space-y-4 p-2">
        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Incentive KPI Builder</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Define and configure incentive KPIs using the guided query builder
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowJSON((v) => !v)}
              icon={<FiCode className="h-4 w-4" />}
            >
              {showJSON ? 'Hide JSON' : 'View JSON'}
            </Button>
            <Button
              variant="green"
              size="sm"
              disabled={!isConfigValid}
              onClick={() => setShowPreview(true)}
              icon={<FiPlay className="h-4 w-4" />}
            >
              Live Preview
            </Button>
          </div>
        </div>

        {/* Two-column layout: builder (left) + right panel */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* ── LEFT: Builder sections ── */}
          <div className="space-y-4 xl:col-span-2">
            {/* KPI Name */}
            <Card className="rounded-lg border border-neutral-200">
              <CardContent className="p-4">
                <Label className="text-sm font-semibold text-neutral-700">KPI Name</Label>
                <Input
                  label=""
                  variant="outlined"
                  className="mt-1"
                  placeholder="e.g., Total Premium by Sales Personnel"
                  value={kpiName}
                  onChange={(e) => setKpiName(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* ── Data Sources (multi-object) ── */}
            <Card className="rounded-lg border border-neutral-200">
              <CardHeader className="px-4 pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SectionBadge letter="A" />
                    <CardTitle className="text-base">Data Sources</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addDataSource}
                    icon={<FiPlus className="h-3 w-3" />}
                  >
                    Add Data Source
                  </Button>
                </div>
                <p className="text-xs text-neutral-500">
                  Add one or more object types to aggregate data from. Each data source contributes
                  an independent metric to the KPI.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-4">
                {dataSources.map((ds, dsIndex) => {
                  const allObjectFields: FieldMetadata[] =
                    ds.object ? (OBJECT_FIELDS[ds.object as ObjectType] ?? []) : []
                  const aggregationCompatibleFields: FieldMetadata[] =
                    ds.object && ds.aggregation
                      ? allObjectFields.filter((f) =>
                          (AGGREGATION_FIELD_TYPES[ds.aggregation as AggregationType] ?? []).includes(
                            f.type,
                          ),
                        )
                      : []

                  return (
                    <div
                      key={ds.id}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-4"
                    >
                      {/* Data source header */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-neutral-700">
                          Data Source {dsIndex + 1}
                        </span>
                        {dataSources.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDataSource(ds.id)}
                            className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                            aria-label="Remove data source"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Sub-section A: Object */}
                      <div>
                        <Label className="text-xs font-semibold text-neutral-600">
                          <SectionBadge letter="A" /> Object
                        </Label>
                        <Select
                          value={ds.object}
                          onValueChange={(v) =>
                            updateDataSource(ds.id, {
                              object: v as ObjectType,
                              field: '',
                              filters: [],
                            })
                          }
                        >
                          <SelectTrigger className="mt-1 w-full">
                            <SelectValue placeholder="Select object…" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="policy">Policy</SelectItem>
                            <SelectItem value="training">Training</SelectItem>
                            <SelectItem value="sales_activity">Sales Activity</SelectItem>
                          </SelectContent>
                        </Select>
                        {ds.object && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {OBJECT_FIELDS[ds.object as ObjectType].map((f) => (
                              <Badge
                                key={f.key}
                                variant="outline"
                                className="text-xs text-neutral-600"
                              >
                                {f.label}
                                <span className="ml-1 text-neutral-400">({f.type})</span>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Sub-section B: Aggregation */}
                      <div>
                        <Label className="text-xs font-semibold text-neutral-600">
                          <SectionBadge letter="B" /> Aggregation
                        </Label>
                        <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {(['SUM', 'COUNT', 'DISTINCT_COUNT', 'AVG'] as AggregationType[]).map(
                            (agg) => (
                              <button
                                key={agg}
                                type="button"
                                onClick={() =>
                                  updateDataSource(ds.id, { aggregation: agg, field: '' })
                                }
                                className={`rounded-lg border p-3 text-center transition ${
                                  ds.aggregation === agg
                                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-teal-300 hover:bg-teal-50'
                                }`}
                              >
                                <p className="text-sm font-semibold">{AGGREGATION_LABELS[agg]}</p>
                                <p className="mt-1 text-xs text-neutral-500">
                                  {agg === 'SUM' && 'Sum of numeric field'}
                                  {agg === 'COUNT' && 'Count of records'}
                                  {agg === 'DISTINCT_COUNT' && 'Unique count'}
                                  {agg === 'AVG' && 'Average value'}
                                </p>
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Sub-section C: Field */}
                      <div
                        className={`transition-opacity ${!ds.aggregation ? 'opacity-60' : ''}`}
                      >
                        <Label className="text-xs font-semibold text-neutral-600">
                          <SectionBadge letter="C" /> Field
                        </Label>
                        <Select
                          value={ds.field}
                          onValueChange={(v) => updateDataSource(ds.id, { field: v })}
                          disabled={!ds.aggregation || !ds.object}
                        >
                          <SelectTrigger className="mt-1 w-full">
                            <SelectValue
                              placeholder={
                                aggregationCompatibleFields.length === 0
                                  ? 'No compatible fields'
                                  : 'Select field…'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {aggregationCompatibleFields.map((f) => (
                              <SelectItem key={f.key} value={f.key}>
                                <span className="flex items-center gap-2">
                                  {f.label}
                                  <Badge variant="outline" className="text-xs">
                                    {f.type}
                                  </Badge>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {ds.aggregation && aggregationCompatibleFields.length === 0 && ds.object && (
                          <p className="mt-1 text-xs text-red-500">
                            No compatible fields for{' '}
                            {AGGREGATION_LABELS[ds.aggregation as AggregationType]} on this object.
                          </p>
                        )}
                      </div>

                      {/* Sub-section E: Filters */}
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-neutral-600">
                            <SectionBadge letter="E" /> Filters
                          </Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFilter(ds.id)}
                            disabled={!ds.object}
                            icon={<FiPlus className="h-3 w-3" />}
                          >
                            Add Filter
                          </Button>
                        </div>
                        <div className="mt-2 space-y-3">
                          {ds.filters.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-neutral-300 p-3 text-center">
                              <p className="text-xs text-neutral-400">
                                No filters. Click "Add Filter" to begin.
                              </p>
                            </div>
                          ) : (
                            ds.filters.map((filter, idx) => (
                              <div key={filter.id} className="space-y-2">
                                {idx > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Separator className="flex-1" />
                                    <div className="flex gap-1">
                                      {(['AND', 'OR'] as const).map((op) => (
                                        <button
                                          key={op}
                                          type="button"
                                          onClick={() =>
                                            updateFilter(ds.id, filter.id, {
                                              logicalOperator: op,
                                            })
                                          }
                                          className={`rounded px-2 py-0.5 text-xs font-semibold transition ${
                                            filter.logicalOperator === op
                                              ? 'bg-teal-600 text-white'
                                              : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                                          }`}
                                        >
                                          {op}
                                        </button>
                                      ))}
                                    </div>
                                    <Separator className="flex-1" />
                                  </div>
                                )}
                                <div className="flex items-start gap-2">
                                  <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
                                    <Select
                                      value={filter.field}
                                      onValueChange={(v) =>
                                        updateFilter(ds.id, filter.id, { field: v })
                                      }
                                    >
                                      <SelectTrigger className="w-full text-sm">
                                        <SelectValue placeholder="Field" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {allObjectFields.map((f) => (
                                          <SelectItem key={f.key} value={f.key}>
                                            {f.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Select
                                      value={filter.operator}
                                      onValueChange={(v) =>
                                        updateFilter(ds.id, filter.id, {
                                          operator: v as OperatorType,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="w-full text-sm">
                                        <SelectValue placeholder="Operator" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {OPERATORS.map((op) => (
                                          <SelectItem key={op.value} value={op.value}>
                                            {op.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      label=""
                                      variant="outlined"
                                      className="text-sm"
                                      placeholder={
                                        filter.operator === 'IN' || filter.operator === 'NOT_IN'
                                          ? 'e.g., ULIP, TERM'
                                          : filter.operator === 'BETWEEN'
                                            ? 'e.g., 2024-01-01,2024-12-31'
                                            : 'Value'
                                      }
                                      value={filter.value}
                                      onChange={(e) =>
                                        updateFilter(ds.id, filter.id, { value: e.target.value })
                                      }
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeFilter(ds.id, filter.id)}
                                    className="mt-1 rounded p-1.5 text-red-500 transition hover:bg-red-50"
                                    aria-label="Remove filter"
                                  >
                                    <FiTrash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Section D – Grouping */}
            <Card className="rounded-lg border border-neutral-200">
              <CardHeader className="px-4 pb-2 pt-4">
                <div className="flex items-center gap-2">
                  <SectionBadge letter="D" />
                  <CardTitle className="text-base">Grouping</CardTitle>
                </div>
                <p className="text-xs text-neutral-500">Define how results are grouped</p>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4">
                {/* Mandatory locked field */}
                <div className="flex items-center gap-3 rounded-lg border border-teal-200 bg-teal-50 p-3">
                  <Checkbox checked disabled />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-teal-800">Sales Personnel ID</p>
                    <p className="text-xs text-teal-600">
                      Mandatory grouping — always applied
                    </p>
                  </div>
                  <Badge className="bg-teal-200 text-teal-800">Locked</Badge>
                </div>

                {/* Optional fields */}
                {(
                  [
                    { value: 'team' as GroupByType, label: 'Team', desc: 'Group by team name' },
                    {
                      value: 'region' as GroupByType,
                      label: 'Region',
                      desc: 'Group by geographic region',
                    },
                  ] as const
                ).map((g) => {
                  const isChecked = groupBy.includes(g.value)
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => toggleGroupBy(g.value)}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-left transition ${
                        isChecked
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-neutral-200 hover:border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleGroupBy(g.value)}
                      />
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">{g.label}</p>
                        <p className="text-xs text-neutral-500">{g.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {/* Section F – Time Window */}
            <Card className="rounded-lg border border-neutral-200">
              <CardHeader className="px-4 pb-2 pt-4">
                <div className="flex items-center gap-2">
                  <SectionBadge letter="F" />
                  <CardTitle className="text-base">Time Window</CardTitle>
                </div>
                <p className="text-xs text-neutral-500">
                  Define the time range for the KPI calculation
                </p>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(
                    [
                      {
                        value: 'PROGRAM_DURATION',
                        label: 'Program Duration',
                        desc: 'Entire incentive program period',
                      },
                      {
                        value: 'CUSTOM_RANGE',
                        label: 'Custom Range',
                        desc: 'Specific start and end dates',
                      },
                      {
                        value: 'ROLLING_WINDOW',
                        label: 'Rolling Window',
                        desc: 'Last N days from today',
                      },
                    ] as const
                  ).map((tw) => (
                    <button
                      key={tw.value}
                      type="button"
                      onClick={() => setTimeWindow({ type: tw.value })}
                      className={`rounded-lg border p-3 text-left transition ${
                        timeWindow.type === tw.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      <p className="text-sm font-semibold">{tw.label}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">{tw.desc}</p>
                    </button>
                  ))}
                </div>

                {timeWindow.type === 'CUSTOM_RANGE' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-neutral-600">Start Date</Label>
                      <Input
                        label=""
                        variant="outlined"
                        type="date"
                        className="mt-1"
                        value={timeWindow.startDate ?? ''}
                        onChange={(e) =>
                          setTimeWindow((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-neutral-600">End Date</Label>
                      <Input
                        label=""
                        variant="outlined"
                        type="date"
                        className="mt-1"
                        value={timeWindow.endDate ?? ''}
                        onChange={(e) =>
                          setTimeWindow((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                )}

                {timeWindow.type === 'ROLLING_WINDOW' && (
                  <div className="flex items-center gap-3">
                    <Label className="whitespace-nowrap text-xs text-neutral-600">Last</Label>
                    <Input
                      label=""
                      variant="outlined"
                      type="number"
                      className="w-24"
                      placeholder="30"
                      min={1}
                      value={timeWindow.rollingDays ?? ''}
                      onChange={(e) =>
                        setTimeWindow((prev) => ({
                          ...prev,
                          rollingDays: parseInt(e.target.value, 10) || undefined,
                        }))
                      }
                    />
                    <span className="text-xs text-neutral-600">days</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT: Formula, JSON, Sample Test, Actions ── */}
          <div className="space-y-4">
            {/* Formula Readable Output */}
            <Card className="rounded-lg border border-neutral-200">
              <CardHeader className="px-4 pb-2 pt-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FiEye className="h-4 w-4" />
                  Formula
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {formulaLines.length > 0 ? (
                  <div className="space-y-3 rounded-lg bg-neutral-50 p-3 font-mono text-sm">
                    {formulaLines.map((line, idx) => (
                      <div key={idx} className="space-y-0.5">
                        {idx > 0 && (
                          <p className="text-xs font-semibold text-neutral-400">+ (combined)</p>
                        )}
                        <p className="font-bold text-teal-700">{line.main}</p>
                        <p className="text-neutral-500">{line.object}</p>
                        {line.where && (
                          <>
                            <p className="text-neutral-400">WHERE</p>
                            <pre className="whitespace-pre-wrap text-xs text-neutral-600">
                              {line.where}
                            </pre>
                          </>
                        )}
                      </div>
                    ))}
                    <p className="text-blue-600">GROUP BY {groupBy.join(', ')}</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-neutral-300 p-4 text-center">
                    <p className="text-xs text-neutral-400">
                      Formula will appear here as you configure the KPI
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* JSON Config Preview */}
            {showJSON && (
              <Card className="rounded-lg border border-neutral-200">
                <CardHeader className="px-4 pb-2 pt-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FiCode className="h-4 w-4" />
                    JSON Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <pre className="max-h-80 overflow-auto rounded-lg bg-neutral-900 p-3 text-xs text-green-400">
                    {JSON.stringify(kpiConfig, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Sample Data Testing */}
            <Card className="rounded-lg border border-neutral-200">
              <CardHeader className="px-4 pb-2 pt-4">
                <CardTitle className="text-base">Sample Data Testing</CardTitle>
                <p className="text-xs text-neutral-500">
                  Test the KPI with a specific Sales Personnel ID
                </p>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4">
                <div className="flex gap-2">
                  <Input
                    label=""
                    variant="outlined"
                    placeholder="e.g., SP001"
                    value={testPersonnelId}
                    onChange={(e) => setTestPersonnelId(e.target.value)}
                    className="flex-1 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!isConfigValid || !testPersonnelId}
                    onClick={() => setShowPreview(true)}
                    icon={<FiPlay className="h-3 w-3" />}
                  >
                    Test
                  </Button>
                </div>

                {testPersonnelId && isConfigValid && (
                  <div className="rounded-lg bg-neutral-50 p-3">
                    <p className="text-xs text-neutral-500">
                      KPI Value for {testPersonnelId}
                    </p>
                    <p className="mt-0.5 text-2xl font-bold text-teal-700">{simulatedValue}</p>
                    <p className="mt-1 text-xs text-neutral-400">Simulated result</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="rounded-lg border border-neutral-200">
              <CardContent className="space-y-2 p-4">
                <Button
                  variant="green"
                  size="md"
                  disabled={!isConfigValid || !kpiName}
                  className="w-full"
                  onClick={() => {
                    // TODO: POST /api/kpi — wire up when backend endpoint is available
                    console.info('Save KPI Definition:', JSON.stringify({ name: kpiName, ...kpiConfig }, null, 2))
                  }}
                >
                  Save KPI Definition
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  disabled={!isConfigValid}
                  className="w-full"
                  onClick={() => {
                    // TODO: POST /api/kpi/validate — wire up when backend endpoint is available
                    console.info('Validate KPI Config:', JSON.stringify(kpiConfig, null, 2))
                  }}
                >
                  Validate Configuration
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Live Preview Table */}
        {showPreview && isConfigValid && (
          <Card className="rounded-lg border border-neutral-200">
            <CardHeader className="px-4 pb-2 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FiEye className="h-4 w-4" />
                  Live Preview
                </CardTitle>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="text-xs text-neutral-400 hover:text-neutral-600"
                >
                  Close
                </button>
              </div>
              {formulaLines.length > 0 && (
                <p className="font-mono text-xs text-neutral-500">
                  {formulaLines.map((l) => `${l.main} ${l.object}`).join(' + ')}
                </p>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-600">
                        Personnel ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-600">
                        Sales Person
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-neutral-600">
                        {formulaLines[0]?.main ?? 'KPI Value'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_PREVIEW_DATA.map((row, idx) => (
                      <tr
                        key={row.personnel_id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}
                      >
                        <td className="px-4 py-2 font-mono text-xs text-neutral-600">
                          {row.personnel_id}
                        </td>
                        <td className="px-4 py-2 text-neutral-800">{row.sales_person}</td>
                        <td className="px-4 py-2 text-right font-semibold text-teal-700">
                          {firstAgg === 'SUM' || firstAgg === 'AVG'
                            ? `₹${row.kpi_value.toLocaleString()}`
                            : Math.floor(row.kpi_value / 10000)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-right text-xs text-neutral-400">
                * Preview shows simulated data for demonstration purposes
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default IncentiveKPIBuilder
