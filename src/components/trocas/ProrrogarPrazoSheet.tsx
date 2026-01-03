'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { Calendar, Clock } from 'lucide-react'
import { formatDate, calcularProximoPrazo } from '@/lib/types'

interface ProrrogarPrazoSheetProps {
    trocaId: string
    prazoAtual: Date | string
    onProrrogado: () => void
}

export function ProrrogarPrazoSheet({
    trocaId,
    prazoAtual,
    onProrrogado,
}: ProrrogarPrazoSheetProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [opcaoSelecionada, setOpcaoSelecionada] = useState<number | null>(null)
    const [dataPersonalizada, setDataPersonalizada] = useState('')
    const [motivo, setMotivo] = useState('')

    const handleProrrogar = async (diasAdicionados?: number) => {
        setLoading(true)
        try {
            const body: Record<string, unknown> = { motivo }

            if (diasAdicionados) {
                body.diasAdicionados = diasAdicionados
            } else if (dataPersonalizada) {
                body.dataPersonalizada = dataPersonalizada
            } else {
                toast.error('Selecione uma opção de prorrogação')
                return
            }

            const res = await fetch(`/api/trocas/${trocaId}/prorrogar-prazo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                toast.success('Prazo prorrogado com sucesso!')
                setOpen(false)
                onProrrogado()
                setOpcaoSelecionada(null)
                setDataPersonalizada('')
                setMotivo('')
            } else {
                const data = await res.json()
                toast.error(data.error || 'Erro ao prorrogar prazo')
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Erro ao prorrogar prazo')
        } finally {
            setLoading(false)
        }
    }

    const prazoAtualDate =
        typeof prazoAtual === 'string' ? new Date(prazoAtual) : prazoAtual

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Clock className="h-4 w-4 mr-2" />
                    Prorrogar Prazo do Alerta
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Prorrogar Prazo do Alerta</SheetTitle>
                    <SheetDescription>
                        Escolha por quanto tempo deseja prorrogar o prazo de alerta
                        desta troca
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Prazo Atual */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Prazo Atual</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {formatDate(prazoAtual)}
                        </p>
                    </div>

                    {/* Opções Rápidas */}
                    <div className="space-y-3">
                        <Label>Opções de Prorrogação</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant={opcaoSelecionada === 7 ? 'default' : 'outline'}
                                className="flex flex-col p-4 h-auto"
                                onClick={() => {
                                    setOpcaoSelecionada(7)
                                    setDataPersonalizada('')
                                }}
                            >
                                <span className="text-lg font-bold">+7</span>
                                <span className="text-xs">dias</span>
                            </Button>
                            <Button
                                variant={opcaoSelecionada === 15 ? 'default' : 'outline'}
                                className="flex flex-col p-4 h-auto"
                                onClick={() => {
                                    setOpcaoSelecionada(15)
                                    setDataPersonalizada('')
                                }}
                            >
                                <span className="text-lg font-bold">+15</span>
                                <span className="text-xs">dias</span>
                            </Button>
                            <Button
                                variant={opcaoSelecionada === 30 ? 'default' : 'outline'}
                                className="flex flex-col p-4 h-auto"
                                onClick={() => {
                                    setOpcaoSelecionada(30)
                                    setDataPersonalizada('')
                                }}
                            >
                                <span className="text-lg font-bold">+30</span>
                                <span className="text-xs">dias</span>
                            </Button>
                        </div>
                    </div>

                    {/* Novo Prazo Calculado */}
                    {opcaoSelecionada && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-700">Novo Prazo</p>
                            <p className="text-lg font-semibold text-blue-900">
                                {formatDate(calcularProximoPrazo(prazoAtual, opcaoSelecionada))}
                            </p>
                        </div>
                    )}

                    {/* Divisor */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">Ou</span>
                        </div>
                    </div>

                    {/* Data Personalizada */}
                    <div className="space-y-2">
                        <Label htmlFor="dataPersonalizada">
                            <Calendar className="h-4 w-4 inline mr-2" />
                            Data Personalizada
                        </Label>
                        <Input
                            id="dataPersonalizada"
                            type="date"
                            value={dataPersonalizada}
                            onChange={(e) => {
                                setDataPersonalizada(e.target.value)
                                setOpcaoSelecionada(null)
                            }}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    {/* Motivo */}
                    <div className="space-y-2">
                        <Label htmlFor="motivo">Motivo da Prorrogação (opcional)</Label>
                        <Input
                            id="motivo"
                            placeholder="Ex: Fornecedor solicitou mais tempo..."
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                        />
                    </div>

                    {/* Botões */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={() =>
                                handleProrrogar(
                                    opcaoSelecionada || undefined
                                )
                            }
                            disabled={
                                loading ||
                                (!opcaoSelecionada && !dataPersonalizada)
                            }
                        >
                            {loading ? 'Prorrogando...' : 'Prorrogar'}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
