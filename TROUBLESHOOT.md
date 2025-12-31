# 🔍 Verificação de Build do Vercel - Passo a Passo

Se você está vendo **404: NOT_FOUND** no Vercel, siga este guia detalhado:

## Etapa 1: Verificar os Logs de Build

1. Acesse o [Painel do Vercel](https://vercel.com/dashboard)
2. Clique no seu projeto **Controle-Trocas**
3. Vá na aba **Deployments**
4. Clique no deployment que está falhando (o mais recente)
5. Procure por qualquer texto em **vermelho** ou mensagens de erro

### O que procurar nos logs:

```
❌ Erro no Prisma:
   "Error: @prisma/client did not initialize yet"
   
❌ Erro de Build:
   "Command failed with exit code 1"
   
❌ Erro de Compilação:
   "Module not found"
   
❌ Erro do Next.js:
   "Error: Cannot find module"
```

## Etapa 2: Copiar os Logs

**Copie TODA a saída de build logs** e me envie. Vou precisar ver especificamente:
- As primeiras linhas (onde mostra a versão do Node/npm)
- A seção de `Building` 
- A seção de `Installing dependencies`
- Qualquer linha que contenha "Error" ou "Failed"

## Etapa 3: Verificar Variável de Ambiente

Certifique-se de que a variável está configurada **exatamente** assim:

```
Nome: DATABASE_URL
Valor: postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

**Importante**: 
- Não coloque aspas ao redor do valor
- Certifique-se de que está em **Production, Preview E Development**
- O valor deve começar com `postgresql://` (não `postgres://`)

## Etapa 4: Forçar Rebuild Completo

Se os logs não mostrarem erros óbvios:

1. Vá em **Settings** → **General**
2. Role até **Danger Zone**
3. Clique em **Delete Deployment** (apenas do deployment com problema)
4. Volte para **Deployments**
5. Clique em **Redeploy** com a opção **Use existing Build Cache** **DESMARCADA**

## Etapa 5: Verificar Funcionalidade Local

Antes de debuggar mais, confirme que funciona localmente:

```bash
# No terminal, dentro da pasta do projeto:
npm run build
npm start
```

Se aparecer erro aqui, o problema não é específico do Vercel.

## Resposta Esperada

**Me envie**:
1. Screenshot ou texto completo dos **Build Logs**
2. Confirmação se roda localmente (`npm run build` funciona?)
3. Screenshot da configuração da variável DATABASE_URL

Com essas informações consigo identificar o problema exato!

---

## Correções Comuns

### Se o erro for "PrismaClient is not configured for deployment"

Adicione no `.env` local e teste:
```bash
DATABASE_URL="sua_url_do_neon"
npm run build
```

### Se o erro for "Cannot find module '@/components/...'"

O problema é de path. Verifique se existe `tsconfig.json` com:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Se aparecer "ELIFECYCLE Command failed"

Limpe e reinstale:
```bash
rm -rf node_modules package-lock.json .next
npm install
npm run build
```
