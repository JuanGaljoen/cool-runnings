'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export type ChartDataPoint = {
  date: string
  production: number
  dispatch: number
}

export function MovementChart({ data }: { data: ChartDataPoint[] }) {
  if (data.every((d) => d.production === 0 && d.dispatch === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No production or dispatch movements in this period.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            fontSize: '13px',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--popover))',
            color: 'hsl(var(--popover-foreground))',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '13px' }} />
        <Bar dataKey="production" name="Production" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="dispatch" name="Dispatch" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
