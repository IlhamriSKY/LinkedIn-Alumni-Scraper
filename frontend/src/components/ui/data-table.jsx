import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Download,
  ExternalLink,
  User,
  Building,
  MapPin,
  ArrowUpDown
} from 'lucide-react'
export const columns = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:text-primary"
        >
          <User className="h-4 w-4 mr-2" />
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue("name") || row.original.Name || "Unknown"
      return (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">{name}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "found",
    header: "Status",
    cell: ({ row }) => {
      const found = row.getValue("found") === true || 
                   row.getValue("found") === 'Yes' || 
                   row.original.Found === 'Yes'
      return (
        <Badge variant={found ? "default" : "destructive"} className={found ? "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600" : "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"}>
          {found ? "Found" : "Not Found"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "position",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:text-primary"
        >
          <Building className="h-4 w-4 mr-2" />
          Position
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const position = row.getValue("position") || row.original.Position || "N/A"
      return (
        <div className="flex items-center space-x-1">
          <Building className="h-3 w-3 text-muted-foreground" />
          <span className="max-w-[200px] truncate" title={position}>
            {position}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "company",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:text-primary"
        >
          <Building className="h-4 w-4 mr-2" />
          Company
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const company = row.getValue("company") || row.original.Company || "N/A"
      return (
        <div className="flex items-center space-x-1">
          <Building className="h-3 w-3 text-muted-foreground" />
          <span className="max-w-[150px] truncate" title={company}>
            {company}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "location",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:text-primary"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Location
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const location = row.getValue("location") || row.original.Location || "N/A"
      return (
        <div className="flex items-center space-x-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="max-w-[120px] truncate" title={location}>
            {location}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "bio",
    header: "Bio",
    cell: ({ row }) => {
      const bio = row.getValue("bio") || row.original.Bio || ""
      return (
        <div className="max-w-[200px]">
          <span className="text-xs text-muted-foreground truncate" title={bio}>
            {bio.length > 50 ? bio.substring(0, 50) + "..." : bio || "N/A"}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "scrapedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:text-primary"
        >
          Scraped At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const scrapedAt = row.getValue("scrapedAt") || row.original["Scraped At"]
      if (!scrapedAt) return "Unknown"
      try {
        const date = new Date(scrapedAt)
        return (
          <div className="text-xs text-muted-foreground">
            {date.toLocaleString()}
          </div>
        )
      } catch (e) {
        return (
          <div className="text-xs text-muted-foreground">
            {scrapedAt.toString()}
          </div>
        )
      }
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const profileUrl = row.original.profileUrl || row.original["Profile URL"]
      if (!profileUrl) return null
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(profileUrl, '_blank')}
          className="h-6 w-6 p-0 hover:bg-muted"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      )
    },
  },
]
export function DataTable({
  columns,
  data,
  title = "Alumni Data",
  isLoading = false
}) {
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const normalizedData = React.useMemo(() => {
    return data.map(item => ({
      name: item.name || item.Name || 'Unknown',
      found: item.found === true || item.found === 'Yes' || item.Found === 'Yes',
      position: item.position || item.Position || 'N/A',
      company: item.company || item.Company || 'N/A',
      location: item.location || item.Location || 'N/A',
      bio: item.bio || item.Bio || '',
      scrapedAt: item.scrapedAt || item['Scraped At'],
      profileUrl: item.profileUrl || item['Profile URL'],
      ...item // Keep original data as well
    }))
  }, [data])
  const table = useReactTable({
    data: normalizedData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    globalFilterFn: "includesString",
  })
  const handleExport = () => {
    if (normalizedData.length === 0) return
    const headers = [
      'Name', 'Position', 'Company', 'Location', 'Found', 'Scraped At'
    ]
    const csvContent = [
      headers.join(','),
      ...normalizedData.map(row => [
        `"${(row.name || '').replace(/"/g, '""')}"`,
        `"${(row.position || '').replace(/"/g, '""')}"`,
        `"${(row.company || '').replace(/"/g, '""')}"`,
        `"${(row.location || '').replace(/"/g, '""')}"`,
        `"${row.found ? 'Yes' : 'No'}"`,
        `"${(row.scrapedAt || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  if (isLoading && normalizedData.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading data...</span>
        </div>
      </div>
    )
  }
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} of {normalizedData.length} total records
          </p>
        </div>
      </div>
      {/* Search */}
      <div className="flex items-center justify-between py-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search all columns..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="pl-8"
          />
        </div>
        <Button
          onClick={handleExport}
          size="sm"
          variant="outline"
          disabled={normalizedData.length === 0}
          className="ml-4"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value))
            }}
            className="h-8 w-[70px] rounded border border-input bg-background px-2 text-sm"
          >
            {[5, 10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {/* Loading indicator for scraping in progress */}
      {isLoading && normalizedData.length > 0 && (
        <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          Scraping in progress...
        </div>
      )}
    </div>
  )
}
