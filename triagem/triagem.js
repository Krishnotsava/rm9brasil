// --- DYNAMIC META PIXEL INITIALIZATION ---
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

fbq('init', '3568497506704754');
fbq('track', 'PageView');

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE AND DATA ---
  const leadData = {
    name: '',
    email: '',
    phone: '',
    company: '', // Modelo de Negócio
    cargo: '',
    faturamento: '',
    service: '', // Prioridade / Objetivo
    utm_source: 'organico',
    utm_medium: 'web',
    utm_campaign: 'institucional',
    utm_content: '',
    utm_term: ''
  };

  let currentStep = 0;
  let localScore = 0;

  // --- CAPTURE UTMS ON LOAD ---
  const urlParams = new URLSearchParams(window.location.search);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  
  // Try loading from URL parameters first
  utmKeys.forEach(k => {
    const val = urlParams.get(k);
    if (val) {
      sessionStorage.setItem(k, val.toLowerCase().trim());
    }
  });

  // Hydrate leadData from sessionStorage
  leadData.utm_source = sessionStorage.getItem('utm_source') || 'organico';
  leadData.utm_medium = sessionStorage.getItem('utm_medium') || 'web';
  leadData.utm_campaign = sessionStorage.getItem('utm_campaign') || 'institucional';
  leadData.utm_content = sessionStorage.getItem('utm_content') || '';
  leadData.utm_term = sessionStorage.getItem('utm_term') || '';

  // --- CONFIGURATION OF CONVERSATIONAL STEPS ---
  const stepsConfig = [
    {
      id: 'welcome',
      type: 'options',
      botMsg: () => "Olá! Seja bem-vindo à RM9 Brasil. Sou o especialista virtual de growth e vou te guiar em um diagnóstico rápido de 2 minutos para identificar oportunidades de escala no seu negócio. Vamos começar?",
      options: [
        { label: "Começar Diagnóstico", value: "start", score: 0 }
      ]
    },
    {
      id: 'modelo',
      type: 'options',
      botMsg: () => "Excelente! Para começarmos, qual é o modelo de negócio ou serviço principal da sua empresa hoje?",
      property: 'company',
      options: [
        { label: "🛒 E-commerce / Loja Virtual", value: "E-commerce", score: 4 },
        { label: "📍 Negócio Local / Serviços", value: "Negócio Local", score: 4 },
        { label: "🚀 SaaS / Infoproduto / Lançamentos", value: "SaaS/Infoproduto", score: 4 },
        { label: "💡 Outro", value: "Outro", score: 2 }
      ]
    },
    {
      id: 'cargo',
      type: 'options',
      botMsg: () => "Perfeito. E qual é o seu papel ou cargo na empresa?",
      property: 'cargo',
      options: [
        { label: "🔑 Dono / Sócio (Decisor)", value: "Dono/Sócio (Dono)", score: 5 },
        { label: "📈 Diretor / Gerente de Marketing", value: "Diretor/Gerente (Gerente)", score: 4 },
        { label: "🛠️ Analista / Operacional", value: "Analista/Operacional", score: 2 },
        { label: "📌 Outro", value: "Outro", score: 1 }
      ]
    },
    {
      id: 'faturamento',
      type: 'options',
      botMsg: () => "Legal. Qual é o faturamento mensal atual do seu negócio hoje?",
      property: 'faturamento',
      options: [
        { label: "🌱 Até R$ 10.000 / mês", value: "Até R$ 10k/mês (Pequeno)", score: 1 },
        { label: "🌿 Entre R$ 10k e R$ 50k / mês", value: "R$ 10k a R$ 50k/mês (Pequeno)", score: 3 },
        { label: "🌳 Entre R$ 50k e R$ 100k / mês", value: "R$ 50k a R$ 100k/mês (Médio)", score: 4 },
        { label: "⚡ Acima de R$ 100k / mês", value: "Acima de R$ 100k/mês (Grande)", score: 5 }
      ]
    },
    {
      id: 'prioridade',
      type: 'options',
      botMsg: () => "Entendi. Qual é a sua maior prioridade ou canal que deseja estruturar no momento?",
      property: 'service',
      options: [
        { label: "🎯 Tráfego Pago (Google & Meta Ads)", value: "Tráfego Pago", score: 5 },
        { label: "🔍 SEO e Tráfego Orgânico", value: "SEO para E-commerce", score: 3 },
        { label: "📊 Estruturar CRM & Funil de Vendas", value: "Tráfego Pago", score: 4 }, // Map to Tráfego Pago service in backend
        { label: "💥 Assessoria Completa de Growth", value: "Aceleração de E-commerce", score: 4 }
      ]
    },
    {
      id: 'nome',
      type: 'text',
      botMsg: () => "Ótimo. Para finalizarmos e gerarmos seu diagnóstico personalizado, qual é o seu primeiro nome?",
      property: 'name',
      placeholder: "Digite seu nome...",
      inputMode: "text",
      autoComplete: "given-name",
      validate: (val) => val.trim().length >= 2 ? null : "Por favor, digite seu nome completo."
    },
    {
      id: 'email',
      type: 'text',
      botMsg: () => `Muito prazer, ${leadData.name}! Qual é o seu melhor e-mail profissional?`,
      property: 'email',
      placeholder: "Digite seu melhor e-mail...",
      inputMode: "email",
      autoComplete: "email",
      validate: (val) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(val.trim()) ? null : "Insira um e-mail corporativo ou pessoal válido.";
      }
    },
    {
      id: 'whatsapp',
      type: 'text',
      botMsg: () => "Show! E por último, qual é o seu WhatsApp com DDD para contato direto?",
      property: 'phone',
      placeholder: "(00) 00000-0000",
      inputMode: "tel",
      autoComplete: "tel",
      validate: (val) => {
        const clean = val.replace(/\D/g, '');
        return clean.length >= 10 && clean.length <= 11 ? null : "Insira um WhatsApp válido com DDD (10 ou 11 dígitos).";
      }
    }
  ];

  // --- DOM ELEMENTS ---
  const chatMessages = document.getElementById('chatMessages');
  const chatControls = document.getElementById('chatControls');
  const progressBar = document.getElementById('progressBar');
  const chatScreen = document.getElementById('chatScreen');

  // --- SYSTEM FUNCTIONS ---
  
  // Smooth scroll helper
  function scrollToBottom() {
    setTimeout(() => {
      chatScreen.scrollTo({
        top: chatScreen.scrollHeight,
        behavior: 'smooth'
      });
    }, 50);
  }

  // Create loading indicator
  function createTypingIndicator() {
    const row = document.createElement('div');
    row.className = 'message-row bot';
    row.id = 'typingIndicator';
    row.innerHTML = `
      <div class="avatar-badge">RM</div>
      <div class="typing-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    chatMessages.appendChild(row);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Render Bot Message with typing simulation
  function renderBotMessage(text, callback) {
    createTypingIndicator();
    
    // Simulate typing delay based on message length (min 600ms, max 1200ms)
    const delay = Math.min(1200, Math.max(600, text.length * 8));
    
    setTimeout(() => {
      removeTypingIndicator();
      
      const row = document.createElement('div');
      row.className = 'message-row bot';
      row.innerHTML = `
        <div class="avatar-badge">RM</div>
        <div class="bubble">${text}</div>
      `;
      chatMessages.appendChild(row);
      scrollToBottom();
      
      if (callback) callback();
    }, delay);
  }

  // Render User Message bubble
  function renderUserMessage(text) {
    const row = document.createElement('div');
    row.className = 'message-row user';
    row.innerHTML = `
      <div class="bubble">${text}</div>
    `;
    chatMessages.appendChild(row);
    scrollToBottom();
  }

  // Render controls for the current step
  function renderControls() {
    const config = stepsConfig[currentStep];
    chatControls.innerHTML = ''; // Clear previous controls
    
    // Calculate progress percent based on total questions (excluding welcome step)
    const totalQuestions = stepsConfig.length - 1;
    const answeredCount = Math.max(0, currentStep);
    const progressPercent = (answeredCount / totalQuestions) * 100;
    progressBar.style.width = `${progressPercent}%`;

    if (config.type === 'options') {
      const optionsList = document.createElement('div');
      optionsList.className = 'options-list';
      
      config.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt.label;
        btn.type = 'button';
        btn.addEventListener('click', () => {
          handleOptionSelection(opt);
        });
        optionsList.appendChild(btn);
      });
      
      chatControls.appendChild(optionsList);
      scrollToBottom();
    } else if (config.type === 'text') {
      const formGroup = document.createElement('div');
      formGroup.className = 'input-form-group';
      
      const label = document.createElement('label');
      label.className = 'input-label';
      label.setAttribute('for', `input_${config.id}`);
      label.textContent = config.id === 'phone' ? 'WhatsApp' : config.id;
      
      const inputRow = document.createElement('div');
      inputRow.className = 'input-row';
      
      const input = document.createElement('input');
      input.type = config.id === 'email' ? 'email' : (config.id === 'phone' ? 'tel' : 'text');
      input.id = `input_${config.id}`;
      input.className = 'chat-input';
      input.placeholder = config.placeholder || '';
      input.inputMode = config.inputMode || 'text';
      input.autocomplete = config.autoComplete || 'off';
      input.required = true;
      
      // Auto focus focus state
      setTimeout(() => input.focus(), 150);

      const errorSpan = document.createElement('span');
      errorSpan.className = 'error-text';
      errorSpan.id = `error_${config.id}`;

      // Mask phone input
      if (config.id === 'whatsapp') {
        input.addEventListener('input', (e) => {
          // Format WhatsApp to (XX) XXXXX-XXXX
          let value = e.target.value.replace(/\D/g, '');
          if (value.length > 11) value = value.slice(0, 11);
          
          if (value.length > 10) {
            e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
          } else if (value.length > 6) {
            e.target.value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
          } else if (value.length > 2) {
            e.target.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
          } else if (value.length > 0) {
            e.target.value = `(${value}`;
          } else {
            e.target.value = '';
          }
          
          // Clear error during typing
          input.classList.remove('invalid');
          errorSpan.style.display = 'none';
        });
      } else {
        input.addEventListener('input', () => {
          input.classList.remove('invalid');
          errorSpan.style.display = 'none';
        });
      }

      const sendBtn = document.createElement('button');
      sendBtn.type = 'submit';
      sendBtn.className = 'send-btn';
      sendBtn.setAttribute('aria-label', 'Enviar resposta');
      sendBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      `;

      // Form wrapper to handle submission
      const form = document.createElement('form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleTextSubmission(input, errorSpan);
      });

      inputRow.appendChild(input);
      inputRow.appendChild(sendBtn);
      
      formGroup.appendChild(label);
      formGroup.appendChild(inputRow);
      formGroup.appendChild(errorSpan);
      
      form.appendChild(formGroup);
      chatControls.appendChild(form);
      scrollToBottom();
    }
  }

  // Option selection handler
  function handleOptionSelection(opt) {
    const config = stepsConfig[currentStep];
    
    // Render user response bubble
    renderUserMessage(opt.label);
    
    // Save points and data
    localScore += opt.score;
    if (config.property) {
      leadData[config.property] = opt.value;
    }
    
    // Save cargo or details locally
    if (config.id === 'cargo') {
      leadData.cargo = opt.value;
    }
    if (config.id === 'faturamento') {
      leadData.faturamento = opt.value;
    }

    // Go to next step
    advanceWorkflow();
  }

  // Text submit handler
  function handleTextSubmission(input, errorSpan) {
    const config = stepsConfig[currentStep];
    const rawVal = input.value;
    const errorMsg = config.validate(rawVal);
    
    if (errorMsg) {
      input.classList.add('invalid');
      errorSpan.textContent = errorMsg;
      errorSpan.style.display = 'block';
      input.focus();
      return;
    }
    
    // Render user message bubble
    renderUserMessage(rawVal);
    
    // Save data
    if (config.property) {
      leadData[config.property] = rawVal.trim();
    }
    
    // Go to next step
    advanceWorkflow();
  }

  // Work state controller
  function advanceWorkflow() {
    currentStep++;
    
    if (currentStep < stepsConfig.length) {
      // Mute user controls during typing
      chatControls.innerHTML = '';
      
      const nextConfig = stepsConfig[currentStep];
      const botText = nextConfig.botMsg();
      
      renderBotMessage(botText, () => {
        renderControls();
      });
    } else {
      // Completed, push payload to CRM
      submitLeadToCRM();
    }
  }

  // --- CRM SUBMISSION AND REDIRECTS ---
  function submitLeadToCRM() {
    // Inject loading overlay in the container
    chatControls.innerHTML = '';
    
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'loading-screen';
    loadingScreen.innerHTML = `
      <div class="spinner"></div>
      <div class="loading-title">Gerando Diagnóstico...</div>
      <div class="loading-subtitle">Nossa IA está qualificando o seu perfil de Growth comercial. Só um instante!</div>
    `;
    document.querySelector('.app-container').appendChild(loadingScreen);
    
    // Activate spinner fade-in
    setTimeout(() => loadingScreen.classList.add('active'), 50);

    // Format Structured message incorporating scoring keywords
    // msg.includes('dono') matches for role, msg.includes('grande') / 'médio' matches size, msg.includes('tráfego') matches service
    let companySize = 'Pequeno';
    if (leadData.faturamento.includes('Grande')) {
      companySize = 'Grande';
    } else if (leadData.faturamento.includes('Médio')) {
      companySize = 'Médio';
    }

    const formattedMessage = `Diagnóstico Conversacional | Modelo: ${leadData.company} | Cargo: ${leadData.cargo} | Faturamento: ${leadData.faturamento} | Prioridade: ${leadData.service} | Porte: ${companySize}`;

    const crmPayload = {
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      company: leadData.company,
      service: leadData.service,
      message: formattedMessage,
      utm_source: leadData.utm_source,
      utm_medium: leadData.utm_medium,
      utm_campaign: leadData.utm_campaign,
      utm_content: leadData.utm_content,
      utm_term: leadData.utm_term
    };

    // Send lead to CRM in the background (fire and forget)
    try {
      fetch('https://crm-rm9.onrender.com/api/leads/webhook/site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(crmPayload),
        keepalive: true
      })
      .then(response => response.json())
      .then(data => console.log('Lead pushed to CRM in background:', data))
      .catch(err => console.error('CRM webhook error in background:', err));
    } catch (fetchError) {
      console.warn('Failed to dispatch keepalive fetch:', fetchError);
    }

    // Trigger Meta Pixel and GA4 conversion events instantly
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', {
        value: localScore,
        currency: 'BRL',
        content_name: leadData.service
      });
    }
    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', {
        'value': localScore,
        'currency': 'BRL',
        'event_category': 'engagement',
        'event_label': leadData.service
      });
    }

    // Redirect instantly to avoid waiting for network and improve UX
    setTimeout(() => {
      executeTierRouting();
    }, 150);
  }

  function executeTierRouting() {
    // Path prefix: since /triagem/ is a directory index.html, we need '../' to reach assets at root level
    const pathPrefix = '../';

    // Tier criteria logic
    // Local score: max is 19.
    // Tier A (High qualification): Score >= 14
    // Tier B (Medium): Score >= 9 and < 14
    // Tier C (Low): Score < 9
    
    if (localScore >= 14) {
      // Redirect to WhatsApp via obrigado.html to track conversion Pixel properly
      const rm9Phone = '5541988467737';
      const textMsg = `Olá RM9Brasil! Fiz o diagnóstico de vendas e fui qualificado.\n\n*Meus Dados:*\n- *Nome:* ${leadData.name}\n- *E-mail:* ${leadData.email}\n- *WhatsApp:* ${leadData.phone}\n- *Modelo:* ${leadData.company}\n- *Cargo:* ${leadData.cargo}\n- *Faturamento:* ${leadData.faturamento}\n- *Objetivo:* ${leadData.service}\n\n*Pontuação do teste:* ${localScore}/19. Quero agendar meu diagnóstico gratuito!`;
      
      const whatsappRedirect = `https://api.whatsapp.com/send?phone=${rm9Phone}&text=${encodeURIComponent(textMsg)}`;
      
      // Store in sessionStorage so obrigado.html can capture and redirect
      sessionStorage.setItem('whatsappRedirectUrl', whatsappRedirect);
      window.location.href = `${pathPrefix}obrigado.html`;
    } else if (localScore >= 9) {
      // Tier B: redirect to booking page
      window.location.href = `${pathPrefix}agendar.html`;
    } else {
      // Tier C: redirect to consultoria page
      window.location.href = `${pathPrefix}consultoria/index.html`;
    }
  }

  // --- INITIALIZE CONVERSATION ---
  // Load the first greeting message
  const welcomeConfig = stepsConfig[0];
  renderBotMessage(welcomeConfig.botMsg(), () => {
    renderControls();
  });
});
