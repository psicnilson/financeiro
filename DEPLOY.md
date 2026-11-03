# Colocar o Minhas Finanças na internet

O código usa Supabase para autenticação e banco de dados e Render para o servidor web. A criação das contas nesses serviços não configura o banco ou publica o site automaticamente.

## 1. Preparar o Supabase

1. Abra seu projeto no Supabase: a Project URL informada é `https://sodbjsptrmmixvadwebj.supabase.co`.
2. No menu **SQL Editor**, escolha **New query**.
3. No GitHub, abra `supabase/schema.sql`, clique em **Raw** e copie TODO o conteúdo. Cole no SQL Editor e clique em **Run**. Aguarde a confirmação de sucesso. O script cria a tabela `entries`, regras de acesso por usuário (RLS) e uma função de importação. Pode ser executado novamente sem apagar os lançamentos. Não desative RLS.
4. Em **Settings → API Keys** (ou na janela **Connect**), localize a chave **Publishable key**. Projetos antigos podem oferecer uma chave **anon** em **Legacy API Keys**; ela também funciona. Copie a chave para configurar o Render na próxima etapa. Não use `secret`, `service_role`, nem a senha do banco.
5. Em **Authentication → Providers → Email**, mantenha o login por e-mail e a confirmação de e-mail ativados. Use senha de pelo menos 8 caracteres para os usuários. Não confunda a senha do banco com a senha de login no aplicativo.

## 2. Publicar no Render

1. Entre no Render e escolha **New → Blueprint**.
2. Conecte sua conta GitHub e autorize o repositório `psicnilson/financeiro`.
3. Selecione a branch `main`. O Render lerá o arquivo `render.yaml`.
4. No campo `SUPABASE_PUBLISHABLE_KEY`, cole a chave **publishable** (ou **anon**) copiada no Supabase. A URL do projeto já está preenchida no arquivo. Nunca coloque a senha do banco nesse campo.
5. Confira o plano selecionado e as condições exibidas pelo Render. O arquivo solicita o plano **Free**. Confirme somente depois de conferir os custos exibidos.
6. Clique em **Deploy/Apply** e aguarde o estado **Live**. Anote o endereço HTTPS `https://NOME-DO-SERVICO.onrender.com` que o Render fornecer.

Se preferir **New → Web Service** em vez de Blueprint, configure:

- Repositório: `psicnilson/financeiro`; branch: `main`; linguagem/runtime: Node.
- Build command: `npm ci --include=dev && npm run build`.
- Start command: `npm start`; health check path: `/health`.
- Variáveis: `APP_MODE=cloud`, `HOST=0.0.0.0`, `NODE_VERSION=24.22.1`, `SUPABASE_URL=https://sodbjsptrmmixvadwebj.supabase.co`, `SUPABASE_PUBLISHABLE_KEY` com a chave pública do seu projeto.

## 3. Configurar os links dos e-mails

No Supabase, abra **Authentication → URL Configuration**:

1. Em **Site URL**, coloque o endereço HTTPS fornecido pelo Render, sem caminho adicional.
2. Em **Redirect URLs**, adicione esse mesmo endereço e sua variante com `/` no final.
3. Salve. Isso é necessário para a confirmação de cadastro e a recuperação de senha voltarem ao seu site.

## 4. Criar seu login e testar

1. Abra o endereço HTTPS do Render. A tela deve pedir e-mail e senha. Se aparecer **Modo local**, confira as variáveis: não registre dados pessoais antes de corrigir.
2. Preencha seu e-mail e uma senha (mínimo 8 caracteres) e clique em **Criar conta**.
3. Confirme pelo e-mail recebido. Sua conta do Supabase/Render não é automaticamente uma conta dentro do aplicativo.
4. Entre e registre uma receita de teste. Abra o mesmo site no celular, entre com o mesmo login e confirme que o registro aparece. Para atualizar outra tela já aberta, use **Atualizar dados**.
5. Clique em **Sair** e confira que os dados somem da tela. Cada conta tem os próprios registros.
6. Para recuperar sua senha, preencha o e-mail e clique em **Esqueci minha senha**. Abra o link recebido e defina a nova senha.

A entrega de e-mails do Supabase pode ter limites/restrições no serviço padrão. Se o e-mail não chegar, verifique spam e **Authentication → Logs**; configure um provedor SMTP em Authentication para uso regular. Para um acesso pessoal inicial, também é possível criar o usuário pelo painel **Authentication → Users → Add user → Create new user**, marcando a confirmação automática de e-mail, se a opção existir. Não desative as políticas do banco para resolver falhas de e-mail.

## 5. Trazer os lançamentos da versão antiga

Na versão antiga, no mesmo navegador/endereço em que os lançamentos foram registrados, clique em **Exportar backup**. Na versão online, entre na conta correta e use **Importar backup**. A importação substitui TODOS os registros dessa conta, após confirmação; exporte os registros atuais primeiro. Não é uma mesclagem.

## Limites e persistência

- Os lançamentos ficam no Supabase, vinculados ao seu login. Reiniciar o Render não apaga o banco.
- O navegador guarda a sessão de login; clique em Sair em aparelhos compartilhados.
- A lista tem limite de 10.000 registros no aplicativo. Não há conexão bancária nem atualização automática entre telas abertas; use Atualizar dados.
- O plano gratuito do Render pode suspender o serviço por inatividade; o primeiro acesso pode demorar. O Supabase gratuito também tem quotas e pode pausar projetos. Confira as condições atuais de ambos.
- Exporte backups regularmente. Guardar na nuvem não substitui um backup.
- Alterações na branch main podem iniciar um novo deploy. A senha do banco e chaves administrativas não pertencem ao repositório ou ao frontend.
