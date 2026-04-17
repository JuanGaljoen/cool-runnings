'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { MovementForm } from '@/components/stock/movement-form'

type Product = { id: string; name: string }
type Client = { id: string; company_name: string }

export function QuickRecordSheet({
  products,
  clients,
}: {
  products: Product[]
  clients: Client[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Record movement
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Record movement</SheetTitle>
          </SheetHeader>
          <MovementForm
            products={products}
            clients={clients}
            onSuccess={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
