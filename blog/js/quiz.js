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
  const prevBtn = document.getElementById('quizPrevBtn');
  const nextBtn = document.getElementById('quizNextBtn');
  
  let currentStepIndex = 0;
  let totalScore = 0;
  
  // Data model to store selected values
  const leadData = {
    modelo: '',
    verba: '',
    estagio: '',
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
  if (dialog && !('closedBy' in HTMLDialogElement.prototype)) {
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

  // 3. OPTION SELECTION LOGIC
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(opt => {
    const radio = opt.querySelector('input[type="radio"]');
    if (radio) {
      radio.addEventListener('change', () => {
        // Unselect siblings
        const parentStep = opt.closest('.quiz-step');
        parentStep.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
        
        opt.classList.add('selected');
        
        // Auto-advance for simple choice steps (Steps 1, 2, 3, 4)
        setTimeout(() => {
          advanceStep();
        }, 200);
      });
    }
  });

  // 4. NAVIGATION LOGIC
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStepIndex > 0) {
        currentStepIndex--;
        updateQuizStep();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      // Validate inputs if on the last input step (Contact info)
      if (currentStepIndex === steps.length - 1) {
        if (validateContactStep()) {
          processAndRouteLead();
        }
      } else {
        advanceStep();
      }
    });
  }

  function advanceStep() {
    if (currentStepIndex < steps.length - 1) {
      // Validate option is selected before advancing
      const currentStep = steps[currentStepIndex];
      const selectedRadio = currentStep.querySelector('input[type="radio"]:checked');
      
      if (!selectedRadio) {
        alert('Por favor, selecione uma opção para continuar.');
        return;
      }
      
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

    // Update Progress Bar
    const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;
    if (progressBar) {
      progressBar.style.width = `${progressPercent}%`;
    }

    // Toggle Navigation Buttons
    if (prevBtn) {
      prevBtn.style.visibility = currentStepIndex > 0 ? 'visible' : 'hidden';
    }

    if (nextBtn) {
      nextBtn.textContent = currentStepIndex === steps.length - 1 ? 'Enviar Diagnóstico' : 'Avançar';
    }
  }

  function validateContactStep() {
    const nomeInput = document.getElementById('leadNome');
    const emailInput = document.getElementById('leadEmail');
    const whatsappInput = document.getElementById('leadWhatsapp');

    if (!nomeInput || !emailInput || !whatsappInput) return false;

    if (nomeInput.value.trim() === '') {
      alert('Por favor, insira o seu nome.');
      nomeInput.focus();
      return false;
    }

    if (emailInput.value.trim() === '' || !validateEmail(emailInput.value)) {
      alert('Por favor, insira um e-mail válido.');
      emailInput.focus();
      return false;
    }

    if (whatsappInput.value.trim() === '') {
      alert('Por favor, insira o seu WhatsApp.');
      whatsappInput.focus();
      return false;
    }

    // Save inputs
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
    
    // Clear selections
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(r => r.checked = false);
    
    document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
    
    // Clear text inputs
    const inputs = document.querySelectorAll('.quiz-input-text');
    inputs.forEach(i => i.value = '');

    updateQuizStep();
  }

  // 5. LEAD SCORING & ROUTING LOGIC
  function processAndRouteLead() {
    // 5.1 Calculate Score
    const r1 = document.querySelector('input[name="q1"]:checked');
    const r2 = document.querySelector('input[name="q2"]:checked');
    const r3 = document.querySelector('input[name="q3"]:checked');
    const r4 = document.querySelector('input[name="q4"]:checked');

    if (!r1 || !r2 || !r3 || !r4) return;

    totalScore = parseInt(r1.value) + parseInt(r2.value) + parseInt(r3.value) + parseInt(r4.value);
    
    // Store label values for the whatsapp text
    leadData.modelo = r1.getAttribute('data-label');
    leadData.verba = r2.getAttribute('data-label');
    leadData.estagio = r3.getAttribute('data-label');
    leadData.gargalo = r4.getAttribute('data-label');

    dialog.close();

    // 5.2 Calculate path prefix dynamically based on current folder depth
    let pathPrefix = '';
    const pathname = window.location.pathname;
    if (
      pathname.includes('/sp/') || 
      pathname.includes('/curitiba/') || 
      pathname.includes('/agencia-especializada-em-ecommerce/') || 
      pathname.includes('/agencia-gestao-marketplace/') || 
      pathname.includes('/gestao-de-trafego-pago/') || 
      pathname.includes('/agencia-especializada-em-seo-para-e-commerce/') ||
      pathname.includes('/estrategia-de-afiliados/') ||
      pathname.includes('/live-shop/') ||
      pathname.includes('/consultoria/') ||
      pathname.includes('/blog/')
    ) {
      pathPrefix = '../';
    }

    // 5.3 Extract UTMs for campaign attribution
    const utmSource = sessionStorage.getItem('utm_source') || 'organico';
    const utmMedium = sessionStorage.getItem('utm_medium') || 'web';
    const utmCampaign = sessionStorage.getItem('utm_campaign') || 'institucional';
    const utmContent = sessionStorage.getItem('utm_content') || '';
    const utmTerm = sessionStorage.getItem('utm_term') || '';

    // Mappeamento de serviço com base no caminho da página
    let serviceName = 'Geral';
    if (pathname.includes('ecommerce')) {
      serviceName = 'Aceleração de E-commerce';
    } else if (pathname.includes('marketplace')) {
      serviceName = 'Gestão de Marketplaces';
    } else if (pathname.includes('trafego') || pathname.includes('leads') || pathname.includes('crm')) {
      serviceName = 'Tráfego Pago';
    } else if (pathname.includes('afiliados')) {
      serviceName = 'Estratégia de Afiliados';
    } else if (pathname.includes('live-shop')) {
      serviceName = 'Live Shop';
    } else if (pathname.includes('consultoria')) {
      serviceName = 'Consultoria';
    } else if (pathname.includes('seo')) {
      serviceName = 'SEO';
    }

    const structuredMessage = `Modelo: ${leadData.modelo}. Verba: ${leadData.verba}. Estágio: ${leadData.estagio}. Gargalo: ${leadData.gargalo}. | UTMs: Source: ${utmSource}, Medium: ${utmMedium}, Campaign: ${utmCampaign}, Content: ${utmContent}, Term: ${utmTerm}`;

    // 5.4 Send lead data to CRM backend webhook API
    const webhookPayload = {
      name: leadData.nome,
      email: leadData.email,
      phone: leadData.whatsapp,
      company: leadData.modelo || 'Não informado',
      service: serviceName,
      message: structuredMessage,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      utm_term: utmTerm
    };

    try {
      fetch('https://crm-rm9.onrender.com/api/leads/webhook/site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookPayload),
        keepalive: true
      })
      .then(response => {
        if (!response.ok) throw new Error('CRM network error');
        return response.json();
      })
      .then(data => {
        console.log('Lead successfully sent to CRM Webhook in background:', data);
      })
      .catch(error => {
        console.error('Failed to send lead to CRM Webhook in background:', error);
      });
    } catch (fetchError) {
      console.warn('Failed to dispatch keepalive fetch:', fetchError);
    }

    // Trigger Meta Pixel and GA4 conversion events
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', {
        value: totalScore,
        currency: 'BRL',
        content_name: serviceName
      });
    }
    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', {
        'value': totalScore,
        'currency': 'BRL',
        'event_category': 'engagement',
        'event_label': serviceName
      });
    }

    // Redirect instantly without waiting for network response
    executeRedirect();

    function executeRedirect() {
      if (totalScore >= 15) {
        // TIER A -> WhatsApp redirection via obrigado.html
        const whatsappBaseUrl = 'https://api.whatsapp.com/send';
        const rm9Phone = '5541988467737';
        
        const messageText = `Olá RM9Brasil! Acabei de realizar a triagem de vendas no site.\n\n*Aqui estão os dados do meu negócio:*\n- *Nome:* ${leadData.nome}\n- *E-mail:* ${leadData.email}\n- *WhatsApp:* ${leadData.whatsapp}\n- *Modelo de Negócio:* ${leadData.modelo}\n- *Verba de Anúncios:* ${leadData.verba}\n- *Estágio Atual:* ${leadData.estagio}\n- *Maior Gargalo:* ${leadData.gargalo}\n\n*Pontuação da triagem:* ${totalScore}/20. Gostaria de agendar meu diagnóstico gratuito!`;
        
        const redirectUrl = `${whatsappBaseUrl}?phone=${rm9Phone}&text=${encodeURIComponent(messageText)}`;
        
        // Save in sessionStorage so obrigado.html can retrieve it
        sessionStorage.setItem('whatsappRedirectUrl', redirectUrl);
        window.location.href = `${pathPrefix}obrigado.html`;
      } else if (totalScore >= 10 && totalScore < 15) {
        // TIER B -> Agenda redirection
        window.location.href = `${pathPrefix}agendar.html`;
      } else {
        // TIER C -> Consultoria e Treinamentos redirection
        window.location.href = `${pathPrefix}consultoria/index.html`;
      }
    }
  }

  // --- MOBILE NAVIGATION BURGER TOGGLE ---
  const navContainer = document.querySelector('.nav-container');
  const navLinks = document.querySelector('.nav-links');
  const headerCta = document.getElementById('headerCta');
  
  if (navContainer && navLinks) {
    const toggleButton = document.createElement('button');
    toggleButton.className = 'mobile-nav-toggle';
    toggleButton.setAttribute('aria-label', 'Menu de Navegação');
    toggleButton.setAttribute('aria-expanded', 'false');
    
    for (let i = 0; i < 3; i++) {
      const line = document.createElement('span');
      line.className = 'hamburger-line';
      toggleButton.appendChild(line);
    }
    
    const headerCtaWrapper = headerCta ? headerCta.parentElement : navContainer.querySelector('div:last-child');
    if (headerCtaWrapper) {
      navContainer.insertBefore(toggleButton, headerCtaWrapper);
    } else {
      navContainer.appendChild(toggleButton);
    }
    
    toggleButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const expanded = toggleButton.getAttribute('aria-expanded') === 'true';
      toggleButton.setAttribute('aria-expanded', !expanded);
      navLinks.classList.toggle('active');
    });
    
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggleButton.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('active');
      });
    });
    
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !toggleButton.contains(e.target)) {
        toggleButton.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('active');
      }
    });

    // Add mobile diagnostic button inside drawer on mobile viewports
    if (!navLinks.querySelector('.mobile-drawer-cta')) {
      const crmLi = document.createElement('li');
      crmLi.className = 'mobile-drawer-cta';
      crmLi.style.marginTop = '1.5rem';
      crmLi.style.listStyle = 'none';
      
      const crmA = document.createElement('a');
      crmA.href = '#quiz';
      crmA.className = 'btn btn-primary js-open-quiz';
      crmA.textContent = 'Diagnóstico Grátis';
      crmA.style.width = '100%';
      crmA.style.textAlign = 'center';
      crmA.style.display = 'block';
      crmA.style.color = '#090B11';
      
      crmA.addEventListener('click', (e) => {
        if (dialog) {
          e.preventDefault();
          dialog.showModal();
          resetQuiz();
        }
        toggleButton.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('active');
      });
      
      crmLi.appendChild(crmA);
      navLinks.appendChild(crmLi);
    }
  }

  // --- AUTO-OPEN ON HASH #QUIZ & LINK INTERCEPTOR ---
  if (window.location.hash === '#quiz' && dialog) {
    setTimeout(() => {
      dialog.showModal();
      resetQuiz();
    }, 400);
  }

  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href === '#quiz' || (href && href.endsWith('#quiz'))) {
        if (dialog) {
          e.preventDefault();
          dialog.showModal();
          resetQuiz();
        } else {
          e.preventDefault();
          let redirectPath = 'index.html#quiz';
          const pathname = window.location.pathname;
          if (
            pathname.includes('/sp/') || 
            pathname.includes('/curitiba/') || 
            pathname.includes('/agencia-especializada-em-ecommerce/') || 
            pathname.includes('/agencia-gestao-marketplace/') || 
            pathname.includes('/gestao-de-trafego-pago/') || 
            pathname.includes('/agencia-especializada-em-seo-para-e-commerce/') ||
            pathname.includes('/estrategia-de-afiliados/') ||
            pathname.includes('/live-shop/') ||
            pathname.includes('/consultoria/') ||
            pathname.includes('/blog/')
          ) {
            redirectPath = '../index.html#quiz';
          }
          window.location.href = redirectPath;
        }
      }
    }
  });

  // --- DYNAMIC FLOATING WHATSAPP BUTTON ---
  if (!document.querySelector('.whatsapp-float')) {
    const waLink = document.createElement('a');
    waLink.href = 'https://api.whatsapp.com/send?phone=5541988467737&text=Ol%C3%A1!%20Gostaria%20de%20falar%20com%20um%20especialista%20de%20Growth%20da%20RM9.';
    waLink.className = 'whatsapp-float';
    waLink.target = '_blank';
    waLink.rel = 'noopener noreferrer';
    waLink.setAttribute('aria-label', 'Falar no WhatsApp');
    waLink.innerHTML = `
      <svg viewBox="0 0 24 24" class="whatsapp-icon">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.498 1.452 5.424 1.453 5.513 0 9.997-4.485 10.001-10.003.002-2.673-1.037-5.186-2.926-7.078C17.258 1.636 14.75 1.597 12.01 1.597c-5.518 0-10.003 4.484-10.007 10.003-.001 1.93.504 3.812 1.465 5.418L2.43 21.842l5.04-1.32c-1.52.825-2.228 1.632-2.228 1.632zM17.487 14.39c-.3-.15-1.782-.88-2.057-.98-.275-.1-.475-.15-.675.15-.2.3-.775 1-.95 1.2-.175.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.485-.89-.795-1.49-1.777-1.665-2.078-.175-.3-.02-.463.13-.612.134-.133.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.589-.493-.51-.675-.52-.175-.01-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.224 5.11 4.524.714.31 1.27.494 1.703.63.717.228 1.368.196 1.883.12.574-.085 1.782-.73 2.032-1.43.25-.7.25-1.3.175-1.43-.075-.13-.275-.205-.575-.355z"/>
      </svg>
    `;
    document.body.appendChild(waLink);
  }

  // --- CONTACT FORM SUBMISSION TO CRM ---
  const contactForm = document.getElementById('contactForm');
  const contactStatus = document.getElementById('contactFormStatus');
  const contactSubmitBtn = document.getElementById('contactSubmitBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nomeInput = document.getElementById('contactNome');
      const emailInput = document.getElementById('contactEmail');
      const whatsappInput = document.getElementById('contactWhatsapp');
      const mensagemInput = document.getElementById('contactMensagem');
      
      if (!nomeInput || !emailInput || !whatsappInput || !mensagemInput) return;
      
      // Basic validation
      if (nomeInput.value.trim() === '' || emailInput.value.trim() === '' || whatsappInput.value.trim() === '' || mensagemInput.value.trim() === '') {
        alert('Por favor, preencha todos os campos.');
        return;
      }
      
      // Disable submit button during fetch
      if (contactSubmitBtn) {
        contactSubmitBtn.disabled = true;
        contactSubmitBtn.textContent = 'Enviando...';
      }
      
      if (contactStatus) {
        contactStatus.style.display = 'block';
        contactStatus.style.color = 'var(--text-secondary)';
        contactStatus.textContent = 'Processando sua mensagem...';
      }
      
      const crmLeadPayload = {
        name: nomeInput.value.trim(),
        email: emailInput.value.trim(),
        phone: whatsappInput.value.trim(),
        company: 'Não informado',
        source: 'site_contato',
        initial_message: mensagemInput.value.trim(),
        status: 'Lead Novo'
      };
      
      fetch('https://crm-rm9.onrender.com/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(crmLeadPayload)
      })
      .then(response => {
        if (!response.ok) throw new Error('CRM network error');
        return response.json();
      })
      .then(data => {
        console.log('Lead successfully sent to CRM:', data);
        if (contactStatus) {
          contactStatus.style.color = '#25d366'; // Green
          contactStatus.textContent = 'Mensagem enviada com sucesso! Entraremos em contato em breve.';
        }
        contactForm.reset();
      })
      .catch(error => {
        console.error('Failed to send lead to CRM:', error);
        if (contactStatus) {
          contactStatus.style.color = 'var(--primary)'; // Red
          contactStatus.textContent = 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente ou fale conosco no WhatsApp.';
        }
      })
      .finally(() => {
        if (contactSubmitBtn) {
          contactSubmitBtn.disabled = false;
          contactSubmitBtn.textContent = 'Enviar Mensagem';
        }
      });
    });
  }
});
