import { useState, useEffect, useCallback } from 'react'
import { FiEdit2, FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { incentiveService } from '@/services/incentiveService'
import type { IIncentiveProgram, IProductWeightageItem } from '@/models/incentive'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeightageRecord extends IProductWeightageItem {
  id: string
}

// ─── Modal Form Component ─────────────────────────────────────────────────────

interface WeightageFormProps {
  initial: Omit<WeightageRecord, 'id'> | null
  onSave: (data: Omit<WeightageRecord, 'id'>) => void
  onCancel: () => void
  isEdit: boolean
}

const WeightageForm = ({ initial, onSave, onCancel, isEdit }: WeightageFormProps) => {
  const [form, setForm] = useState({
    productName: initial?.productName ?? '',
    productCode: initial?.productCode ?? '',
    weight: initial?.weight ?? 0,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({})

  const validate = () => {
    const errs: Partial<Record<keyof typeof form, string>> = {}
    if (!form.productName.trim()) errs.productName = 'Product Name is required'
    if (!form.productCode.trim()) errs.productCode = 'Product Code is required'
    if (form.weight <= 0 || form.weight > 100) errs.weight = 'Weight must be between 1 and 100'
    return errs
  }

  const handleSubmit = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">
            {isEdit ? 'Edit Weightage' : 'Add New Weightage'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <Label className="mb-1.5 block text-xs font-semibold text-neutral-600">
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              label=""
              variant="outlined"
              placeholder="e.g., Term Life"
              value={form.productName}
              onChange={(e) => {
                setForm((f) => ({ ...f, productName: e.target.value }))
                setErrors((err) => ({ ...err, productName: undefined }))
              }}
            />
            {errors.productName && (
              <p className="mt-1 text-xs text-red-500">{errors.productName}</p>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-semibold text-neutral-600">
              Product Code <span className="text-red-500">*</span>
            </Label>
            <Input
              label=""
              variant="outlined"
              placeholder="e.g., TL-001"
              value={form.productCode}
              onChange={(e) => {
                setForm((f) => ({ ...f, productCode: e.target.value }))
                setErrors((err) => ({ ...err, productCode: undefined }))
              }}
            />
            {errors.productCode && (
              <p className="mt-1 text-xs text-red-500">{errors.productCode}</p>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-semibold text-neutral-600">
              Weight (%) <span className="text-red-500">*</span>
            </Label>
            <Input
              label=""
              variant="outlined"
              type="number"
              min={1}
              max={100}
              placeholder="e.g., 40"
              value={form.weight === 0 ? '' : String(form.weight)}
              onChange={(e) => {
                setForm((f) => ({ ...f, weight: Number(e.target.value) }))
                setErrors((err) => ({ ...err, weight: undefined }))
              }}
            />
            {errors.weight && (
              <p className="mt-1 text-xs text-red-500">{errors.weight}</p>
            )}
          </div>
        </div>

        <Separator />
        <div className="flex justify-end gap-2 px-5 py-4">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="green" size="sm" onClick={handleSubmit}>
            {isEdit ? 'Update' : 'Add'} Weightage
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

interface DeleteConfirmProps {
  name: string
  onConfirm: () => void
  onCancel: () => void
}

const DeleteConfirm = ({ name, onConfirm, onCancel }: DeleteConfirmProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
      <div className="px-5 py-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <FiTrash2 className="h-5 w-5 text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-neutral-900">Delete Weightage</h2>
        <p className="mt-1.5 text-sm text-neutral-500">
          Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.
        </p>
      </div>
      <Separator />
      <div className="flex justify-end gap-2 px-5 py-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" size="sm" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const ProductWeightage = () => {
  const [programs, setPrograms] = useState<IIncentiveProgram[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string>('')
  const [records, setRecords] = useState<WeightageRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editRecord, setEditRecord] = useState<WeightageRecord | null>(null)
  const [deleteRecord, setDeleteRecord] = useState<WeightageRecord | null>(null)

  // Load programs list on mount
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const result = await incentiveService.getPrograms({ pageNumber: 1, pageSize: 100 })
        const items = result?.items ?? []
        setPrograms(items)
        if (items.length > 0) {
          setSelectedProgramId(items[0].id)
        }
      } catch (err) {
        console.error('Failed to load programs:', err)
      }
    }
    fetchPrograms()
  }, [])

  // Load weightages when selected program changes
  const fetchWeightages = useCallback(async (programId: string) => {
    if (!programId) return
    setLoading(true)
    setError(null)
    try {
      const result = await incentiveService.getProductWeightage(programId)
      const items = (result?.weightages ?? []).map((w, idx) => ({
        ...w,
        id: String(idx + 1),
      }))
      setRecords(items)
    } catch (err) {
      console.error('Failed to load product weightages:', err)
      setError('Failed to load product weightages. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedProgramId) {
      fetchWeightages(selectedProgramId)
    }
  }, [selectedProgramId, fetchWeightages])

  const totalWeight = records.reduce((sum, r) => sum + r.weight, 0)

  const persistWeightages = async (updatedRecords: WeightageRecord[]) => {
    if (!selectedProgramId) return
    setSaving(true)
    try {
      await incentiveService.saveProductWeightage({
        id: selectedProgramId,
        weightages: updatedRecords.map(({ productCode, productName, weight }) => ({
          productCode,
          productName,
          weight,
        })),
      })
    } catch (err) {
      console.error('Failed to save product weightages:', err)
      setError('Failed to save. Please ensure the total weight equals 100%.')
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = async (data: Omit<WeightageRecord, 'id'>) => {
    const newRecord: WeightageRecord = { ...data, id: crypto.randomUUID() }
    const updated = [newRecord, ...records]
    setRecords(updated)
    setShowForm(false)
    await persistWeightages(updated)
  }

  const handleEdit = async (data: Omit<WeightageRecord, 'id'>) => {
    if (!editRecord) return
    const updated = records.map((r) => (r.id === editRecord.id ? { ...r, ...data } : r))
    setRecords(updated)
    setEditRecord(null)
    await persistWeightages(updated)
  }

  const handleDelete = async () => {
    if (!deleteRecord) return
    const updated = records.filter((r) => r.id !== deleteRecord.id)
    setRecords(updated)
    setDeleteRecord(null)
    await persistWeightages(updated)
  }

  return (
    <div className="min-h-screen py-2">
      <div className="max-w-full space-y-5 p-2">
        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Product Weightage Management</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Manage product weightage configurations used in incentive calculations.
            </p>
          </div>
          <Button
            variant="green"
            size="sm"
            icon={<FiPlus className="h-4 w-4" />}
            onClick={() => setShowForm(true)}
            disabled={!selectedProgramId}
          >
            Add Weightage
          </Button>
        </div>

        {/* Program Selector */}
        {programs.length > 0 && (
          <div className="flex items-center gap-3">
            <Label className="text-sm font-semibold text-neutral-600 shrink-0">Program:</Label>
            <select
              className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => fetchWeightages(selectedProgramId)}
              className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
              title="Refresh"
            >
              <FiRefreshCw className="h-4 w-4" />
            </button>
            {totalWeight > 0 && (
              <Badge
                className={`text-xs ${
                  totalWeight === 100
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                }`}
              >
                Total: {totalWeight.toFixed(2)}%{totalWeight !== 100 && ' (must equal 100%)'}
              </Badge>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Table */}
        <Card className="rounded-xl border border-neutral-200 shadow-sm">
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-base">Weightage Records</CardTitle>
            <p className="mt-0.5 text-xs text-neutral-500">
              {records.length} record{records.length !== 1 ? 's' : ''} total
              {saving && ' · Saving…'}
            </p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {loading ? (
              <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center">
                <p className="text-sm text-neutral-400">Loading weightages…</p>
              </div>
            ) : records.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                  <FiPlus className="h-6 w-6 text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-neutral-500">No weightage records</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {selectedProgramId
                    ? 'Click "Add Weightage" to create your first record.'
                    : 'Select a program first.'}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-neutral-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Product Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Product Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Weight (%)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => (
                      <tr
                        key={record.id}
                        className={`border-b border-neutral-100 transition hover:bg-neutral-50 ${
                          idx === records.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-neutral-800">
                          {record.productName}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono text-xs">
                            {record.productCode}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-neutral-700 font-semibold">
                          {record.weight}%
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => setEditRecord(record)}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 transition hover:bg-blue-50"
                            >
                              <FiEdit2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={() => setDeleteRecord(record)}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-red-500 transition hover:bg-red-50"
                            >
                              <FiTrash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <WeightageForm
          initial={null}
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
          isEdit={false}
        />
      )}

      {/* Edit Form Modal */}
      {editRecord && (
        <WeightageForm
          initial={{
            productName: editRecord.productName,
            productCode: editRecord.productCode,
            weight: editRecord.weight,
          }}
          onSave={handleEdit}
          onCancel={() => setEditRecord(null)}
          isEdit={true}
        />
      )}

      {/* Delete Confirmation */}
      {deleteRecord && (
        <DeleteConfirm
          name={deleteRecord.productName}
          onConfirm={handleDelete}
          onCancel={() => setDeleteRecord(null)}
        />
      )}
    </div>
  )
}

export default ProductWeightage
