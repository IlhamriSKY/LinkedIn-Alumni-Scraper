import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Database } from 'lucide-react'

/**
 * Alumni DataTable Wrapper Component
 * Uses official shadcn/ui DataTable with TanStack Table
 */
export function AlumniDataTable({ data = [], title = "Alumni Data", isLoading = false }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Manage and explore your LinkedIn alumni data with advanced search, sorting, and filtering capabilities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable 
          data={data} 
          title={title}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  )
}

export default AlumniDataTable
