'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { archiveProduct } from '@/app/dashboard/products/actions'
import type { Tables } from '@/types/database'

type Product = Tables<'products'>

interface ProductRowActionsProps {
  product: Product
  onEdit: (product: Product) => void
}

export function ProductRowActions({ product, onEdit }: ProductRowActionsProps) {
  const [archiving, setArchiving] = useState(false)

  async function handleArchive() {
    setArchiving(true)
    await archiveProduct(product.id)
    setArchiving(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(product)}>
          Edit
        </DropdownMenuItem>
        {product.is_active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={archiving}
              onClick={handleArchive}
            >
              {archiving ? 'Archiving…' : 'Archive'}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
