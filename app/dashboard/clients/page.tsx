import { createClient } from '@/lib/supabase/server'
import { ClientsTable } from '@/components/clients/clients-table'

export default async function ClientsPage() {
  const supabase = await createClient()

  const [{ data: clients, error }, { data: reps }] = await Promise.all([
    supabase.from('clients').select('*').order('company_name'),
    supabase.from('profiles').select('id, full_name').eq('role', 'rep').order('full_name'),
  ])

  if (error) console.error('Failed to fetch clients:', error.message)

  return (
    <div className="p-8">
      <ClientsTable clients={clients ?? []} reps={reps ?? []} />
    </div>
  )
}
