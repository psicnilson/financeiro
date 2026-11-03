# Minhas Finanças

Finanças pessoais em português: receitas, despesas, categorias, resumo mensal e backups JSON. Possui modo local e modo online com login e banco Supabase, protegido por regras por usuário (RLS).

## Publicar para acessar de qualquer lugar

Siga [o passo a passo de publicação](DEPLOY.md). O arquivo `render.yaml` prepara o serviço Render. Execute primeiro `supabase/schema.sql` no SQL Editor do Supabase. Configure a chave pública no Render; não use credenciais administrativas. O cadastro e a senha dentro do aplicativo são separados das contas dos serviços de hospedagem.

## Executar localmente

Requer Node.js 22 ou superior (validado com 24.22.1).

```bash
npm ci --include=dev
npm run build
npm start
```

Sem as variáveis Supabase, usa o modo local, escutando em 127.0.0.1:3000. Os dados locais da primeira versão continuam disponíveis no mesmo navegador e endereço. Para encerrar, Ctrl+C.

Para testar o modo online localmente, copie `.env.example` para `.env`, preencha a chave pública, adicione o endereço local à lista de redirect URLs no Supabase e execute `npm run start:cloud`. O script carrega o `.env` explicitamente. Não faça commit do `.env`. O modo online requer conexão com a internet; não realiza gravações offline.

```bash
npm test
```

Os testes cobrem valores monetários, resumos, backups, configuração segura e regras reais de PostgreSQL (via PGlite) para isolamento entre contas e importação atômica. Não substituem a validação final com login e e-mail no projeto Supabase publicado.

## Uso

Escolha o mês, registre receita/despesa com valor como `150,50`, data e categoria. O saldo é entradas menos saídas do mês, não o saldo bancário acumulado. **Exportar backup** baixa JSON; **Importar backup** substitui todos os registros da conta (ou do navegador no modo local), após confirmação. Proteja esses arquivos: contêm informações financeiras em texto legível.

Em modo online, entre com o mesmo login no celular ou computador. Use **Atualizar dados** para buscar alterações feitas em outra tela. Cada conta possui registros separados. O app não se conecta a bancos e não possui sincronização automática entre telas já abertas. Consulte DEPLOY.md para limites dos serviços e migração dos dados locais.
