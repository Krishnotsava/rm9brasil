/* Formulário rápido em 2 etapas (páginas de serviço).
   Uso: <form data-lead-form data-source="form_hero_x" data-form-id="contato_x"> com campos por name. */
(function () {
  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    var card = form.closest('.hero-lead-card');
    var panes = form.querySelectorAll('.hero-lead-pane');
    var stepLabel = card ? card.querySelector('.hero-lead-step') : null;
    var msg = form.querySelector('.hero-lead-msg');
    var f = function (n) { return form.querySelector('[name="' + n + '"]'); };
    var say = function (t, ok) { msg.textContent = t; msg.className = 'hero-lead-msg ' + (ok ? 'is-ok' : 'is-err'); };
    var check = function (names) {
      for (var i = 0; i < names.length; i++) {
        var el = f(names[i]);
        if (!el.checkValidity()) { el.reportValidity(); el.focus(); return false; }
      }
      return true;
    };
    var go = function (n) {
      panes.forEach(function (p) { p.hidden = p.getAttribute('data-step') !== String(n); });
      if (stepLabel) stepLabel.textContent = 'Etapa ' + n + ' de 2';
      msg.textContent = '';
    };
    var formId = form.getAttribute('data-form-id') || 'contato_servico';
    form.querySelector('[data-lead-next]').addEventListener('click', function () {
      if (!check(['nome', 'email', 'servico'])) return;
      go(2);
      f('empresa').focus();
      if (typeof gtag === 'function') gtag('event', 'form_step', { form_id: formId, step: 1, servico: f('servico').value });
    });
    form.querySelector('[data-lead-back]').addEventListener('click', function () { go(1); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!check(['empresa', 'faturamento', 'funcionarios'])) return;
      var btn = form.querySelector('[type="submit"]');
      var original = btn.innerHTML;
      btn.innerHTML = '<span>Enviando...</span>';
      btn.disabled = true;
      var payload = {
        nome: f('nome').value.trim(),
        email: f('email').value.trim(),
        lead_empresa: f('empresa').value.trim(),
        servico_interesse: f('servico').value,
        faturamento: f('faturamento').value,
        funcionarios: f('funcionarios').value,
        mensagem: f('mensagem').value.trim(),
        service: 'lead_site',
        source: form.getAttribute('data-source') || 'form_servico'
      };
      fetch('/api/send-mail.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (r) { if (!res.ok || !r.success) throw new Error('falha'); }); })
        .then(function () {
          if (typeof gtag === 'function') gtag('event', 'generate_lead', { form_id: formId, lead_source: 'formulario', servico: payload.servico_interesse, faturamento: payload.faturamento, funcionarios: payload.funcionarios });
          if (typeof fbq === 'function') fbq('track', 'Lead');
          form.reset();
          panes.forEach(function (p) { p.hidden = true; });
          if (stepLabel) stepLabel.textContent = 'Enviado';
          say('Recebemos! A RM9 vai responder no e-mail que você informou em até 24h.', true);
        })
        .catch(function () {
          btn.disabled = false;
          btn.innerHTML = original;
          say('Não conseguimos enviar agora. Tente de novo ou fale com a gente no WhatsApp.', false);
        });
    });
  });
})();
