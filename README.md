# Minhas Finanças

Aplicativo inicial de finanças pessoais, em português, com receitas, despesas, categorias, resumo mensal, exclusão de lançamentos e backup JSON.

## Como executar

Requer Node.js 22 ou superior. Não utiliza bibliotecas externas nem banco de dados.

```bash
npm start
```

O servidor usa a porta 3000 e aceita apenas conexões locais por padrão. Abra o navegador no endereço local informado pelo seu ambiente. Para encerrar, use Ctrl+C. PORT e HOST permitem configurar a porta e a interface de escuta. Expor o servidor em uma rede exige avaliar acesso e proteção dos dados: esta versão não tem autenticação.

```bash
npm test
```

Os testes verificam valores monetários, resumo por mês e validação de backups.

## Uso e armazenamento

1. Escolha o mês que deseja consultar.
2. Informe tipo, descrição, valor (ex.: `150,50`), data e categoria.
3. Clique em **Adicionar lançamento**. O resumo mostra entradas menos saídas do mês selecionado; não é um saldo bancário acumulado.
4. Use **Exportar backup** periodicamente. **Importar backup** substitui os registros após confirmação.

Os dados são guardados no armazenamento local do navegador, associados ao endereço e porta usados para acessar o aplicativo. Não são enviados ao servidor nem sincronizados entre dispositivos. Limpar os dados do navegador, usar navegação privada ou mudar de navegador/endereço pode tornar os registros indisponíveis. Proteja seus backups: contêm informações financeiras em texto legível.

Esta primeira versão não possui conexão bancária, login ou sincronização na nuvem. Começa sem dados de exemplo.
