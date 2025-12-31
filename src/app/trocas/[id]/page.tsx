'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { StatusTroca, TipoCompensacao } from '@prisma/client'
import { STATUS_CONFIG, TIPO_COMPENSACAO_CONFIG, formatCurrency, formatDate, formatDateTime } from '@/lib/types'
import { StatusBadge } from '@/components/trocas/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
    ArrowLeft,
    FileText,
    Truck,
    Package,
    Receipt,
    History,
    CheckCircle,
    Clock,
    AlertTriangle,
    DollarSign,
} from 'lucide-react'

interface TrocaDetail {
    id: string
    fornecedor: { id: string; nome: string }
    statusAtual: StatusTroca
    tipoCompensacao: TipoCompensacao | null
    createdAt: string
    updatedAt: string
    itens: Array<{
        id: string
        codigoItem: string
        descricao: string
        quantidade: number
        valorUnitario: string
        valorTotal: string
    }>
    orcamento: {
        valorTotal: string
        enviadoFornecedor: boolean
        aprovado: boolean
        dataEnvio: string | null
    } | null
    rascunhoNF: {
        rascunhoGerado: boolean
        numeroRascunho: string | null
        aprovadoFornecedor: boolean
        dataCriacao: string | null
    } | null
    nfDevolucao: {
        nfEmitida: boolean
        numeroNF: string | null
        dataEmissao: string | null
        valorNF: string | null
        produtoEnviado: boolean
        dataEnvio: string | null
    } | null
    destinoItem: {
        fornecedorRetirara: boolean
        coletaRealizada: boolean
        dataColeta: string | null
        descarte: boolean
        dataDescarte: string | null
    } | null
    reposicao: {
        nfEntrada: string | null
        dataChegada: string | null
        valorAcordado: string | null
        valorRecebido: string | null
        reposicaoCompleta: boolean
    } | null
    desconto: {
        valorDesconto: string | null
        boletoGerado: boolean
        dataBoleto: string | null
        descontoAplicado: boolean
    } | null
    historico: Array<{
        id: string
        campo: string
        valorAntigo: string | null
        valorNovo: string | null
        createdAt: string
    }>
}

