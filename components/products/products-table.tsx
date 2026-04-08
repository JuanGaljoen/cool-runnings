'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Plus } from 'lucide-react'
import { ProductDialog } from './product-dialog'
import { ProductRowActions } from './product-row-actions'
import { useUser } from '@/components/providers/user-provider'
import type { Tables } from '@/types/database'

type Product = Tables<'products'>

interface ProductsTableProps {
  products: Product[]
}

export function ProductsTable({ products }: ProductsTableProps) {
  const { profile } = useUser()
  const isAdmin = profile?.role === 'admin'

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  function openAdd() {
    setSelectedProduct(null)
    setDialogOpen(true)
  }

  function openEdit(product: Product) {
    setSelectedProduct(product)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add product
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Low stock threshold</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && (
                <TableHead className="w-[60px]" />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 6 : 5}
                  className="text-center text-muted-foreground py-10"
                >
                  No products yet.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell>{product.low_stock_threshold}</TableCell>
                  <TableCell>
                    <StatusBadge isActive={product.is_active} />
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <ProductRowActions
                        product={product}
                        onEdit={openEdit}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isAdmin && (
        <ProductDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          product={selectedProduct}
        />
      )}
    </>
  )
}
