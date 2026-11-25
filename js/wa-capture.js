/* RM9: mini cadastro antes de abrir o WhatsApp.
   Intercepta os links de WhatsApp do site, pede nome, WhatsApp, empresa e serviço,
   grava o lead no CRM (/api/wa-lead.php) e abre o WhatsApp com a mensagem pronta. */
(function () {
  if (window.__rm9WaCapture) return;
  window.__rm9WaCapture = true;

  var path = location.pathname;
  // Páginas que não são de venda
  if (/^\/(trabalhe-conosco|fornecedores|pipeline|crm|admin|portal|triagem)/.test(path)) return;

  var SERVICOS = ['Tráfego pago e mídia', 'Planejamento e estratégia de marketing', 'Posicionamento de marca e branding', 'Escala de e-commerce', 'Marketplaces e TikTok Shop', 'Geração de contatos comerciais', 'Site ou landing page', 'Visibilidade em IA (ChatGPT, Google IA)', 'Outro / ainda não sei'];
  var MAPA = [
    [/tiktok|marketplace|live-commerce|shopee|afiliados|mercado-livre|upseller/, 'Marketplaces e TikTok Shop'],
    [/trafego|midia|automacao|ia-no-trafego/, 'Tráfego pago e mídia'],
    [/planejamento|consultoria|orcamento|sao-paulo/, 'Planejamento e estratégia de marketing'],
    [/branding|design-grafico|publicidade|influenciadores|redes-sociais|henvida|denfa|anjun/, 'Posicionamento de marca e branding'],
    [/lojas-virtuais|ecommerce|cro|funil|diva/, 'Escala de e-commerce'],
    [/criacao-de-sites|landing/, 'Site ou landing page']
  ];
  var servicoPagina = '';
  for (var i = 0; i < MAPA.length; i++) { if (MAPA[i][0].test(path)) { servicoPagina = MAPA[i][1]; break; } }

  var guardado = {};
  try { guardado = JSON.parse(localStorage.getItem('rm9_wa') || '{}') || {}; } catch (e) { guardado = {}; }

  var css = '' +
    '.rm9wa-ov{position:fixed;inset:0;background:rgba(14,14,16,.55);z-index:99998;display:flex;align-items:flex-end;justify-content:center}' +
    '@media(min-width:640px){.rm9wa-ov{align-items:center}}' +
    '.rm9wa{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:#fff;color:#0E0E10;width:100%;max-width:420px;border-radius:24px 24px 0 0;padding:22px 20px calc(20px + env(safe-area-inset-bottom));box-shadow:0 30px 80px -30px rgba(0,0,0,.5)}' +
    '@media(min-width:640px){.rm9wa{border-radius:24px}}' +
    '.rm9wa h3{margin:0 0 4px;font-size:1.2rem;font-weight:800;letter-spacing:-.01em}' +
    '.rm9wa p{margin:0 0 14px;color:#5E616B;font-size:.9rem;line-height:1.45}' +
    '.rm9wa input,.rm9wa select{width:100%;box-sizing:border-box;background:#F6F6F7;border:1px solid #D6D7DC;border-radius:12px;padding:12px 13px;font:inherit;font-size:16px;color:#0E0E10;margin-bottom:9px;outline:none}' +
    '.rm9wa input:focus,.rm9wa select:focus{border-color:#0E0E10;box-shadow:0 0 0 3px #DCDDFB}' +
    '.rm9wa .go{width:100%;border:0;border-radius:999px;background:#25D366;color:#06240F;font:inherit;font-weight:800;font-size:1rem;padding:14px;cursor:pointer;margin-top:4px}' +
    '.rm9wa .x{float:right;border:0;background:#F0F0F2;border-radius:999px;width:34px;height:34px;font-size:18px;cursor:pointer;color:#0E0E10}' +
    '.rm9wa .hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}' +
    '.rm9wa small{display:block;text-align:center;color:#8A8C95;font-size:.75rem;margin-top:10px}';

  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function esc(t) { return String(t || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function abrir(href) {
    if (!document.getElementById('rm9wa-css')) { var st = el('style', { id: 'rm9wa-css' }); st.textContent = css; document.head.appendChild(st); }
    var url; try { url = new URL(href, location.href); } catch (e) { location.href = href; return; }
    var textoOriginal = url.searchParams.get('text') || '';
    var ov = el('div', { class: 'rm9wa-ov', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Falar no WhatsApp' });
    var opts = '<option value="" disabled' + (servicoPagina || guardado.servico ? '' : ' selected') + '>Do que você precisa?</option>' +
      SERVICOS.map(function (s) { var sel = (servicoPagina || guardado.servico) === s ? ' selected' : ''; return '<option' + sel + '>' + esc(s) + '</option>'; }).join('');
    ov.innerHTML = '<form class="rm9wa" novalidate>' +
      '<button type="button" class="x" aria-label="Fechar">×</button>' +
      '<h3>Falar no WhatsApp</h3>' +
      '<p>Conte rapidinho quem é você para a gente já chegar preparado na conversa.</p>' +
      '<input name="nome" placeholder="Seu nome" autocomplete="name" required value="' + esc(guardado.nome) + '">' +
      '<input name="whatsapp" placeholder="Seu WhatsApp com DDD" inputmode="tel" autocomplete="tel" required value="' + esc(guardado.whatsapp) + '">' +
      '<input name="empresa" placeholder="Empresa (opcional)" autocomplete="organization" value="' + esc(guardado.empresa) + '">' +
      '<select name="servico" required>' + opts + '</select>' +
      '<input class="hp" name="site" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<button type="submit" class="go">Abrir o WhatsApp</button>' +
      '<small>Seus dados ficam só com a RM9.</small>' +
      '</form>';
    document.body.appendChild(ov);
    var f = ov.querySelector('form');
    var fechar = function () { ov.remove(); document.removeEventListener('keydown', esc_); };
    var esc_ = function (e) { if (e.key === 'Escape') fechar(); };
    document.addEventListener('keydown', esc_);
    ov.addEventListener('click', function (e) { if (e.target === ov) fechar(); });
    f.querySelector('.x').addEventListener('click', fechar);
    setTimeout(function () { (f.nome.value ? f.whatsapp : f.nome).focus(); }, 60);

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = f.nome.value.trim(), wa = f.whatsapp.value.trim(), dig = wa.replace(/\D/g, '');
      if (nome.length < 2) { f.nome.focus(); f.nome.setCustomValidity('Informe seu nome'); f.nome.reportValidity(); f.nome.setCustomValidity(''); return; }
      if (dig.length < 10 || dig.length > 13) { f.whatsapp.focus(); f.whatsapp.setCustomValidity('Informe o WhatsApp com DDD'); f.whatsapp.reportValidity(); f.whatsapp.setCustomValidity(''); return; }
      if (!f.servico.value) { f.servico.focus(); f.servico.reportValidity(); return; }
      var dados = { nome: nome, whatsapp: wa, empresa: f.empresa.value.trim(), servico: f.servico.value, pagina: path, site: f.site.value };
      guardado = { nome: dados.nome, whatsapp: dados.whatsapp, empresa: dados.empresa, servico: dados.servico };
      try { localStorage.setItem('rm9_wa', JSON.stringify(guardado)); } catch (err) {}
      // Envia para o CRM sem segurar a abertura do WhatsApp
      try {
        var body = JSON.stringify(dados);
        if (!(navigator.sendBeacon && navigator.sendBeacon('/api/wa-lead.php', new Blob([body], { type: 'application/json' })))) {
          fetch('/api/wa-lead.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true });
        }
      } catch (err) {}
      if (typeof gtag === 'function') gtag('event', 'generate_lead', { form_id: 'whatsapp_precadastro', lead_source: 'whatsapp', servico: dados.servico });
      if (typeof fbq === 'function') fbq('track', 'Contact');
      // Mensagem pronta
      var base = textoOriginal.replace(/^Ol[áa],?\s*RM9!?\s*/i, '').trim();
      var msg = 'Olá, RM9! Sou ' + nome + (dados.empresa ? ', da ' + dados.empresa : '') + '. ' + (base || ('Tenho interesse em ' + dados.servico.toLowerCase() + '.'));
      url.searchParams.set('text', msg);
      var destino = url.toString();
      fechar();
      var w = window.open(destino, '_blank');
      if (w) { try { w.opener = null; } catch (err) {} } else { location.href = destino; }
    });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (!/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(h)) return;
    if (a.hasAttribute('data-wa-direto')) return;
    e.preventDefault();
    abrir(h);
  });
})();
