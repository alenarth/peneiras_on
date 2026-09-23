/* ============================================================
   PENEIRAS ON — validation.js
   Regras de validação e renderização de erro dos formulários,
   consumido por login.js, cadastro.js e recuperar.js.

   Contrato de acessibilidade (WCAG 3.3.1 / 3.3.3):
     · a mensagem fica num <span class="field__error" role="alert"> com id,
       ligado ao campo por aria-describedby; o campo recebe aria-invalid="true"
     · erro só aparece depois que o campo perde o foco (blur) ou na tentativa
       de envio — nunca enquanto a pessoa ainda está digitando pela 1ª vez
     · depois de marcado, o campo revalida a cada tecla (some assim que corrige)
     · numa tentativa de envio inválida, o foco vai para o 1º campo com erro
   Requer ui.js (não usa nada dele além de estar carregado antes).
   ============================================================ */
const Validation = (() => {
  /* ---------- regras: recebem o valor e devolvem '' (ok) ou a mensagem ---------- */
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const digits = v => String(v || '').replace(/\D/g, '');

  const rules = {
    required: (v, msg) => String(v || '').trim() ? '' : (msg || 'Preencha este campo.'),
    email: v => EMAIL.test(String(v || '').trim()) ? '' : 'Digite um e-mail válido, como nome@exemplo.com.',
    cpf: v => {
      const c = digits(v);
      if (c.length !== 11) return `O CPF precisa ter 11 dígitos. Você digitou ${c.length}.`;
      if (/^(\d)\1{10}$/.test(c)) return 'CPF inválido (dígitos repetidos).';
      const dv = base => { let s = 0; for (let i = 0; i < base.length; i++) s += Number(base[i]) * (base.length + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
      if (dv(c.slice(0, 9)) !== Number(c[9]) || dv(c.slice(0, 10)) !== Number(c[10])) return 'CPF inválido. Confira os números.';
      return '';
    },
    // login e recuperação aceitam CPF ou e-mail no mesmo campo
    emailOrCpf: v => {
      const s = String(v || '').trim();
      if (!s) return 'Informe seu CPF ou e-mail.';
      if (/^[\d.\-\s]+$/.test(s)) return rules.cpf(s);
      return EMAIL.test(s) ? '' : 'Digite um e-mail válido (nome@exemplo.com) ou um CPF com 11 dígitos.';
    },
    password: v => String(v || '') ? '' : 'Digite sua senha.',
    code6: v => /^\d{6}$/.test(digits(v)) ? '' : `O código tem 6 dígitos. Faltam ${Math.max(0, 6 - digits(v).length)}.`,
    phone: v => digits(v).length >= 10 ? '' : 'Digite o celular com DDD, como (21) 99999-9999.',
    match: (v, other, msg) => v === other ? '' : (msg || 'As senhas não conferem.'),
    strongPassword: v => {
      const s = String(v || '');
      if (s.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
      if (!/[A-Z]/.test(s)) return 'Inclua pelo menos 1 letra maiúscula.';
      if (!/\d/.test(s)) return 'Inclua pelo menos 1 número.';
      return '';
    },
    /* Idade a partir da data de nascimento (ISO yyyy-mm-dd), dentro da faixa */
    ageRange: (v, min = 7, max = 19) => {
      if (!v) return 'Informe a data de nascimento.';
      const a = ageFromISO(v);
      if (a == null) return 'Data inválida.';
      if (a > 150 || a < 0) return 'Confira o ano. Essa data não parece certa.';
      if (a < min || a > max) return `Idade fora da faixa permitida (${String(min).padStart(2, '0')}–${max}): você tem ${a} anos.`;
      return '';
    },
  };
  function ageFromISO(iso) {
    const d = new Date(iso + 'T00:00:00'), now = new Date();
    if (isNaN(d)) return null;
    let a = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
    return a;
  }

  /* ---------- renderização de erro no campo ---------- */
  function errorId(input) {
    if (!input.id) input.id = 'f-' + Math.random().toString(36).slice(2, 8);
    return input.id + '-error';
  }
  function setError(input, message) {
    if (!input || !input.setAttribute) return null;
    const wrap = input.closest ? (input.closest('.field') || input.parentElement) : input.parentElement;
    if (!wrap) return null;
    const id = errorId(input);
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('span');
      el.className = 'field__error';
      el.id = id;
      el.setAttribute('role', 'alert');
      wrap.appendChild(el);
    }
    el.textContent = message;
    el.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    const desc = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (!desc.includes(id)) input.setAttribute('aria-describedby', [...desc, id].join(' '));
    return el;
  }
  function clearError(input) {
    if (!input || !input.removeAttribute) return;
    const id = errorId(input);
    const el = document.getElementById(id);
    if (el) el.remove();
    input.removeAttribute('aria-invalid');
    const desc = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(x => x && x !== id);
    if (desc.length) input.setAttribute('aria-describedby', desc.join(' ')); else input.removeAttribute('aria-describedby');
  }

  /* ---------- ligação com um formulário ----------
     fields: [{ el, validate: (value) => '' | mensagem }]
     Devolve { validateAll(showErrors), validateField(el), reset() }.
     onValid(e) roda no submit só quando tudo passa. */
  function bind(form, fields, onValid) {
    const validFields = (fields || []).filter(Boolean).filter(f => f.el && typeof f.validate === 'function');
    const touched = new WeakSet();
    const validateField = (f, show) => {
      const msg = f.validate(f.el.value);
      if (show) { if (msg) setError(f.el, msg); else clearError(f.el); }
      return !msg;
    };
    validFields.forEach(f => {
      f.el.addEventListener('blur', () => { touched.add(f.el); validateField(f, true); });
      f.el.addEventListener('input', () => { if (touched.has(f.el) || f.el.getAttribute('aria-invalid') === 'true') validateField(f, true); });
      // campos dependentes (ex.: confirmar senha) revalidam quando o par muda
      if (f.dependsOn) f.dependsOn.addEventListener('input', () => { if (touched.has(f.el)) validateField(f, true); });
    });
    const validateAll = (show = true) => {
      let first = null;
      validFields.forEach(f => { touched.add(f.el); const ok = validateField(f, show); if (!ok && !first) first = f.el; });
      if (first && show) first.focus();
      return !first;
    };
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      if (validateAll(true)) onValid && onValid(e);
    });
    const reset = () => validFields.forEach(f => clearError(f.el));
    return { validateAll, validateField: el => { const f = validFields.find(x => x.el === el); return f ? validateField(f, true) : true; }, reset };
  }

  /* Move o foco para o 1º campo marcado como inválido dentro de root */
  function focusFirstInvalid(root = document) {
    const el = root.querySelector('[aria-invalid="true"]');
    if (el) el.focus();
    return !!el;
  }

  return { rules, ageFromISO, setError, clearError, bind, focusFirstInvalid };
})();
