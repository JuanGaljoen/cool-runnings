'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportStockLevelsCSV } from '@/app/dashboard/stock/actions'
import { toast } from 'sonner'

export function ExportStockButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const { csv, filename, error } = await exportStockLevelsCSV()
    setLoading(false)

    if (error || !csv) {
      toast.error(error ?? 'Export failed')
      return
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Stock levels exported')
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading} className="gap-2">
      <Download className="h-4 w-4" />
      {loading ? 'Exporting…' : 'Export CSV'}
    </Button>
  )
}
