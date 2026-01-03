'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { StatusTroca } from '@prisma/client'
import { STATUS_CONFIG, formatCurrency, formatDate } from '@/lib/types'
import { StatusBadge } from '@/components/trocas/StatusBadge'
import { AlertBadge } from '@/components/trocas/AlertBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Filter, X, Eye } from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'

interface Troca {
    id: string
    fornecedor: { id: string; nome: string }
    statusAtual: StatusTroca
    tipoCompensacao: string | null
    createdAt: string
    updatedAt: string
    prazoAlertalAtual: string | null
    alertaAtrasada: boolean
    itens: Array<{ codigoItem: string; descricao: string; valorTotal: string }>
    orcamento: { valorTotal: string } | null
}

interface Fornecedor {
    id: string
    nome: string
}

function TrocasContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [trocas, setTrocas] = useState<Troca[]>([])
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
    const [loading, setLoading] = useState(true)
    const [filtersOpen, setFiltersOpen] = useState(false)

    // Filter states
    const [status, setStatus] = useState<string>(searchParams.get('status') || '')
    const [fornecedorId, setFornecedorId] = useState<string>(
        searchParams.get('fornecedorId') || ''
    )
    const [dataInicio, setDataInicio] = useState<string>(
        searchParams.get('dataInicio') || ''
    )
    const [dataFim, setDataFim] = useState<string>(searchParams.get('dataFim') || '')
    const [filtroEspecial, setFiltroEspecial] = useState<string>(
        searchParams.get('filtroEspecial') || ''
    )

    useEffect(() => {
        fetchFornecedores()
    }, [])

    useEffect(() => {
        fetchTrocas()
    }, [status, fornecedorId, dataInicio, dataFim, filtroEspecial])

    const fetchFornecedores = async () => {
        try {
            const res = await fetch('/api/fornecedores')
            const data = await res.json()
            setFornecedores(data)
        } catch (error) {
            console.error('Error fetching fornecedores:', error)
        }
    }

    const fetchTrocas = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (status) params.set('status', status)
            if (fornecedorId) params.set('fornecedorId', fornecedorId)
            if (dataInicio) params.set('dataInicio', dataInicio)
            if (dataFim) params.set('dataFim', dataFim)
            if (filtroEspecial) params.set('filtroEspecial', filtroEspecial)

            const res = await fetch(`/api/trocas?${params.toString()}`)
            const data = await res.json()
            setTrocas(data)
        } catch (error) {
            console.error('Error fetching trocas:', error)
        } finally {
            setLoading(false)
        }
    }

    const clearFilters = () => {
        setStatus('')
        setFornecedorId('')
        setDataInicio('')
        setDataFim('')
        setFiltroEspecial('')
        router.push('/trocas')
    }

    const hasFilters = status || fornecedorId || dataInicio || dataFim || filtroEspecial

    const FilterForm = () => (
        <div className="space-y-4">
            {/* Filtros Especiais */}
            <div>
                <Label>Filtros Rápidos</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button
                        variant={filtroEspecial === 'atrasadas' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFiltroEspecial(filtroEspecial === 'atrasadas' ? '' : 'atrasadas')}
                        className="text-xs"
                    >
                        Atrasadas
                    </Button>
                    <Button
                        variant={filtroEspecial === 'em_andamento' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFiltroEspecial(filtroEspecial === 'em_andamento' ? '' : 'em_andamento')}
                        className="text-xs"
                    >
                        Em Andamento
                    </Button>
                    <Button
                        variant={filtroEspecial === 'resolvidas' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFiltroEspecial(filtroEspecial === 'resolvidas' ? '' : 'resolvidas')}
                        className="text-xs"
                    >
                        Resolvidas
                    </Button>
                </div>
            </div>

            <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                                {config.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label>Fornecedor</Label>
                <Select value={fornecedorId} onValueChange={setFornecedorId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Todos os fornecedores" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os fornecedores</SelectItem>
                        {fornecedores.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                                {f.nome}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label>Data Início</Label>
                <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                />
            </div>

            <div>
                <Label>Data Fim</Label>
                <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                />
            </div>

            {hasFilters && (
                <Button variant="outline" onClick={clearFilters} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                </Button>
            )}
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Trocas</h1>
                    <p className="text-gray-500 mt-1">
                        {loading ? 'Carregando...' : `${trocas.length} troca(s) encontrada(s)`}
                    </p>
                </div>

                <div className="flex gap-2">
                    {/* Mobile Filter Button */}
                    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="md:hidden">
                                <Filter className="h-4 w-4 mr-2" />
                                Filtros
                                {hasFilters && (
                                    <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                                        {[status, fornecedorId, dataInicio, dataFim].filter(Boolean).length}
                                    </span>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Filtros</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6">
                                <FilterForm />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Link href="/trocas/nova">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Troca
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex gap-6">
                {/* Desktop Filters */}
                <Card className="hidden md:block w-64 shrink-0 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filtros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FilterForm />
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="flex-1">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-6 space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16" />
                                ))}
                            </div>
                        ) : trocas.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <p className="text-lg">Nenhuma troca encontrada</p>
                                <p className="text-sm mt-2">
                                    {hasFilters
                                        ? 'Tente ajustar os filtros'
                                        : 'Clique em "Nova Troca" para começar'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Código Item</TableHead>
                                            <TableHead>Fornecedor</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="hidden md:table-cell">Valor</TableHead>
                                            <TableHead className="hidden sm:table-cell">Atualização</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {trocas.map((troca) => (
                                            <TableRow key={troca.id} className="cursor-pointer hover:bg-gray-50">
                                                <TableCell className="font-medium">
                                                    {troca.itens[0]?.codigoItem || '-'}
                                                    {troca.itens.length > 1 && (
                                                        <span className="text-gray-400 text-sm ml-1">
                                                            +{troca.itens.length - 1}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>{troca.fornecedor.nome}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge status={troca.statusAtual} />
                                                        <AlertBadge
                                                            prazoAlertalAtual={troca.prazoAlertalAtual}
                                                            statusAtual={troca.statusAtual}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {formatCurrency(troca.orcamento?.valorTotal)}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell text-gray-500">
                                                    {formatDate(troca.updatedAt)}
                                                </TableCell>
                                                <TableCell>
                                                    <Link href={`/trocas/${troca.id}`}>
                                                        <Button variant="ghost" size="icon">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function TrocasPage() {
    return (
        <Suspense fallback={<div className="p-6"><Skeleton className="h-96" /></div>}>
            <TrocasContent />
        </Suspense>
    )
}
