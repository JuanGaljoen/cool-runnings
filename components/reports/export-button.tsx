'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportMovementsCSV } from '@/app/dashboard/reports/actions'
import { toast } from 'sonner'

export function ExportButton({ from, to }: { from: string; to: string }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    const { csv, error } = await exportMovementsCSV(from, to)
    setLoading(false)

    if (error || !csv) {
      toast.error(error ?? 'Export failed')
      return
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `movements-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV downloaded')
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={loading} className="gap-2">
      <Download className="h-4 w-4" />
      {loading ? 'Exporting…' : 'Export CSV'}
    </Button>
  )
}
