'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { TipoCompensacao } from '@prisma/client'
import { TIPO_COMPENSACAO_CONFIG } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowLeft, ArrowRight, Save, Package, Users, FileText, Check, X, AlertCircle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ItemDefeito {
    codigoItem: string
    descricao: string
    quantidade: number
    valorUnitario: number
}

interface Fornecedor {
    id: string
    nome: string
}

export default function NovaTrocaPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
    const [showNovoFornecedor, setShowNovoFornecedor] = useState(false)
    const [novoFornecedorNome, setNovoFornecedorNome] = useState('')

    // Form state
    const [fornecedorId, setFornecedorId] = useState('')
    const [tipoCompensacao, setTipoCompensacao] = useState<TipoCompensacao | ''>('')
    const [itens, setItens] = useState<ItemDefeito[]>([
        { codigoItem: '', descricao: '', quantidade: 1, valorUnitario: 0 },
    ])
    const [enviadoFornecedor, setEnviadoFornecedor] = useState(false)

    // Bulk entry state
    const [insertionMode, setInsertionMode] = useState<'manual' | 'bulk'>('manual')
    const [bulkText, setBulkText] = useState('')
    const [parsedItems, setParsedItems] = useState<ItemDefeito[]>([])
    const [parseErrors, setParseErrors] = useState<string[]>([])

    useEffect(() => {
        fetchFornecedores()
    }, [])

    const fetchFornecedores = async () => {
        try {
            const res = await fetch('/api/fornecedores')
            const data = await res.json()
            setFornecedores(data)
        } catch (error) {
            console.error('Error fetching fornecedores:', error)
        }
    }

    const handleAddItem = () => {
        setItens([...itens, { codigoItem: '', descricao: '', quantidade: 1, valorUnitario: 0 }])
    }

    const handleRemoveItem = (index: number) => {
        if (itens.length > 1) {
            setItens(itens.filter((_, i) => i !== index))
        }
    }

    const handleItemChange = (index: number, field: keyof ItemDefeito, value: string | number) => {
        const newItens = [...itens]
        newItens[index] = { ...newItens[index], [field]: value }
        setItens(newItens)
    }

    // Filter out completely empty items (items that haven't been touched yet)
    const filledItems = useMemo(
        () => itens.filter((item) => item.codigoItem || item.descricao || item.valorUnitario > 0),
        [itens]
    )
    const valorTotal = useMemo(
        () => filledItems.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0),
        [filledItems]
    )

    // Parse bulk text into items
    const parseBulkText = (text: string): { items: ItemDefeito[]; errors: string[] } => {
        const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0)
        const items: ItemDefeito[] = []
        const errors: string[] = []

        // Regex patterns for different formats
        // Format 1: "Código 45 | Lâmpada LED | Quantidade 10" or "45 | Lâmpada LED | 10"
        const pattern1 = /(?:código\s*)?(\w+)\s*\|\s*([^|]+?)\s*\|\s*(?:quantidade\s*)?(\d+)/i
        // Format 2: "45 - Lâmpada LED - 10"
        const pattern2 = /(\w+)\s*-\s*([^-]+?)\s*-\s*(\d+)/
        // Format 3: "Código: 45, Nome: Lâmpada LED, Quantidade: 10"
        const pattern3 = /código:\s*(\w+)\s*,\s*(?:nome|descrição|descricao):\s*([^,]+?)\s*,\s*quantidade:\s*(\d+)/i

        lines.forEach((line, index) => {
            let match = line.match(pattern1) || line.match(pattern2) || line.match(pattern3)

            if (match) {
                const [, codigoItem, descricao, quantidade] = match
                items.push({
                    codigoItem: codigoItem.trim(),
                    descricao: descricao.trim(),
                    quantidade: parseInt(quantidade),
                    valorUnitario: 0, // Default to 0 for bulk entries
                })
            } else {
                errors.push(`Linha ${index + 1}: "${line}" - formato não reconhecido`)
            }
        })

        return { items, errors }
    }

    const handleProcessBulk = () => {
        if (!bulkText.trim()) {
            toast.error('Por favor, insira o texto com os itens')
            return
        }

        const { items, errors } = parseBulkText(bulkText)

        setParsedItems(items)
        setParseErrors(errors)

        if (items.length > 0) {
            toast.success(`${items.length} ${items.length === 1 ? 'item processado' : 'itens processados'}${errors.length > 0 ? ` (${errors.length} ${errors.length === 1 ? 'erro' : 'erros'})` : ''}`)
        } else if (errors.length > 0) {
            toast.error('Nenhum item pôde ser processado')
        }
    }

    const handleConfirmBulk = () => {
        if (parsedItems.length === 0) {
            toast.error('Nenhum item para adicionar')
            return
        }

        setItens([...itens, ...parsedItems])
        setParsedItems([])
        setParseErrors([])
        setBulkText('')
        setInsertionMode('manual')
        toast.success(`${parsedItems.length} ${parsedItems.length === 1 ? 'item adicionado' : 'itens adicionados'}`)
    }

    const handleCancelBulk = () => {
        setParsedItems([])
        setParseErrors([])
    }

    const handleRemoveParsedItem = (index: number) => {
        setParsedItems(parsedItems.filter((_, i) => i !== index))
    }

    const handleNovoFornecedor = async () => {
        if (!novoFornecedorNome.trim()) return

        try {
            const res = await fetch('/api/fornecedores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: novoFornecedorNome }),
            })
            const data = await res.json()
            setFornecedores([...fornecedores, data])
            setFornecedorId(data.id)
            setNovoFornecedorNome('')
            setShowNovoFornecedor(false)
            toast.success('Fornecedor adicionado!')
        } catch (error) {
            console.error('Error creating fornecedor:', error)
            toast.error('Erro ao criar fornecedor')
        }
    }

    const handleSubmit = async () => {
        if (!fornecedorId) {
            toast.error('Selecione um fornecedor')
            return
        }

        if (filledItems.length === 0) {
            toast.error('Adicione pelo menos um item')
            return
        }

        if (filledItems.some((item) => !item.codigoItem || !item.descricao)) {
            toast.error('Preencha todos os campos dos itens')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/trocas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fornecedorId,
                    tipoCompensacao: tipoCompensacao || undefined,
                    itens: filledItems,
                    orcamento: {
                        valorTotal,
                        enviadoFornecedor,
                    },
                }),
            })

            if (!res.ok) throw new Error('Failed to create troca')

            const data = await res.json()
            toast.success('Troca criada com sucesso!')
            router.push(`/trocas/${data.id}`)
        } catch (error) {
            console.error('Error creating troca:', error)
            toast.error('Erro ao criar troca')
        } finally {
            setLoading(false)
        }
    }

    const canProceedStep1 = fornecedorId && filledItems.length > 0 && filledItems.every((item) => item.codigoItem && item.descricao)

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Nova Troca</h1>
                <p className="text-gray-500 mt-1">Registre um novo processo de troca com fornecedor</p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4">
                <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${step === 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}
                >
                    <Package className="h-4 w-4" />
                    <span className="font-medium">1. Itens</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-200" />
                <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full ${step === 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}
                >
                    <Users className="h-4 w-4" />
                    <span className="font-medium">2. Orçamento</span>
                </div>
            </div>

            {/* Step 1: Items */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Itens com Defeito</CardTitle>
                        <CardDescription>Adicione os itens que serão devolvidos ao fornecedor</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Fornecedor */}
                        <div className="space-y-2">
                            <Label>Fornecedor *</Label>
                            <div className="flex gap-2">
                                <Select value={fornecedorId} onValueChange={setFornecedorId}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Selecione o fornecedor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fornecedores.map((f) => (
                                            <SelectItem key={f.id} value={f.id}>
                                                {f.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Dialog open={showNovoFornecedor} onOpenChange={setShowNovoFornecedor}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Novo Fornecedor</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label>Nome do Fornecedor</Label>
                                                <Input
                                                    value={novoFornecedorNome}
                                                    onChange={(e) => setNovoFornecedorNome(e.target.value)}
                                                    placeholder="Ex: Distribuidora ABC"
                                                />
                                            </div>
                                            <Button onClick={handleNovoFornecedor} className="w-full">
                                                Adicionar
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Tipo de Compensação */}
                        <div className="space-y-2">
                            <Label>Tipo de Compensação (opcional)</Label>
                            <Select
                                value={tipoCompensacao}
                                onValueChange={(v) => setTipoCompensacao(v as TipoCompensacao)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Definir depois" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="later">Definir depois</SelectItem>
                                    {Object.entries(TIPO_COMPENSACAO_CONFIG).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            {config.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Items List */}
                        <Tabs value={insertionMode} onValueChange={(v) => setInsertionMode(v as 'manual' | 'bulk')}>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Itens *</Label>
                                    <TabsList>
                                        <TabsTrigger value="manual">Adicionar Manualmente</TabsTrigger>
                                        <TabsTrigger value="bulk">Inserção Rápida (Texto)</TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="manual" className="space-y-4 mt-0">
                                    {itens.map((item, index) => (
                                        <Card key={index} className="p-4 bg-gray-50">
                                            <div className="grid gap-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-xs">Código do Item</Label>
                                                        <Input
                                                            value={item.codigoItem}
                                                            onChange={(e) => handleItemChange(index, 'codigoItem', e.target.value)}
                                                            placeholder="Ex: SKU-12345"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Quantidade</Label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantidade}
                                                            onChange={(e) =>
                                                                handleItemChange(index, 'quantidade', parseInt(e.target.value) || 1)
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Descrição</Label>
                                                    <Textarea
                                                        value={item.descricao}
                                                        onChange={(e) => handleItemChange(index, 'descricao', e.target.value)}
                                                        placeholder="Descreva o item e o defeito"
                                                        rows={2}
                                                    />
                                                </div>
                                                <div className="flex items-end gap-4">
                                                    <div className="flex-1">
                                                        <Label className="text-xs">Valor Unitário (R$)</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.valorUnitario}
                                                            onChange={(e) =>
                                                                handleItemChange(index, 'valorUnitario', parseFloat(e.target.value) || 0)
                                                            }
                                                            placeholder="0,00"
                                                        />
                                                    </div>
                                                    <div className="text-right">
                                                        <Label className="text-xs text-gray-500">Subtotal</Label>
                                                        <p className="font-semibold">
                                                            R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    {itens.length > 1 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveItem(index)}
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    <Button variant="outline" onClick={handleAddItem} className="w-full">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Adicionar Item
                                    </Button>
                                </TabsContent>

                                <TabsContent value="bulk" className="space-y-4 mt-0">
                                    {parsedItems.length === 0 ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Cole os itens aqui</Label>
                                                <Textarea
                                                    value={bulkText}
                                                    onChange={(e) => setBulkText(e.target.value)}
                                                    placeholder={`Exemplos de formatos aceitos:\n\nFormato 1: Código 45 | Lâmpada LED | Quantidade 10\nFormato 2: 45 | Lâmpada LED | 10\nFormato 3: 45 - Lâmpada LED - 10\nFormato 4: Código: 45, Nome: Lâmpada LED, Quantidade: 10\n\nCada linha deve conter um item.`}
                                                    rows={10}
                                                    className="font-mono text-sm"
                                                />
                                            </div>
                                            <Button onClick={handleProcessBulk} className="w-full">
                                                <FileText className="h-4 w-4 mr-2" />
                                                Processar Itens
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label>Itens Processados ({parsedItems.length})</Label>
                                                    <p className="text-sm text-gray-500">
                                                        Revise e confirme os itens abaixo
                                                    </p>
                                                </div>
                                                <div className="border rounded-lg overflow-hidden">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Código</TableHead>
                                                                <TableHead>Descrição</TableHead>
                                                                <TableHead className="w-24">Qtd</TableHead>
                                                                <TableHead className="w-20">Ações</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {parsedItems.map((item, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell className="font-mono text-sm">
                                                                        {item.codigoItem}
                                                                    </TableCell>
                                                                    <TableCell>{item.descricao}</TableCell>
                                                                    <TableCell className="text-center">{item.quantidade}</TableCell>
                                                                    <TableCell>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleRemoveParsedItem(index)}
                                                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>

                                            {parseErrors.length > 0 && (
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertDescription>
                                                        <p className="font-semibold mb-1">
                                                            {parseErrors.length} {parseErrors.length === 1 ? 'linha não pôde ser processada' : 'linhas não puderam ser processadas'}:
                                                        </p>
                                                        <ul className="list-disc list-inside text-sm space-y-1">
                                                            {parseErrors.map((error, i) => (
                                                                <li key={i}>{error}</li>
                                                            ))}
                                                        </ul>
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            <div className="flex gap-2">
                                                <Button variant="outline" onClick={handleCancelBulk} className="flex-1">
                                                    <X className="h-4 w-4 mr-2" />
                                                    Cancelar
                                                </Button>
                                                <Button onClick={handleConfirmBulk} className="flex-1">
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Confirmar e Adicionar
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </TabsContent>

                                {/* Current Items Summary (visible in both tabs) */}
                                {filledItems.length > 0 && (
                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">
                                                Total de itens: <strong>{filledItems.length}</strong>
                                            </span>
                                            <span className="font-semibold text-lg">
                                                Valor Total: R$ {valorTotal.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Tabs>

                        {/* Navigation */}
                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                                Próximo
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Orçamento */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Orçamento</CardTitle>
                        <CardDescription>Resumo do orçamento para envio ao fornecedor</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Summary */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Fornecedor:</span>
                                <span className="font-medium">
                                    {fornecedores.find((f) => f.id === fornecedorId)?.nome}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Quantidade de itens:</span>
                                <span className="font-medium">{itens.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total de peças:</span>
                                <span className="font-medium">
                                    {itens.reduce((acc, item) => acc + item.quantidade, 0)}
                                </span>
                            </div>
                            <div className="border-t pt-3 flex justify-between">
                                <span className="font-medium">Valor Total:</span>
                                <span className="text-xl font-bold text-blue-600">
                                    R$ {valorTotal.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Enviado ao fornecedor */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="enviadoFornecedor"
                                checked={enviadoFornecedor}
                                onChange={(e) => setEnviadoFornecedor(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="enviadoFornecedor" className="cursor-pointer">
                                Orçamento já foi enviado ao fornecedor
                            </Label>
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Voltar
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {loading ? 'Salvando...' : 'Salvar Troca'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
