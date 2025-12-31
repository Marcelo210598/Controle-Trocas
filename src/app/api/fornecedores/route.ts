import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const fornecedores = await prisma.fornecedor.findMany({
            orderBy: { nome: 'asc' },
        })
        return NextResponse.json(fornecedores)
    } catch (error) {
        console.error('Error fetching fornecedores:', error)
        return NextResponse.json({ error: 'Erro ao buscar fornecedores' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { nome, contato, email, telefone } = body

        if (!nome) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
        }

        const fornecedor = await prisma.fornecedor.create({
            data: { nome, contato, email, telefone },
        })

        return NextResponse.json(fornecedor, { status: 201 })
    } catch (error) {
        console.error('Error creating fornecedor:', error)
        return NextResponse.json({ error: 'Erro ao criar fornecedor' }, { status: 500 })
    }
}