export default function TrocaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [troca, setTroca] = useState<TrocaDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    // Form states
    const [numeroRascunho, setNumeroRascunho] = useState('')
    const [numeroNF, setNumeroNF] = useState('')
    const [valorNF, setValorNF] = useState('')

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        fetchTroca()
    }, [resolvedParams.id])

    const fetchTroca = async () => {
        try {
            const res = await fetch(`/api/trocas/${resolvedParams.id}`)
            if (!res.ok) throw new Error('Not found')
            const data = await res.json()
            setTroca(data)
        } catch (error) {
            console.error('Error fetching troca:', error)
            toast.error('Troca não encontrada')
            router.push('/trocas')
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (url: string, method: string, body?: object) => {
        setActionLoading(true)
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
            })
            if (!res.ok) throw new Error('Action failed')
            await fetchTroca()
            toast.success('Ação realizada com sucesso!')
        } catch (error) {
            console.error('Error:', error)
            toast.error('Erro ao executar ação')
        } finally {
            setActionLoading(false)
        }
    }

    // Quick Actions
    const aprovarOrcamento = () =>
        handleAction(`/api/trocas/${resolvedParams.id}/orcamento`, 'PATCH', {
            aprovado: true,
            dataEnvio: new Date().toISOString(),
        })

    const criarRascunhoNF = () => {
        if (!numeroRascunho) {
            toast.error('Informe o número do rascunho')
            return
        }
        handleAction(`/api/trocas/${resolvedParams.id}/rascunho-nf`, 'POST', { numeroRascunho })
    }

    const aprovarRascunhoNF = () =>
        handleAction(`/api/trocas/${resolvedParams.id}/rascunho-nf`, 'PATCH', { aprovadoFornecedor: true })

    const emitirNF = () => {
        if (!numeroNF) {
            toast.error('Informe o número da NF')
            return
        }
        handleAction(`/api/trocas/${resolvedParams.id}/nf-devolucao`, 'POST', {
            numeroNF,
            valorNF: parseFloat(valorNF) || 0,
        })
    }

    const marcarEnvio = () =>
        handleAction(`/api/trocas/${resolvedParams.id}/nf-devolucao`, 'PATCH', { produtoEnviado: true })

    const definirDestinoRetirada = () =>
        handleAction(`/api/trocas/${resolvedParams.id}/destino`, 'POST', { fornecedorRetirara: true })

    const definirDestinoDescarte = () =>
        handleAction(`/api/trocas/${resolvedParams.id}/destino`, 'POST', { descarte: true })

    const marcarColeta = () =>
        handleAction(`/api/trocas/${resolvedParams.id}/destino`, 'PATCH', { coletaRealizada: true })

    const marcarDescarte = () =>
        handleAction(`/api/trocas/${resolvedParams.id}/destino`, 'PATCH', { descarte: true })

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-48" />
                <Skeleton className="h-96" />
            </div>
        )
    }

    if (!troca) return null

    const valorPendente =
        troca.reposicao?.valorAcordado && troca.reposicao?.valorRecebido
            ? parseFloat(troca.reposicao.valorAcordado) - parseFloat(troca.reposicao.valorRecebido)
            : 0

    // Tab Content Components
    const OrcamentoTab = () => (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-xs text-gray-500">Valor Total</Label>
                    <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(troca.orcamento?.valorTotal)}
                    </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-xs text-gray-500">Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                        {troca.orcamento?.aprovado ? (
                            <Badge className="bg-green-100 text-green-700">Aprovado</Badge>
                        ) : troca.orcamento?.enviadoFornecedor ? (
                            <Badge className="bg-yellow-100 text-yellow-700">Aguardando Aprovação</Badge>
                        ) : (
                            <Badge className="bg-gray-100 text-gray-700">Pendente</Badge>
                        )}
                    </div>
                </div>
            </div>

            {!troca.orcamento?.aprovado && (
                <Button
                    onClick={aprovarOrcamento}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar Orçamento
                </Button>
            )}
        </div>
    )

    const RascunhoNFTab = () => (
        <div className="space-y-4">
            {troca.rascunhoNF?.rascunhoGerado ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Label className="text-xs text-gray-500">Número do Rascunho</Label>
                            <p className="font-semibold">{troca.rascunhoNF.numeroRascunho || '-'}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Label className="text-xs text-gray-500">Status</Label>
                            <div className="mt-1">
                                {troca.rascunhoNF.aprovadoFornecedor ? (
                                    <Badge className="bg-green-100 text-green-700">Aprovado pelo Fornecedor</Badge>
                                ) : (
                                    <Badge className="bg-yellow-100 text-yellow-700">Aguardando Aprovação</Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {!troca.rascunhoNF.aprovadoFornecedor && (
                        <Button
                            onClick={aprovarRascunhoNF}
                            disabled={actionLoading}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como Aprovado
                        </Button>
                    )}
                </>
            ) : (
                <div className="space-y-4">
                    <div>
                        <Label>Número do Rascunho</Label>
                        <Input
                            value={numeroRascunho}
                            onChange={(e) => setNumeroRascunho(e.target.value)}
                            placeholder="Ex: RSC-2024-001"
                        />
                    </div>
                    <Button
                        onClick={criarRascunhoNF}
                        disabled={actionLoading || !troca.orcamento?.aprovado}
                        className="w-full"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Criar Rascunho de NF
                    </Button>
                    {!troca.orcamento?.aprovado && (
                        <p className="text-sm text-amber-600 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Aprove o orçamento primeiro
                        </p>
                    )}
                </div>
            )}
        </div>
    )

    const NFDevolucaoTab = () => (
        <div className="space-y-4">
            {troca.nfDevolucao?.nfEmitida ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Label className="text-xs text-gray-500">Número da NF</Label>
                            <p className="font-semibold">{troca.nfDevolucao.numeroNF || '-'}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Label className="text-xs text-gray-500">Valor</Label>
                            <p className="font-semibold">{formatCurrency(troca.nfDevolucao.valorNF)}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Label className="text-xs text-gray-500">Data Emissão</Label>
                            <p className="font-semibold">{formatDate(troca.nfDevolucao.dataEmissao)}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Label className="text-xs text-gray-500">Produto Enviado</Label>
                            <div className="mt-1">
                                {troca.nfDevolucao.produtoEnviado ? (
                                    <Badge className="bg-green-100 text-green-700">Sim</Badge>
                                ) : (
                                    <Badge className="bg-yellow-100 text-yellow-700">Não</Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {!troca.nfDevolucao.produtoEnviado && (
                        <Button
                            onClick={marcarEnvio}
                            disabled={actionLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            <Truck className="h-4 w-4 mr-2" />
                            Marcar Produto como Enviado
                        </Button>
                    )}
                </>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label>Número da NF</Label>
                            <Input
                                value={numeroNF}
                                onChange={(e) => setNumeroNF(e.target.value)}
                                placeholder="Ex: 12345"
                            />
                        </div>
                        <div>
                            <Label>Valor da NF</Label>
                            <Input
                                type="number"
                                value={valorNF}
                                onChange={(e) => setValorNF(e.target.value)}
                                placeholder="0,00"
                            />
                        </div>
                    </div>
                    <Button
                        onClick={emitirNF}
                        disabled={actionLoading || !troca.rascunhoNF?.aprovadoFornecedor}
                        className="w-full"
                    >
                        <Receipt className="h-4 w-4 mr-2" />
                        Emitir NF de Devolução
                    </Button>
                    {!troca.rascunhoNF?.aprovadoFornecedor && (
                        <p className="text-sm text-amber-600 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Aprove o rascunho de NF primeiro
                        </p>
                    )}
                </div>
            )}
        </div>
    )

    const DestinoItemTab = () => (
        <div className="space-y-4">
            {troca.destinoItem ? (
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <Label className="text-xs text-gray-500">Destino</Label>
                        <p className="font-semibold">
                            {troca.destinoItem.fornecedorRetirara
                                ? 'Fornecedor irá retirar'
                                : troca.destinoItem.descarte
                                    ? 'Item será descartado'
                                    : '-'}
                        </p>
                    </div>

                    {troca.destinoItem.fornecedorRetirara && !troca.destinoItem.coletaRealizada && (
                        <Button
                            onClick={marcarColeta}
                            disabled={actionLoading}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            <Truck className="h-4 w-4 mr-2" />
                            Marcar Coleta Realizada
                        </Button>
                    )}

                    {troca.destinoItem.coletaRealizada && (
                        <div className="p-4 bg-green-50 rounded-lg text-green-700">
                            <p className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Coleta realizada em {formatDate(troca.destinoItem.dataColeta)}
                            </p>
                        </div>
                    )}

                    {troca.destinoItem.descarte && troca.destinoItem.dataDescarte && (
                        <div className="p-4 bg-gray-100 rounded-lg">
                            <p className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Descartado em {formatDate(troca.destinoItem.dataDescarte)}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-gray-500">Defina o destino do item com defeito:</p>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Button
                            onClick={definirDestinoRetirada}
                            disabled={actionLoading}
                            variant="outline"
                            className="h-24"
                        >
                            <div className="text-center">
                                <Truck className="h-8 w-8 mx-auto mb-2" />
                                <p>Fornecedor irá retirar</p>
                            </div>
                        </Button>
                        <Button
                            onClick={definirDestinoDescarte}
                            disabled={actionLoading}
                            variant="outline"
                            className="h-24"
                        >
                            <div className="text-center">
                                <Package className="h-8 w-8 mx-auto mb-2" />
                                <p>Descartar item</p>
                            </div>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )

    const CompensacaoTab = () => (
        <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
                <Label className="text-xs text-gray-500">Tipo de Compensação</Label>
                <p className="font-semibold">
                    {troca.tipoCompensacao
                        ? TIPO_COMPENSACAO_CONFIG[troca.tipoCompensacao].label
                        : 'Não definido'}
                </p>
            </div>

            {troca.tipoCompensacao === 'REPOSICAO_PRODUTO' && troca.reposicao && (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Label className="text-xs text-gray-500">Valor Acordado</Label>
                            <p className="font-semibold">{formatCurrency(troca.reposicao.valorAcordado)}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Label className="text-xs text-gray-500">Valor Recebido</Label>
                            <p className="font-semibold">{formatCurrency(troca.reposicao.valorRecebido)}</p>
                        </div>
                    </div>
                    {valorPendente > 0 && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <Label className="text-xs text-amber-600">Valor Pendente</Label>
                            <p className="text-xl font-bold text-amber-600">{formatCurrency(valorPendente)}</p>
                        </div>
                    )}
                </div>
            )}

            {troca.tipoCompensacao === 'DESCONTO' && troca.desconto && (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Label className="text-xs text-gray-500">Valor do Desconto</Label>
                            <p className="font-semibold">{formatCurrency(troca.desconto.valorDesconto)}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <Label className="text-xs text-gray-500">Desconto Aplicado</Label>
                            <div className="mt-1">
                                {troca.desconto.descontoAplicado ? (
                                    <Badge className="bg-green-100 text-green-700">Sim</Badge>
                                ) : (
                                    <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    const HistoricoTab = () => (
        <div className="space-y-4">
            {troca.historico.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum histórico registrado</p>
            ) : (
                <div className="space-y-3">
                    {troca.historico.map((h) => (
                        <div key={h.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                            <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm">
                                    <span className="font-medium">{h.campo}</span> alterado de{' '}
                                    <span className="text-gray-500">{h.valorAntigo || '-'}</span> para{' '}
                                    <span className="text-blue-600">{h.valorNovo}</span>
                                </p>
                                <p className="text-xs text-gray-400">{formatDateTime(h.createdAt)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    // Render content based on device
    const tabItems = [
        { value: 'orcamento', label: 'Orçamento', icon: DollarSign, content: <OrcamentoTab /> },
        { value: 'rascunho', label: 'Rascunho NF', icon: FileText, content: <RascunhoNFTab /> },
        { value: 'nf', label: 'NF Devolução', icon: Receipt, content: <NFDevolucaoTab /> },
        { value: 'destino', label: 'Destino Item', icon: Truck, content: <DestinoItemTab /> },
        { value: 'compensacao', label: 'Compensação', icon: Package, content: <CompensacaoTab /> },
        { value: 'historico', label: 'Histórico', icon: History, content: <HistoricoTab /> },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {troca.itens[0]?.codigoItem || 'Troca'}
                        </h1>
                        <StatusBadge status={troca.statusAtual} />
                    </div>
                    <p className="text-gray-500 mt-1">
                        {troca.fornecedor.nome} • Criada em {formatDate(troca.createdAt)}
                    </p>
                </div>
            </div>

            {/* Items Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Itens com Defeito</CardTitle>
                    <CardDescription>{troca.itens.length} item(s)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {troca.itens.map((item) => (
                            <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium">{item.codigoItem}</p>
                                    <p className="text-sm text-gray-500">{item.descricao}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(item.valorTotal)}</p>
                                    <p className="text-xs text-gray-500">{item.quantidade}x {formatCurrency(item.valorUnitario)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Tabs (Desktop) or Accordion (Mobile) */}
            {isMobile ? (
                <Card>
                    <Accordion type="single" collapsible className="w-full">
                        {tabItems.map((tab) => (
                            <AccordionItem key={tab.value} value={tab.value}>
                                <AccordionTrigger className="px-6">
                                    <div className="flex items-center gap-2">
                                        <tab.icon className="h-4 w-4" />
                                        {tab.label}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-4">
                                    {tab.content}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </Card>
            ) : (
                <Card>
                    <Tabs defaultValue="orcamento">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                            {tabItems.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-6 py-3"
                                >
                                    <tab.icon className="h-4 w-4 mr-2" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {tabItems.map((tab) => (
                            <TabsContent key={tab.value} value={tab.value} className="p-6">
                                {tab.content}
                            </TabsContent>
                        ))}
                    </Tabs>
                </Card>
            )}
        </div>
    )
}
