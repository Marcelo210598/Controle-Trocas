'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/types'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface FinancialStats {
    valorRecuperado: number
    valorEmProcesso: number
    totalGeral: number
    quantidadeResolvidas: number
    quantidadeEmProcesso: number
}

export function FinancialChart() {
    const [stats, setStats] = useState<FinancialStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [periodo, setPeriodo] = useState('total')
    const [mes, setMes] = useState('')
    const [ano, setAno] = useState(new Date().getFullYear().toString())

    useEffect(() => {
        fetchStats()
    }, [periodo, mes, ano])

    const fetchStats = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (periodo !== 'total') {
                params.set('periodo', periodo)
                if (periodo === 'mes' && mes) {
                    params.set('mes', mes)
                }
                if (ano) {
                    params.set('ano', ano)
                }
            }

            const res = await fetch(`/api/dashboard/financial-stats?${params.toString()}`)
            const data = await res.json()
            setStats(data)
        } catch (error) {
            console.error('Error fetching financial stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const percentualRecuperado = stats
        ? stats.totalGeral > 0
            ? (stats.valorRecuperado / stats.totalGeral) * 100
            : 0
        : 0

    const percentualEmProcesso = stats
        ? stats.totalGeral > 0
            ? (stats.valorEmProcesso / stats.totalGeral) * 100
            : 0
        : 0

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Controle Financeiro de Trocas
                    </CardTitle>
                    <div className="flex gap-2">
                        <Select value={periodo} onValueChange={setPeriodo}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="total">Total</SelectItem>
                                <SelectItem value="mes">Mensal</SelectItem>
                                <SelectItem value="ano">Anual</SelectItem>
                            </SelectContent>
                        </Select>

                        {periodo === 'mes' && (
                            <Select value={mes} onValueChange={setMes}>
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Mês" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Janeiro</SelectItem>
                                    <SelectItem value="2">Fevereiro</SelectItem>
                                    <SelectItem value="3">Março</SelectItem>
                                    <SelectItem value="4">Abril</SelectItem>
                                    <SelectItem value="5">Maio</SelectItem>
                                    <SelectItem value="6">Junho</SelectItem>
                                    <SelectItem value="7">Julho</SelectItem>
                                    <SelectItem value="8">Agosto</SelectItem>
                                    <SelectItem value="9">Setembro</SelectItem>
                                    <SelectItem value="10">Outubro</SelectItem>
                                    <SelectItem value="11">Novembro</SelectItem>
                                    <SelectItem value="12">Dezembro</SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        {(periodo === 'mes' || periodo === 'ano') && (
                            <Select value={ano} onValueChange={setAno}>
                                <SelectTrigger className="w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2024">2024</SelectItem>
                                    <SelectItem value="2025">2025</SelectItem>
                                    <SelectItem value="2026">2026</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-24" />
                    </div>
                ) : stats ? (
                    <div className="space-y-6">
                        {/* Resumo em Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-90">Valor Recuperado</p>
                                        <p className="text-2xl font-bold mt-1">
                                            {formatCurrency(stats.valorRecuperado)}
                                        </p>
                                        <p className="text-xs opacity-75 mt-2">
                                            {stats.quantidadeResolvidas} trocas resolvidas
                                        </p>
                                    </div>
                                    <TrendingUp className="h-10 w-10 opacity-80" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-90">Em Processo</p>
                                        <p className="text-2xl font-bold mt-1">
                                            {formatCurrency(stats.valorEmProcesso)}
                                        </p>
                                        <p className="text-xs opacity-75 mt-2">
                                            {stats.quantidadeEmProcesso} trocas em andamento
                                        </p>
                                    </div>
                                    <TrendingDown className="h-10 w-10 opacity-80" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-90">Total Geral</p>
                                        <p className="text-2xl font-bold mt-1">
                                            {formatCurrency(stats.totalGeral)}
                                        </p>
                                        <p className="text-xs opacity-75 mt-2">
                                            {stats.quantidadeResolvidas + stats.quantidadeEmProcesso} trocas
                                        </p>
                                    </div>
                                    <DollarSign className="h-10 w-10 opacity-80" />
                                </div>
                            </div>
                        </div>

                        {/* Barra de Progresso */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Distribuição de Valores</span>
                                <span className="font-medium text-gray-900">
                                    {percentualRecuperado.toFixed(1)}% recuperado
                                </span>
                            </div>
                            <div className="h-8 bg-gray-200 rounded-full overflow-hidden flex">
                                {stats.totalGeral > 0 && (
                                    <>
                                        <div
                                            className="bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-medium"
                                            style={{ width: `${percentualRecuperado}%` }}
                                        >
                                            {percentualRecuperado > 10 && `${percentualRecuperado.toFixed(0)}%`}
                                        </div>
                                        <div
                                            className="bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-medium"
                                            style={{ width: `${percentualEmProcesso}%` }}
                                        >
                                            {percentualEmProcesso > 10 && `${percentualEmProcesso.toFixed(0)}%`}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                                    <span>Recuperado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                                    <span>Em Processo</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-gray-500">Nenhum dado disponível</p>
                )}
            </CardContent>
        </Card>
    )
}
