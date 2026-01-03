import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const troca = await prisma.troca.findUnique({
            where: { id },
            include: {
                nfDevolucao: true,
                destinoItem: true,
                reposicao: true,
                desconto: true,
            },
        })

        if (!troca) {
            return NextResponse.json({ error: 'Troca não encontrada' }, { status: 404 })
        }

        // Validações
        if (!troca.nfDevolucao?.nfEmitida) {
            return NextResponse.json(
                { error: 'A NF de devolução ainda não foi emitida' },
                { status: 400 }
            )
        }

        if (!troca.destinoItem?.coletaRealizada && !troca.destinoItem?.descarte) {
            return NextResponse.json(
                { error: 'O destino do item ainda não foi definido' },
                { status: 400 }
            )
        }

        if (!troca.tipoCompensacao) {
            return NextResponse.json(
                { error: 'O tipo de compensação ainda não foi definido' },
                { status: 400 }
            )
        }

        // Verificar se compensação está completa
        if (troca.tipoCompensacao === 'REPOSICAO_PRODUTO') {
            if (!troca.reposicao?.reposicaoCompleta) {
                return NextResponse.json(
                    { error: 'A reposição ainda não foi marcada como completa' },
                    { status: 400 }
                )
            }
        } else if (troca.tipoCompensacao === 'DESCONTO') {
            if (!troca.desconto?.descontoAplicado) {
                return NextResponse.json(
                    { error: 'O desconto ainda não foi aplicado' },
                    { status: 400 }
                )
            }
        }

        // Atualizar troca para resolvida
        const trocaFinalizada = await prisma.troca.update({
            where: { id },
            data: {
                statusAtual: 'TROCA_RESOLVIDA',
                dataFinalizacao: new Date(),
                valorRecuperado: new Decimal(troca.valorTotal),
                valorPendente: new Decimal(0),
                alertaAtrasada: false,
                historico: {
                    create: {
                        campo: 'statusAtual',
                        valorAntigo: troca.statusAtual,
                        valorNovo: 'TROCA_RESOLVIDA',
                    },
                },
            },
            include: {
                fornecedor: true,
                itens: true,
                orcamento: true,
                rascunhoNF: true,
                nfDevolucao: true,
                destinoItem: true,
                reposicao: true,
                desconto: true,
                historico: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        return NextResponse.json(trocaFinalizada)
    } catch (error) {
        console.error('Error finalizando troca:', error)
        return NextResponse.json(
            { error: 'Erro ao finalizar troca' },
            { status: 500 }
        )
    }
}
