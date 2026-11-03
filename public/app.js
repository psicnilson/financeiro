import {categories,parseAmount,validEntry,readBackup,totals,monthEntries} from './finance.js';
import {localStore,cloudStore} from './store.js';
const $ = id => document.getElementById(id);
const money = cents => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
$('month').value=today.slice(0,7); $('date').value=today;
for(const category of categories) $('category').add(new Option(category,category));
$('category').value='Outros';
let entries=[],store,cloud,activeUser=null,epoch=0,busy=false,loaded=false,recovery=false;
const message = text => {$('status').textContent=text;};
function controls() {
  document.querySelectorAll('#dashboard button,#dashboard input,#dashboard select').forEach(el=>{el.disabled=busy || !loaded;});
  document.querySelectorAll('#auth-panel button,#auth-panel input,#recovery-panel button,#recovery-panel input,#account-bar button').forEach(el=>{el.disabled=busy;});
}
function lock(value) {busy=value; controls();}
function render() {
  const current=monthEntries(entries,$('month').value).sort((a,b)=>b.date.localeCompare(a.date));
  const summary=totals(current);
  for(const k of ['income','expense','balance']) $(k).textContent=money(summary[k]);
  $('entries').replaceChildren(); $('empty').hidden=current.length>0;
  $('count').textContent=`${current.length} lançamento${current.length===1?'':'s'}`;
  for(const e of current) {
    const row=document.createElement('tr'), desc=document.createElement('td'),category=document.createElement('small'),date=document.createElement('td'),amount=document.createElement('td'),action=document.createElement('td'),remove=document.createElement('button');
    desc.textContent=e.description; category.textContent=`${e.category} · ${e.type==='income'?'Receita':'Despesa'}`; desc.append(category);
    date.textContent=e.date.split('-').reverse().join('/'); amount.className=e.type; amount.textContent=`${e.type==='income'?'+':'−'} ${money(e.cents)}`;
    remove.type='button';remove.className='delete';remove.textContent='Excluir';remove.setAttribute('aria-label',`Excluir ${e.description}`);
    remove.onclick=()=>{if(confirm(`Excluir “${e.description}”?`)) mutate(()=>store.remove(e.id),'Lançamento excluído.');};
    action.append(remove);row.append(desc,date,amount,action);$('entries').append(row);
  }
  controls();
}
async function load() {
  const version=epoch;const source=store;
  loaded=false;controls();
  const next=await source.list();
  if(version!==epoch) return;
  entries=next;loaded=true;render();
}
async function mutate(operation,success) {
  if(busy || !loaded) return false;
  lock(true);const version=epoch;
  try {
    await operation();
    if(version!==epoch) return false;
    try {await load();message(success);return true;}
    catch {message('A alteração foi enviada, mas não foi possível atualizar a lista. Clique em Atualizar dados antes de continuar.');return false;}
  } catch(error) {if(version===epoch) message(error.message || 'Não foi possível salvar. Tente novamente.');return false;}
  finally {lock(false);}
}
$('month').onchange=render;
$('entry-form').onsubmit=async event=>{
  event.preventDefault(); if(busy||!loaded)return;
  try {
    if(entries.length>=10000)throw new Error('Limite de 10.000 lançamentos atingido.');
    const entry={id:crypto.randomUUID(),description:$('description').value.trim(),type:$('type').value,category:$('category').value,cents:parseAmount($('amount').value),date:$('date').value};
    if(!validEntry(entry))throw new Error('Confira a descrição, a data e o valor.');
    if(await mutate(()=>store.add(entry),'Lançamento salvo.')) {$('month').value=entry.date.slice(0,7);$('description').value='';$('amount').value='';render();$('description').focus();}
  } catch(error){message(error.message);}
};
$('export').onclick=()=>{
  if(!loaded||busy)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,entries},null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=`minhas-financas-${today}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  message('Backup exportado. Guarde o arquivo em um local seguro.');
};
$('import').onchange=async event=>{
  const file=event.target.files[0];if(!file||busy||!loaded)return;
  try {
    if(file.size>5000000)throw new Error('O backup deve ter até 5 MB.');
    const next=readBackup(await file.text());
    if(!confirm(`Substituir TODOS os ${entries.length} registros atuais pelos ${next.length} registros do backup? Exporte os dados atuais primeiro para preservá-los.`))return;
    await mutate(()=>store.replace(next),'Backup importado. Selecione o mês dos registros para consultá-los.');
  } catch(error){message(error.message || 'Backup inválido.');}
  finally{event.target.value='';}
};
$('refresh').onclick=async()=>{
  if(busy)return; lock(true);
  try{await load();message('Dados atualizados.');}catch{message('Não foi possível carregar os dados. Verifique a conexão e tente atualizar novamente.');}
  finally{lock(false);}
};
async function sessionChanged(event,session) {
  if(event==='PASSWORD_RECOVERY')recovery=true;
  const user=session?.user || null;
  if(user?.id===activeUser && event!=='PASSWORD_RECOVERY')return;
  epoch++;activeUser=user?.id || null;entries=[];loaded=false;store=undefined;
  $('password').value='';$('description').value='';$('amount').value='';
  $('auth-panel').hidden=Boolean(user);$('recovery-panel').hidden=!user||!recovery;$('dashboard').hidden=!user||recovery;$('account-bar').hidden=!user;
  $('account-email').textContent=user?.email || '';render();
  if(!user){recovery=false;message('Entre ou crie uma conta para acessar seus dados.');return;}
  store=cloud.forUser(user.id);
  try{await load();message(recovery?'Defina uma nova senha para continuar.':'Dados carregados da sua conta.');}
  catch{message('Não foi possível carregar seus dados. Verifique a conexão e se o banco foi configurado. Clique em Atualizar dados para tentar novamente.');}
}
async function authAction(action) {
  if(busy)return;lock(true);
  try{await action();}catch{message('Não foi possível conectar. Verifique sua internet e tente novamente.');}finally{lock(false);}
}
$('auth-form').onsubmit=event=>{
  event.preventDefault();authAction(async()=>{
    const {error}=await cloud.client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
    if(error)message('Não foi possível entrar. Confira e-mail, senha e a confirmação do e-mail.');
  });
};
$('signup').onclick=()=>{
  if(!$('auth-form').reportValidity())return;
  authAction(async()=>{
    const {error}=await cloud.client.auth.signUp({email:$('email').value.trim(),password:$('password').value,options:{emailRedirectTo:location.origin}});
    message(error?'Não foi possível criar a conta. Confira os dados e tente novamente.':'Cadastro solicitado. Confira sua caixa de e-mail e confirme o endereço antes de entrar.');
  });
};
$('recover').onclick=()=>{
  if(!$('email').reportValidity())return;
  authAction(async()=>{
    const {error}=await cloud.client.auth.resetPasswordForEmail($('email').value.trim(),{redirectTo:location.origin});
    message(error?'Não foi possível solicitar a recuperação. Tente novamente mais tarde.':'Se houver uma conta para esse e-mail, você receberá um link para redefinir a senha.');
  });
};
$('recovery-form').onsubmit=event=>{
  event.preventDefault();authAction(async()=>{
    const {error}=await cloud.client.auth.updateUser({password:$('new-password').value});
    if(error){message('Não foi possível atualizar a senha. Solicite outro link de recuperação.');return;}
    recovery=false;$('new-password').value='';$('recovery-panel').hidden=true;$('dashboard').hidden=false;message('Senha atualizada.');
  });
};
$('logout').onclick=()=>authAction(async()=>{
  const {error}=await cloud.client.auth.signOut({scope:'local'});
  if(error){message('Não foi possível sair. Tente novamente.');return;}
  await sessionChanged('SIGNED_OUT',null);
});
async function init() {
  try {
    const response=await fetch('/config.json');if(!response.ok)throw new Error();const config=await response.json();
    if(config.mode==='cloud'){
      cloud=cloudStore(config);
      $('storage-title').textContent='Seus dados salvos na sua conta';
      $('storage-description').textContent='Entre com o mesmo e-mail em outro dispositivo para acessar seus lançamentos. Use Atualizar dados para buscar alterações feitas em outra tela. Exporte backups regularmente.';
      // Não executar chamadas assíncronas do SDK dentro do callback de autenticação.
      cloud.client.auth.onAuthStateChange((event,session)=>setTimeout(()=>sessionChanged(event,session),0));
      const {data,error}=await cloud.client.auth.getSession();if(error)throw error;
      if(data.session) await sessionChanged('INITIAL_SESSION',data.session);
      else {$('auth-panel').hidden=false;message('Entre ou crie uma conta para acessar seus dados.');}
    }else{
      store=localStore();$('dashboard').hidden=false;$('account-bar').hidden=false;$('logout').hidden=true;$('account-email').textContent='Modo local — dados neste navegador';
      await load();message('Modo local. Exporte um backup para levar seus registros para a versão online.');
    }
  } catch {message('Não foi possível iniciar ou ler os dados. Seus registros não foram alterados. Confira a configuração e recarregue a página.');}
}
init();
