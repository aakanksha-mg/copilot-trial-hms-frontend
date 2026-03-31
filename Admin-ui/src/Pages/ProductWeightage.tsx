import { useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { Label } from '@/components/ui/label'
import Button from '@/components/ui/button'
import { incentiveService } from '@/services/incentiveService'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PRODUCTS = [
  { code: 'MARUTI_CIAZ', name: 'Maruti Ciaz' },
  { code: 'MARUTI_SWIFT', name: 'Maruti Swift' },
  { code: 'HYUNDAI_I20', name: 'Hyundai i20' },
  { code: 'HONDA_CITY', name: 'Honda City' },
]

const MOCK_VERSIONS: Record<string, Array<string>> = {
  MARUTI_CIAZ: ['2002-2003', '2025-2003'],
  MARUTI_SWIFT: ['2015-2016', '2020-2021'],
  HYUNDAI_I20: ['2018-2019', '2022-2023'],
  HONDA_CITY: ['2016-2017', '2021-2022'],
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DimensionData {
  tableName: string
  property: string
  rangeFrom: string
  rangeTo: string
  saved: boolean
}

interface DetailRow {
  weightageDetailsId: string
  productCode: string
  version: string
  dimensions: Partial<Record<number, DimensionData>>
}

interface DimModalState {
  rowId: string
  dimensionNo: number
  weightageDetailsId: string
  productCode: string
  version: string
}

// ─── Dimension Modal ──────────────────────────────────────────────────────────

interface DimensionModalProps {
  dimensionNo: number
  initial: DimensionData | null
  saving: boolean
  onSave: (data: Omit<DimensionData, 'saved'>) => void
  onCancel: () => void
}

const DimensionModal = ({ dimensionNo, initial, saving, onSave, onCancel }: DimensionModalProps) => {
  const [form, setForm] = useState({
    tableName: initial?.tableName ?? '',
    property: initial?.property ?? '',
    rangeFrom: initial?.rangeFrom ?? '',
    rangeTo: initial?.rangeTo ?? '',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Dimension {dimensionNo}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-600">Table Name</Label>
            <input
              type="text"
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.tableName}
              onChange={(e) => setForm((f) => ({ ...f, tableName: e.target.value }))}
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-600">
              Column/Property
            </Label>
            <input
              type="text"
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.property}
              onChange={(e) => setForm((f) => ({ ...f, property: e.target.value }))}
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-600">Range From</Label>
            <input
              type="text"
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.rangeFrom}
              onChange={(e) => setForm((f) => ({ ...f, rangeFrom: e.target.value }))}
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-600">Range To</Label>
            <input
              type="text"
              className="w-full rounded border border-neutral-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.rangeTo}
              onChange={(e) => setForm((f) => ({ ...f, rangeTo: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-3">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="green" size="sm" onClick={() => onSave(form)} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DIMENSIONS = Array.from({ length: 10 }, (_, i) => i + 1)

const ProductWeightage = () => {
  // Master form
  const [masterForm, setMasterForm] = useState({ weightName: '', startDate: '', endDate: '' })
  const [weightageId, setWeightageId] = useState<string | null>(null)
  const [masterSaving, setMasterSaving] = useState(false)
  const [masterError, setMasterError] = useState<string | null>(null)

  // Detail rows
  const [detailRows, setDetailRows] = useState<Array<DetailRow>>([])
  const [rowSaving, setRowSaving] = useState(false)
  const [rowError, setRowError] = useState<string | null>(null)

  // Dimension modal
  const [dimModal, setDimModal] = useState<DimModalState | null>(null)
  const [dimSaving, setDimSaving] = useState(false)

  // ─── Create Master ───────────────────────────────────────────────────────

  const handleCreateMaster = async () => {
    const { weightName, startDate, endDate } = masterForm
    if (!weightName.trim() || !startDate || !endDate) {
      setMasterError('All fields (Weight Name, Start Date, End Date) are required.')
      return
    }
    if (endDate < startDate) {
      setMasterError('End Date must be on or after Start Date.')
      return
    }
    setMasterSaving(true)
    setMasterError(null)
    try {
      const res = await incentiveService.createWeightageMaster({ weightName, startDate, endDate })
      setWeightageId(res.weightageId)
    } catch {
      setMasterError('Failed to create weightage master. Please try again.')
    } finally {
      setMasterSaving(false)
    }
  }

  // ─── Add Detail Row ──────────────────────────────────────────────────────

  const handleAddRow = async () => {
    if (!weightageId) return
    setRowSaving(true)
    setRowError(null)
    try {
      const res = await incentiveService.createWeightageDetails({ weightageId })
      setDetailRows((prev) => [
        ...prev,
        { weightageDetailsId: res.weightageDetailsId, productCode: '', version: '', dimensions: {} },
      ])
    } catch {
      setRowError('Failed to add row. Please try again.')
    } finally {
      setRowSaving(false)
    }
  }

  // ─── Delete Detail Row ───────────────────────────────────────────────────

  const handleDeleteRow = async (weightageDetailsId: string) => {
    try {
      await incentiveService.deleteWeightageDetails({ weightageDetailsId })
      setDetailRows((prev) => prev.filter((r) => r.weightageDetailsId !== weightageDetailsId))
    } catch {
      setRowError('Failed to delete row. Please try again.')
    }
  }

  // ─── Update Row Field ────────────────────────────────────────────────────

  const updateRowField = (
    weightageDetailsId: string,
    field: 'productCode' | 'version',
    value: string,
  ) => {
    setDetailRows((prev) =>
      prev.map((r) => {
        if (r.weightageDetailsId !== weightageDetailsId) return r
        if (field === 'productCode') return { ...r, productCode: value, version: '' }
        return { ...r, [field]: value }
      }),
    )
  }

  // ─── Save Dimension ──────────────────────────────────────────────────────

  const handleDimSave = async (data: Omit<DimensionData, 'saved'>) => {
    if (!dimModal) return
    const { rowId, dimensionNo, weightageDetailsId, productCode, version } = dimModal
    setDimSaving(true)
    try {
      await incentiveService.saveWeightageDimension({
        weightageDetailsId,
        productCode,
        version,
        dimensionNo,
        ...data,
      })
      setDetailRows((prev) =>
        prev.map((r) => {
          if (r.weightageDetailsId !== rowId) return r
          return {
            ...r,
            dimensions: { ...r.dimensions, [dimensionNo]: { ...data, saved: true } },
          }
        }),
      )
      setDimModal(null)
    } catch {
      // keep modal open on error so user can retry
    } finally {
      setDimSaving(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* ── Master Section (Green) ─────────────────────────────────────────── */}
      <div className="rounded-lg border-2 border-green-400 bg-green-50 p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-700">Weight Name</Label>
            <input
              type="text"
              placeholder="Text Box"
              disabled={!!weightageId}
              value={masterForm.weightName}
              onChange={(e) => setMasterForm((f) => ({ ...f, weightName: e.target.value }))}
              className="rounded border border-green-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 w-48 disabled:bg-green-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-700">Start Date</Label>
            <input
              type="date"
              disabled={!!weightageId}
              value={masterForm.startDate}
              onChange={(e) => setMasterForm((f) => ({ ...f, startDate: e.target.value }))}
              className="rounded border border-green-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 w-40 disabled:bg-green-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-neutral-700">End Date</Label>
            <input
              type="date"
              disabled={!!weightageId}
              value={masterForm.endDate}
              onChange={(e) => setMasterForm((f) => ({ ...f, endDate: e.target.value }))}
              className="rounded border border-green-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 w-40 disabled:bg-green-100 disabled:cursor-not-allowed"
            />
          </div>
          {!weightageId ? (
            <Button variant="green" size="sm" onClick={handleCreateMaster} disabled={masterSaving}>
              {masterSaving ? 'Creating…' : 'Create'}
            </Button>
          ) : (
            <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-300 rounded px-3 py-1.5">
              ✓ Created (ID: {weightageId})
            </span>
          )}
        </div>
        {masterError && <p className="mt-2 text-xs text-red-600">{masterError}</p>}
      </div>

      {/* ── Details Section (Blue header / Orange rows) ────────────────────── */}
      <div>
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            icon={<FiPlus className="h-4 w-4" />}
            onClick={handleAddRow}
            disabled={!weightageId || rowSaving}
          >
            {rowSaving ? 'Adding…' : 'Add New Row'}
          </Button>
        </div>

        {rowError && (
          <div className="mb-2 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {rowError}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-neutral-300">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-500 text-white">
                <th className="border border-blue-400 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                  WeightageDetailsId
                </th>
                <th className="border border-blue-400 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                  Product Code
                </th>
                <th className="border border-blue-400 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                  Version
                </th>
                {DIMENSIONS.map((d) => (
                  <th
                    key={d}
                    className="border border-blue-400 px-3 py-2 text-xs font-semibold whitespace-nowrap"
                  >
                    Dimension {d}
                  </th>
                ))}
                <th className="border border-blue-400 px-3 py-2 text-xs font-semibold whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {detailRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={14}
                    className="px-4 py-8 text-center text-sm text-neutral-400"
                  >
                    {weightageId
                      ? 'Click "Add New Row" to add detail entries.'
                      : 'Create a Weightage Master first.'}
                  </td>
                </tr>
              ) : (
                detailRows.map((row, idx) => (
                  <tr
                    key={row.weightageDetailsId}
                    className={idx % 2 === 0 ? 'bg-orange-50' : 'bg-orange-100'}
                  >
                    <td className="border border-orange-200 px-3 py-2 text-center font-mono text-xs">
                      {row.weightageDetailsId}
                    </td>
                    <td className="border border-orange-200 px-2 py-1">
                      <select
                        className="w-full rounded border border-orange-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                        value={row.productCode}
                        onChange={(e) =>
                          updateRowField(row.weightageDetailsId, 'productCode', e.target.value)
                        }
                      >
                        <option value="">Select…</option>
                        {MOCK_PRODUCTS.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-orange-200 px-2 py-1">
                      <select
                        className="w-full rounded border border-orange-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-orange-50 disabled:cursor-not-allowed"
                        value={row.version}
                        disabled={!row.productCode}
                        onChange={(e) =>
                          updateRowField(row.weightageDetailsId, 'version', e.target.value)
                        }
                      >
                        <option value="">Select…</option>
                        {(MOCK_VERSIONS[row.productCode] ?? []).map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </td>
                    {DIMENSIONS.map((d) => {
                      const dim = row.dimensions[d]
                      return (
                        <td
                          key={d}
                          className={`border border-orange-200 px-2 py-1 text-center ${dim?.saved ? 'bg-green-100' : ''}`}
                        >
                          <button
                            type="button"
                            className={`text-xs font-semibold underline ${
                              dim?.saved
                                ? 'text-green-700 hover:text-green-900'
                                : 'text-blue-600 hover:text-blue-800'
                            }`}
                            onClick={() =>
                              setDimModal({
                                rowId: row.weightageDetailsId,
                                dimensionNo: d,
                                weightageDetailsId: row.weightageDetailsId,
                                productCode: row.productCode,
                                version: row.version,
                              })
                            }
                          >
                            {dim?.saved ? '✓ Edit' : 'Click Here'}
                          </button>
                        </td>
                      )
                    })}
                    <td className="border border-orange-200 px-2 py-1 text-center">
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 mx-auto"
                        onClick={() => handleDeleteRow(row.weightageDetailsId)}
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Dimension Modal ────────────────────────────────────────────────── */}
      {dimModal && (
        <DimensionModal
          dimensionNo={dimModal.dimensionNo}
          initial={
            detailRows.find((r) => r.weightageDetailsId === dimModal.rowId)?.dimensions[
              dimModal.dimensionNo
            ] ?? null
          }
          saving={dimSaving}
          onSave={handleDimSave}
          onCancel={() => setDimModal(null)}
        />
      )}
    </div>
  )
}

export default ProductWeightage
