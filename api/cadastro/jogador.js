// POST /api/cadastro/jogador — conclui o cadastro do jogador de forma atômica.
// Exige access_token (sessão) COM sessão verificada por código. O usuario_id vem
// do TOKEN validado, nunca do body. O CPF é normalizado, validado e hasheado aqui
// (a chave HMAC nunca vai ao banco nem ao browser).
import { ConfigError, env } from '../_lib/env.js';
import { adminClient, usuarioDoToken } from '../_lib/supabaseAdmin.js';
import { lerJson, json, origemPermitida, aplicarCors } from '../_lib/http.js';
import { normalizarCpf, cpfValido, hashCpf } from '../_lib/crypto.js';

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];
const POSICOES = ['Goleiro','Zagueiro','Lateral','Volante','Meia','Ponta','Atacante'];

function idadeDe(iso) {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}
const txt = (v, max) => (v == null ? null : String(v).trim().slice(0, max) || null);
const intOuNull = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };

export default async function handler(req, res) {
  aplicarCors(req, res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') return json(res, 405, { ok: false, erro: 'metodo' });
  if (!origemPermitida(req)) return json(res, 403, { ok: false, erro: 'origem' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return json(res, 401, { ok: false, erro: 'sem_token' });

  let body;
  try { body = await lerJson(req, 32 * 1024); } catch { return json(res, 400, { ok: false, erro: 'payload' }); }

  try {
    const info = await usuarioDoToken(token);
    if (!info || !info.sessionId) return json(res, 401, { ok: false, erro: 'token_invalido' });
    const admin = adminClient();

    // Barreira: precisa de sessão verificada por código.
    const { data: verificada } = await admin.rpc('checar_sessao_verificada', {
      p_usuario: info.user.id, p_session: info.sessionId,
    });
    if (!verificada) return json(res, 403, { ok: false, erro: 'sem_sessao_verificada',
      mensagem: 'Entre com senha e código antes de concluir o cadastro.' });

    // Validação server-side.
    const nome = txt(body.nome, 150);
    const cpfDig = normalizarCpf(body.cpf);
    const nascimento = txt(body.nascimento, 10);
    const estado = String(body.estado || '').toUpperCase().slice(0, 2);
    const cidade = txt(body.cidade, 120);
    const posicao = txt(body.posicao, 40);

    if (!nome) return json(res, 400, { ok: false, erro: 'nome' });
    if (!cpfValido(cpfDig)) return json(res, 400, { ok: false, erro: 'cpf', mensagem: 'CPF inválido.' });
    if (!nascimento || idadeDe(nascimento) == null) return json(res, 400, { ok: false, erro: 'nascimento' });
    const idade = idadeDe(nascimento);
    if (idade < 7 || idade > 19) {
      return json(res, 400, { ok: false, erro: 'idade',
        mensagem: `Cadastro permitido de 7 a 19 anos (você tem ${idade}).` });
    }
    if (!UFS.includes(estado)) return json(res, 400, { ok: false, erro: 'estado' });
    if (!cidade) return json(res, 400, { ok: false, erro: 'cidade' });
    if (!POSICOES.includes(posicao)) return json(res, 400, { ok: false, erro: 'posicao' });

    const menor = idade < 18;
    const respNome = txt(body.responsavel_nome, 150);
    const respTel = txt(body.responsavel_telefone, 30);
    if (menor && (!respNome || !respTel)) {
      return json(res, 400, { ok: false, erro: 'responsavel',
        mensagem: 'Menores de 18 precisam de nome e telefone do responsável.' });
    }
    if (menor && !body.consentimento) {
      return json(res, 400, { ok: false, erro: 'consentimento',
        mensagem: 'É necessário aceitar o termo do responsável.' });
    }

    const { data, error } = await admin.rpc('concluir_cadastro_jogador', {
      p_usuario: info.user.id,
      p_nome: nome,
      p_cpf_hash: hashCpf(cpfDig),
      p_versao_chave: env.cpfKeyVersion,
      p_nascimento: nascimento,
      p_idade: idade,
      p_cidade: cidade,
      p_estado: estado,
      p_posicao: posicao,
      p_lado: txt(body.lado, 40),
      p_pe: txt(body.pe, 20),
      p_altura: intOuNull(body.altura),
      p_peso: intOuNull(body.peso),
      p_clube: txt(body.clube, 120),
      p_anos: intOuNull(body.anos_jogando),
      p_contato_email: txt(body.contato_email, 160) || info.user.email,
      p_contato_telefone: txt(body.contato_telefone, 30),
      p_responsavel_nome: menor ? respNome : null,
      p_responsavel_telefone: menor ? respTel : null,
      p_consentimento_versao: menor ? txt(body.consentimento_versao, 40) || 'resp-v1' : null,
    });
    if (error) throw new Error('RPC concluir: ' + error.message);

    if (data?.status === 'cpf_duplicado') {
      return json(res, 409, { ok: false, erro: 'cpf_duplicado',
        mensagem: 'Este CPF já está vinculado a outra conta.' });
    }
    if (data?.status === 'papel_invalido') {
      return json(res, 403, { ok: false, erro: 'papel',
        mensagem: 'Esta conta não é de jogador.' });
    }
    if (data?.status === 'ja_concluido') {
      return json(res, 200, { ok: true, ja_concluido: true, atleta_id: data.atleta_id });
    }
    if (data?.status !== 'ok') return json(res, 500, { ok: false, erro: 'interno' });

    return json(res, 200, { ok: true, atleta_id: data.atleta_id });
  } catch (e) {
    if (e instanceof ConfigError) return json(res, 500, { ok: false, erro: 'config' });
    console.error('[cadastro/jogador]', e);
    return json(res, 500, { ok: false, erro: 'interno' });
  }
}
