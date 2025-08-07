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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Download,
  ExternalLink,
  User,
  Building,
  MapPin,
  ArrowUpDown,
  Eye,
  EyeOff,
  Settings,
  ChevronDown
} from 'lucide-react'
import { useDatatableSettings } from "@/hooks/useSettings"

export const createColumns = (isSensorMode, sensorName, sensorCompany, sensorBio, sensorLocation) => [
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
      const displayName = isSensorMode ? sensorName(name) : name
      return (
        <div className="flex items-center space-x-2 min-w-[180px]">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">{displayName}</div>
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
      const displayCompany = isSensorMode ? sensorCompany(company) : company
      return (
        <div className="flex items-center space-x-1">
          <Building className="h-3 w-3 text-muted-foreground" />
          <span className="max-w-[150px] truncate" title={displayCompany}>
            {displayCompany}
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
      const displayLocation = isSensorMode ? sensorLocation(location) : location
      return (
        <div className="flex items-center space-x-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="max-w-[120px] truncate" title={displayLocation}>
            {displayLocation}
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
      const displayBio = isSensorMode ? sensorBio(bio) : bio
      return (
        <div className="min-w-[250px] max-w-[300px]">
          <span className="text-xs text-muted-foreground" title={displayBio}>
            {displayBio.length > 80 ? displayBio.substring(0, 80) + "..." : displayBio || "N/A"}
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
          <div className="text-xs text-muted-foreground min-w-[140px]">
            {date.toLocaleString()}
          </div>
        )
      } catch (e) {
        return (
          <div className="text-xs text-muted-foreground min-w-[140px]">
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
  data,
  title = "Alumni Data",
  isLoading = false,
  isSensorMode = true
}) {
  // Get settings from hook FIRST
  const { 
    datatableSettings,
    defaultVisibleColumns,
    sensorSettings,
    paginationSettings 
  } = useDatatableSettings()

  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Initialize sensor mode from settings (default ON) - AFTER sensorSettings is defined
  // const [isSensorMode, setIsSensorMode] = React.useState(sensorSettings?.defaultSensorMode ?? true)

  // Enhanced sensor functions using settings - made more attractive
  const sensorName = React.useCallback((name) => {
    if (!name || name === "Unknown" || name === "N/A") return name
    if (name.length <= 2) return name
    const char = sensorSettings?.sensorChar || "●"
    // Show first letter + attractive masking
    return name.charAt(0) + char.repeat(Math.min(3, name.length - 1)) + (name.length > 4 ? name.slice(-1) : "")
  }, [sensorSettings])

  const sensorCompany = React.useCallback((company) => {
    if (!company || company === "N/A" || company.length <= 3) return company
    if (!sensorSettings?.enableCompanySensor) return company
    const char = sensorSettings?.sensorChar || "●"
    // Show first 2 chars + masking
    return company.substring(0, 2) + char.repeat(Math.min(4, company.length - 2))
  }, [sensorSettings])

  const sensorBio = React.useCallback((bio) => {
    if (!bio || bio === "N/A" || bio.length <= 10) return bio
    if (!sensorSettings?.enableBioSensor) return bio
    const char = sensorSettings?.sensorChar || "●"
    const words = bio.split(' ')
    if (words.length <= 2) return bio
    // Show first 2 words + attractive masking for rest
    return words.slice(0, 2).join(' ') + ` ${char}${char}${char} [${words.length - 2} more words] ${char}${char}${char}`
  }, [sensorSettings])

  const sensorLocation = React.useCallback((location) => {
    if (!location || location === "N/A" || location.length <= 3) return location
    if (!sensorSettings?.enableLocationSensor) return location
    const char = sensorSettings?.sensorChar || "●"
    // Show first char + masking + last char if long enough
    return location.charAt(0) + char.repeat(Math.min(3, location.length - 1)) + (location.length > 4 ? location.slice(-1) : "")
  }, [sensorSettings])

  // Initialize default visible columns from settings
  React.useEffect(() => {
    if (defaultVisibleColumns && defaultVisibleColumns.length > 0) {
      const allColumns = ["name", "found", "position", "company", "location", "bio", "scrapedAt", "actions"]
      const initialVisibility = allColumns.reduce((acc, col) => {
        acc[col] = defaultVisibleColumns.includes(col)
        return acc
      }, {})
      setColumnVisibility(initialVisibility)
    }
  }, [defaultVisibleColumns])

  // Update sensor mode is now controlled by parent component via props

  // Initialize pagination from settings
  React.useEffect(() => {
    if (paginationSettings?.defaultPageSize) {
      setPagination(prev => ({
        ...prev,
        pageSize: paginationSettings.defaultPageSize
      }))
    }
  }, [paginationSettings])

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

  // Generate columns with enhanced sensor mode support
  const tableColumns = React.useMemo(() => 
    createColumns(isSensorMode, sensorName, sensorCompany, sensorBio, sensorLocation), 
    [isSensorMode, sensorName, sensorCompany, sensorBio, sensorLocation]
  )

  const table = useReactTable({
    data: normalizedData,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
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
    
    // Generate filename with format: linkedin_alumni_export_dd_mm_yy-hh_mm_s_uniqtime
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = String(now.getFullYear()).slice(-2)
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    const second = String(now.getSeconds()).padStart(2, '0')
    const uniqtime = now.getTime()
    
    const filename = `linkedin_alumni_export_${day}_${month}_${year}-${hour}_${minute}_${second}_${uniqtime}.csv`
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  if (isLoading && normalizedData.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="ml-3 text-sm text-muted-foreground">Loading data...</span>
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
      {/* Search and Controls */}
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
        <div className="flex items-center space-x-2">
          {/* Column Visibility Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Columns
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllColumns()
                .filter(column => column.getCanHide())
                .map(column => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={handleExport}
            size="sm"
            variant="outline"
            disabled={normalizedData.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
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
                  colSpan={tableColumns.length}
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
            {(paginationSettings?.pageSizeOptions || [5, 10, 20, 30, 40, 50]).map((pageSize) => (
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
          <div className="w-4 h-4 border border-blue-500/30 border-t-blue-500 rounded-full animate-spin mr-2"></div>
          Scraping in progress...
        </div>
      )}
    </div>
  )
}
