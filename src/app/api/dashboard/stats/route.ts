import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const stats = await prisma.troca.groupBy({
            by: ['statusAtual'],
            _count: true,
        })

        const total = await prisma.troca.count()

        const formattedStats = stats.reduce((acc: Record<string, number>, stat) => {
            acc[stat.statusAtual] = stat._count
            return acc
        }, {} as Record<string, number>)

        return NextResponse.json({
            total,
            byStatus: formattedStats,
        })
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
    }
}
