import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { diasAdicionados, dataPersonalizada, motivo } = body

        const troca = await prisma.troca.findUnique({
            where: { id },
        })

        if (!troca) {
            return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 })
        }

        // Validar que existe um prazo atual
        if (!troca.prazoAlertalAtual) {
            return NextResponse.json(
                { error: 'Troca não possui prazo de alerta definido' },
                { status: 400 }
            )
        }

        const prazoAnterior = troca.prazoAlertalAtual
        let novoPrazo: Date

        // Calcular novo prazo
        if (dataPersonalizada) {
            novoPrazo = new Date(dataPersonalizada)

            // Validar que a data personalizada é futura
            if (novoPrazo <= new Date()) {
                return NextResponse.json(
                    { error: 'A data personalizada deve ser futura' },
                    { status: 400 }
                )
            }
        } else if (diasAdicionados) {
            novoPrazo = new Date(prazoAnterior)
            novoPrazo.setDate(novoPrazo.getDate() + diasAdicionados)
        } else {
            return NextResponse.json(
                { error: 'É necessário fornecer diasAdicionados ou dataPersonalizada' },
                { status: 400 }
            )
        }

        // Calcular dias adicionados para registro
        const diffTime = novoPrazo.getTime() - prazoAnterior.getTime()
        const diasCalculados = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // Atualizar troca
        const trocaAtualizada = await prisma.troca.update({
            where: { id },
            data: {
                prazoAlertalAtual: novoPrazo,
                alertaAtrasada: false, // Resetar flag de atraso
                prorrogacoes: {
                    create: {
                        prazoAnterior,
                        prazoNovo: novoPrazo,
                        diasAdicionados: diasCalculados,
                        motivoPersonalizado: motivo || null,
                    },
                },
                historico: {
                    create: {
                        campo: 'prazoAlertalAtual',
                        valorAntigo: prazoAnterior.toISOString(),
                        valorNovo: novoPrazo.toISOString(),
                    },
                },
            },
            include: {
                fornecedor: true,
                prorrogacoes: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        })

        return NextResponse.json(trocaAtualizada)
    } catch (error) {
        console.error('Error prorrogando prazo:', error)
        return NextResponse.json(
            { error: 'Erro ao prorrogar prazo' },
            { status: 500 }
        )
    }
}
