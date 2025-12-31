# 🚀 Guia de Deploy no Vercel

## Pré-requisitos

1. **Banco de Dados Neon PostgreSQL**
   - Crie uma conta em [neon.tech](https://neon.tech)
   - Crie um novo projeto
   - Copie a **Connection String** (formato: `postgresql://...`)

2. **Conta Vercel**
   - Crie uma conta em [vercel.com](https://vercel.com)
   - Conecte sua conta GitHub

## Passo a Passo

### 1. Importar Projeto no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Selecione o repositório `Controle-Trocas`
3. Configure o projeto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (deixe como está)
   - **Build Command**: `npm run build` (padrão)
   - **Output Directory**: `.next` (padrão)

### 2. Configurar Variáveis de Ambiente

**IMPORTANTE**: Antes de fazer o deploy, adicione as variáveis de ambiente:

1. Na tela de configuração do projeto, clique em **Environment Variables**
2. Adicione a seguinte variável:

```
Nome: DATABASE_URL
Valor: sua_connection_string_do_neon
```

**Exemplo de valor**:
```
postgresql://user:password@ep-example-123.us-east-2.aws.neon.tech/neondb?sslmode=require
```

3. Marque as opções:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### 3. Deploy

1. Clique em **Deploy**
2. Aguarde o build completar (~2-3 minutos)
3. Quando aparecer "🎉 Congratulations!", seu app está no ar!

---

## 🔧 Build Script Personalizado (Se Necessário)

Se o deploy falhar com erro de Prisma, adicione este script no `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "vercel-build": "prisma generate && prisma db push && next build"
  }
}
```

Isso garante que o Prisma Client seja gerado antes do build.

---

## 🐛 Solução de Problemas

### Erro 404: NOT_FOUND

**Causa**: Falta variável de ambiente `DATABASE_URL`

**Solução**:
1. Vá para o painel do Vercel
2. Acesse **Settings** > **Environment Variables**  
3. Adicione `DATABASE_URL` com sua connection string
4. Clique em **Redeploy** (Settings > Deployments > ⋯ > Redeploy)

### Erro "PrismaClient is unable to run in this browser environment"

**Causa**: Prisma Client não foi gerado no build

**Solução**:
1. Adicione `"postinstall": "prisma generate"` nos scripts do `package.json`
2. Faça commit e push
3. Vercel vai rebuildar automaticamente

### Erro de Build

**Verifique os logs**:
1. Vá para **Deployments**
2. Clique no deployment com erro
3. Veja a aba **Build Logs**
4. Procure por erros específicos

---

## 📝 Checklist de Deploy

- [ ] Banco de dados Neon criado
- [ ] Connection string copiada
- [ ] Projeto importado no Vercel
- [ ] `DATABASE_URL` configurada nas variáveis de ambiente
- [ ] Deploy realizado com sucesso
- [ ] Página inicial carrega sem erros
- [ ] Teste: criar um novo fornecedor
- [ ] Teste: criar uma nova troca

---

## 🔄 Redesploy Após Correções

**Se você já fez deploy e precisa corrigir**:

### Opção 1: Via Dashboard
1. Vá para o projeto no Vercel
2. **Settings** > **Environment Variables**
3. Adicione/edite `DATABASE_URL`
4. **Deployments** > Último deploy > **⋯** > **Redeploy**

### Opção 2: Via Git (Recomendado)
1. Adicione a variável de ambiente no Vercel
2. Faça uma pequena mudança no código (ex: espaço no README)
3. Commit e push
4. Vercel vai redesployer automaticamente

---

## 🎯 Próximos Passos Após Deploy

1. **Testar funcionalidades principais**:
   - Criar fornecedor
   - Criar troca (manual e em massa)
   - Ver dashboard

2. **Configurar domínio customizado** (opcional):
   - Settings > Domains
   - Adicione seu domínio

3. **Monitorar performance**:
   - Analytics > Overview
   - Veja tempo de resposta e erros

---

## 💡 Dicas

- **Desenvolvimento Local**: Use `npm run dev` e configure `.env` localmente
- **Preview Deployments**: Cada PR cria uma preview automática
- **Logs em Tempo Real**: Vercel > Functions > View Logs
- **Banco de Dados**: Acesse o Neon dashboard para ver queries

---

**Links Úteis**:
- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Prisma](https://www.prisma.io/docs)
- [Neon PostgreSQL](https://neon.tech/docs)
