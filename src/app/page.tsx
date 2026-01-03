'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StatusGrid } from '@/components/dashboard/StatusGrid'
import { FinancialChart } from '@/components/dashboard/FinancialChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface DashboardStats {
  total: number
  byStatus: Record<string, number>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [trocasAtrasadas, setTrocasAtrasadas] = useState(0)

  useEffect(() => {
    fetchStats()
    fetchTrocasAtrasadas()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrocasAtrasadas = async () => {
    try {
      const res = await fetch('/api/trocas?filtroEspecial=atrasadas')
      const data = await res.json()
      setTrocasAtrasadas(data.length)
    } catch (error) {
      console.error('Error fetching trocas atrasadas:', error)
    }
  }

  const pendentes = stats ? (
    (stats.byStatus['ORCAMENTO'] || 0) +
    (stats.byStatus['ORCAMENTO_APROVADO'] || 0) +
    (stats.byStatus['RASCUNHO_NF_VALIDACAO'] || 0) +
    (stats.byStatus['NF_EMITIDA_AGUARDANDO_DESTINO'] || 0) +
    (stats.byStatus['AGUARDANDO_RETIRADA'] || 0) +
    (stats.byStatus['REPOSICAO_PARCIAL'] || 0) +
    (stats.byStatus['AGUARDANDO_DESCONTO'] || 0)
  ) : 0

  const resolvidas = stats?.byStatus['TROCA_RESOLVIDA'] || 0
  const problemas = stats?.byStatus['PROBLEMA_DIVERGENCIA'] || 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral das trocas com fornecedores</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Total de Trocas</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 bg-white/20" />
                ) : (
                  <p className="text-3xl font-bold">{stats?.total || 0}</p>
                )}
              </div>
              <Package className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Pendentes</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 bg-white/20" />
                ) : (
                  <p className="text-3xl font-bold">{pendentes}</p>
                )}
              </div>
              <TrendingUp className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-green-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Resolvidas</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 bg-white/20" />
                ) : (
                  <p className="text-3xl font-bold">{resolvidas}</p>
                )}
              </div>
              <CheckCircle className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-rose-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Problemas</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 bg-white/20" />
                ) : (
                  <p className="text-3xl font-bold">{problemas}</p>
                )}
              </div>
              <AlertTriangle className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Link href="/trocas?filtroEspecial=atrasadas" className="cursor-pointer">
          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:scale-105 transition-transform">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Atrasadas</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16 bg-white/20" />
                  ) : (
                    <p className="text-3xl font-bold">{trocasAtrasadas}</p>
                  )}
                </div>
                <Clock className="h-10 w-10 opacity-80 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Financial Chart */}
      <FinancialChart />

      {/* Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Trocas por Status</CardTitle>
          <p className="text-sm text-gray-500">Clique em um status para filtrar a lista</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <StatusGrid stats={stats?.byStatus || {}} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
