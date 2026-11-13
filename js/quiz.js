// Dynamic injection of Meta Pixel base script
(function(f, b, e, v, n, t, s) {
  if (f.fbq) return;
  n = f.fbq = function() {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  };
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = !0;
  n.version = '2.0';
  n.queue = [];
  t = b.createElement(e);
  t.async = !0;
  t.src = v;
  s = b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t, s);
})(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

// Initialize Meta Pixel for RM9
fbq('init', '3568497506704754');
fbq('track', 'PageView');

document.addEventListener('DOMContentLoaded', () => {
  const dialog = document.getElementById('quizDialog');
  const openButtons = document.querySelectorAll('.js-open-quiz');
  const closeButton = document.querySelector('.js-close-quiz');
  const progressBar = document.getElementById('quizProgressBar');
  const steps = document.querySelectorAll('.quiz-step');
  const submitBtn = document.getElementById('quizSubmitBtn');
  
  let currentStepIndex = 0;
  let totalScore = 0;
  
  // Data model to store selected values
  const leadData = {
    modelo: '',
    faturamento: '',
    gargalo: '',
    nome: '',
    email: '',
    whatsapp: ''
  };

  // 0. CAPTURE UTM PARAMETERS ON LOAD
  const urlParams = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  utmKeys.forEach(k => {
    const val = urlParams.get(k);
    if (val) {
      sessionStorage.setItem(k, val.toLowerCase());
    }
  });

  // 1. OPEN / CLOSE DIALOG MECHANICS
  if (openButtons.length > 0 && dialog) {
    openButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        dialog.showModal();
        resetQuiz();
      });
    });
  }

  if (closeButton && dialog) {
    closeButton.addEventListener('click', () => {
      dialog.close();
    });
  }

  // 2. LIGHT-DISMISS FALLBACK (Clicks on backdrop)
  if (dialog) {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isInside = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isInside) {
        dialog.close();
      }
    });
  }

  // 3. OPTION SELECTION & AUTO ADVANCE
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(opt => {
    const radio = opt.querySelector('input[type="radio"]');
    if (radio) {
      opt.addEventListener('click', () => {
        radio.checked = true;
        const parentStep = opt.closest('.quiz-step');
        parentStep.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        
        setTimeout(() => {
          advanceStep();
        }, 220);
      });
    }
  });

  // 4. SUBMIT BUTTON ON CONTACT STEP
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (validateContactStep()) {
        processAndRouteLead();
      }
    });
  }

  function advanceStep() {
    if (currentStepIndex < steps.length - 1) {
      currentStepIndex++;
      updateQuizStep();
    }
  }

  function updateQuizStep() {
    steps.forEach((step, idx) => {
      if (idx === currentStepIndex) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });

    if (progressBar) {
      const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;
      progressBar.style.width = `${progressPercent}%`;
    }
  }

  function validateContactStep() {
    const nomeInput = document.getElementById('leadNome');
    const emailInput = document.getElementById('leadEmail');
    const whatsappInput = document.getElementById('leadWhatsapp');

    if (!nomeInput || !emailInput || !whatsappInput) return false;

    if (nomeInput.value.trim() === '') {
      alert('Por favor, informe seu nome ou cargo.');
      nomeInput.focus();
      return false;
    }

    if (emailInput.value.trim() === '' || !validateEmail(emailInput.value.trim())) {
      alert('Por favor, informe um e-mail corporativo válido.');
      emailInput.focus();
      return false;
    }

    if (whatsappInput.value.trim() === '') {
      alert('Por favor, informe seu WhatsApp para contato.');
      whatsappInput.focus();
      return false;
    }

    leadData.nome = nomeInput.value.trim();
    leadData.email = emailInput.value.trim();
    leadData.whatsapp = whatsappInput.value.trim();
    return true;
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function resetQuiz() {
    currentStepIndex = 0;
    totalScore = 0;
    
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(r => r.checked = false);
    
    document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
    
    const inputs = document.querySelectorAll('.quiz-input');
    inputs.forEach(i => i.value = '');

    updateQuizStep();
  }

  // 5. PROCESS & ROUTE LEAD
  function processAndRouteLead() {
    const r1 = document.querySelector('input[name="q1"]:checked');
    const r2 = document.querySelector('input[name="q2"]:checked');
    const r3 = document.querySelector('input[name="q3"]:checked');

    if (r1) totalScore += parseInt(r1.value || '5');
    if (r2) totalScore += parseInt(r2.value || '5');
    if (r3) totalScore += parseInt(r3.value || '5');

    leadData.modelo = r1 ? r1.getAttribute('data-label') : 'Não informado';
    leadData.faturamento = r2 ? r2.getAttribute('data-label') : 'Não informado';
    leadData.gargalo = r3 ? r3.getAttribute('data-label') : 'Não informado';

    dialog.close();


    // Meta Pixel & GA4
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', { value: totalScore, currency: 'BRL', content_name: 'Raio-X Antes da Peça' });
    }
    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', { value: totalScore, currency: 'BRL', event_category: 'engagement' });
    }

    // Disparo para o webhook de e-mail e CRM
    try {
      fetch('/api/send-mail.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: leadData.nome,
          email: leadData.email,
          telefone: leadData.whatsapp,
          segmento: leadData.modelo,
          mensagem: `Faturamento: ${leadData.faturamento} | Gargalo: ${leadData.gargalo}`,
          origem: 'Raio-X Estratégico (Modal)'
        })
      }).catch(e => console.warn('Email dispatch:', e));
    } catch(e) {}

    // Direct WhatsApp redirect with formatted pitch message
    const rm9Phone = '5541988467737';
    const messageText = `Olá RM9Brasil! Acabei de solicitar o Raio-X Estratégico no site.\n\n*Dados do meu negócio:*\n- *Nome/Cargo:* ${leadData.nome}\n- *E-mail:* ${leadData.email}\n- *WhatsApp:* ${leadData.whatsapp}\n- *Modelo de Negócio:* ${leadData.modelo}\n- *Faturamento Atual:* ${leadData.faturamento}\n- *Gargalo Identificado:* ${leadData.gargalo}\n\n*Pontuação:* ${totalScore} pts. Gostaria de agendar a análise com os sócios!`;
    
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${rm9Phone}&text=${encodeURIComponent(messageText)}`;
    
    sessionStorage.setItem('whatsappRedirectUrl', whatsappUrl);
    window.location.href = `obrigado.html`;
  }

  // 6. O formulário de contato da home (#inlineContactForm) é tratado em index.html (um único envio por e-mail).
});

