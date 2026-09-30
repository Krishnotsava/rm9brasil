document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const urlForm = document.getElementById('urlForm');
  const siteUrlInput = document.getElementById('siteUrl');
  const checkSpeed = document.getElementById('checkSpeed');
  const checkSocial = document.getElementById('checkSocial');
  const checkForm = document.getElementById('checkForm');
  
  const stateInput = document.getElementById('stateInput');
  const stateScanning = document.getElementById('stateScanning');
  const stateLead = document.getElementById('stateLead');
  const stateResults = document.getElementById('stateResults');
  
  const scanStatus = document.getElementById('scanStatus');
  const scanPercentage = document.getElementById('scanPercentage');
  const scanBar = document.getElementById('scanBar');
  const scanConsole = document.getElementById('scanConsole');
  
  const leadForm = document.getElementById('leadForm');
  const leadNome = document.getElementById('leadNome');
  const leadEmail = document.getElementById('leadEmail');
  const leadPhone = document.getElementById('leadPhone');
  const leadSubmitBtn = document.getElementById('leadSubmitBtn');
  const leadStatusMsg = document.getElementById('leadStatusMsg');
  
  const waCta = document.getElementById('waCta');

  let targetUrl = '';
  let speedValue = false;
  let socialValue = false;
  let formValue = false;

  // 1. PHONE FIELD MASK
  leadPhone.addEventListener('input', (e) => {
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
    leadPhone.classList.remove('invalid');
  });

  // Clear inputs errors on type
  leadNome.addEventListener('input', () => leadNome.classList.remove('invalid'));
  leadEmail.addEventListener('input', () => leadEmail.classList.remove('invalid'));

  // 2. RUN CONSOLE SIMULATION
  urlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    targetUrl = siteUrlInput.value.trim();
    if (!targetUrl) return;

    speedValue = checkSpeed.checked;
    socialValue = checkSocial.checked;
    formValue = checkForm.checked;

    // Transition state
    stateInput.style.display = 'none';
    stateScanning.style.display = 'flex';

    runScanningProcess();
  });

  const logs = [
    { text: "Conectando ao servidor da Landing Page...", delay: 200 },
    { text: "Acessando folha de estilos e estrutura HTML...", delay: 500 },
    { text: "Iniciando avaliação de velocidade (Rendering Mobile)...", delay: 800 },
    { text: "Analisando estrutura de Copywriting e headlines de topo...", delay: 1100 },
    { text: "AVISO: Título institucional demais (Falta de foco comercial claro).", delay: 1400 },
    { text: "Avaliando seções de credibilidade e depoimentos...", delay: 1700 },
    { text: "AVISO: Depoimentos posicionados muito abaixo no rodapé.", delay: 2000 },
    { text: "Testando formulários e facilidade de clique no celular...", delay: 2300 },
    { text: "AVISO: Excesso de campos no formulário (Fricção detectada).", delay: 2600 },
    { text: "Cruzando respostas do diagnóstico de usabilidade comercial...", delay: 2900 },
    { text: "Analisando scripts de rastreamento (Pixel/Analytics)...", delay: 3200 },
    { text: "Compilando taxa de conversão estimada...", delay: 3500 },
    { text: "Auditoria de CRO finalizada.", delay: 3800 }
  ];

  function runScanningProcess() {
    let progress = 0;
    const duration = 4000; // 4 seconds
    const intervalTime = 50;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    // Run percentage bar
    const progressInterval = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
      }
      scanPercentage.textContent = `${Math.round(progress)}%`;
      scanBar.style.width = `${progress}%`;
    }, intervalTime);

    // Push log messages
    logs.forEach(log => {
      setTimeout(() => {
        scanStatus.textContent = log.text;
        
        const line = document.createElement('div');
        if (log.text.includes('ERRO')) {
          line.style.color = 'var(--primary)';
        } else if (log.text.includes('AVISO')) {
          line.style.color = 'var(--secondary)';
        } else {
          line.style.color = 'var(--text-secondary)';
        }
        line.textContent = `[cro-audit] ${log.text}`;
        scanConsole.appendChild(line);
        scanConsole.scrollTop = scanConsole.scrollHeight;
      }, log.delay);
    });

    // Complete scan transition to Lead Form
    setTimeout(() => {
      stateScanning.style.display = 'none';
      stateLead.style.display = 'flex';
    }, duration + 300);
  }

  // 3. LEAD SUBMISSION TO CRM
  leadForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = leadNome.value.trim();
    const email = leadEmail.value.trim();
    const phone = leadPhone.value.trim();

    // Validation
    let valid = true;
    if (name.length < 2) {
      leadNome.classList.add('invalid');
      valid = false;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      leadEmail.classList.add('invalid');
      valid = false;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      leadPhone.classList.add('invalid');
      valid = false;
    }

    if (!valid) return;

    // Loading State
    leadSubmitBtn.disabled = true;
    leadSubmitBtn.textContent = 'Enviando Relatório...';
    leadStatusMsg.style.display = 'block';
    leadStatusMsg.textContent = 'Gravando dados de auditoria comercial...';

    // Capture UTMs
    const utmSource = sessionStorage.getItem('utm_source') || 'organico';
    const utmMedium = sessionStorage.getItem('utm_medium') || 'web';
    const utmCampaign = sessionStorage.getItem('utm_campaign') || 'institucional';
    const utmContent = sessionStorage.getItem('utm_content') || '';
    const utmTerm = sessionStorage.getItem('utm_term') || '';

    // Create structured message mapping CRM criteria (Dono, Grande, Tráfego/Ads)
    const structuredMsg = `Auditoria de CRO | LP Analisada: ${targetUrl} | Resultado: 64/100 (Regular) | Cargo: Pequeno Proprietário | Porte: Pequeno | Respostas: VelocidadeOK: ${speedValue}, ProvaSocial: ${socialValue}, FormSimples: ${formValue} | Erros: Headline institucional, Depoimentos mal posicionados, Fricção de captura, lentidão mobile.`;

    const payload = {
      name: name,
      email: email,
      phone: phone,
      company: 'Não informado',
      service: 'Tráfego Pago', // LP creation fits under Tráfego Pago / funnel service in backend
      message: structuredMsg,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      utm_term: utmTerm
    };

    fetch('https://crm-rm9.onrender.com/api/leads/webhook/site', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      keepalive: true
    })
    .then(response => {
      if (!response.ok) throw new Error('CRM failure');
      return response.json();
    })
    .then(data => {
      console.log('LP CRO Lead successfully pushed to CRM:', data);
    })
    .catch(error => {
      console.error('Failed to submit LP lead:', error);
    })
    .finally(() => {
      // Fire conversions
      if (typeof fbq === 'function') {
        fbq('track', 'Lead', { value: 15, currency: 'BRL', content_name: 'Landing Page' });
      }
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', { 'value': 15, 'currency': 'BRL', 'event_category': 'engagement', 'event_label': 'Landing Page' });
      }

      // Configure WhatsApp link
      const rm9Phone = '5541988467737';
      const text = `Olá RM9Brasil! Fiz a Auditoria de CRO da minha Landing Page no site.\n\n*Aqui estão os detalhes:*\n- *Página:* ${targetUrl}\n- *Nome:* ${name}\n- *E-mail:* ${email}\n- *WhatsApp:* ${phone}\n- *Resultado local:* 64% (Mediana). Gostaria de agendar meu diagnóstico gratuito para otimizar os gatilhos e a copy da minha landing page!`;
      waCta.href = `https://api.whatsapp.com/send?phone=${rm9Phone}&text=${encodeURIComponent(text)}`;

      // Transition to results
      stateLead.style.display = 'none';
      stateResults.style.display = 'flex';
    });
  });
});
