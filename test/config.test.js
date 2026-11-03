import test from 'node:test';
import assert from 'node:assert/strict';
import {getConfig} from '../config.js';
test('Configuração local preserva o uso offline e nuvem falha sem credenciais públicas',()=>{
  assert.deepEqual(getConfig({}),{mode:'local'});
  for(const env of [{RENDER:'true'},{APP_MODE:'cloud'},{SUPABASE_URL:'https://test.supabase.co'}]) assert.throws(()=>getConfig(env));
});
test('Configuração rejeita chaves administrativas e URLs fora do Supabase',()=>{
  const url='https://example.supabase.co';
  const jwt=role=>`header.${Buffer.from(JSON.stringify({role})).toString('base64url')}.signature`;
  for(const key of ['sb_secret_fake',jwt('service_role'),'invalid']) assert.throws(()=>getConfig({SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:key}));
  const key='sb_publishable_test';
  for(const value of ['http://example.supabase.co','https://example.com','https://user:pass@example.supabase.co','https://example.supabase.co/path']) assert.throws(()=>getConfig({SUPABASE_URL:value,SUPABASE_PUBLISHABLE_KEY:key}));
  assert.deepEqual(getConfig({SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:key}),{mode:'cloud',url,key});
  assert.equal(getConfig({SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:jwt('anon')}).mode,'cloud');
});
