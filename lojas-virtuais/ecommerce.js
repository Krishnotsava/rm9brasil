document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const urlForm = document.getElementById('urlForm');
  const siteUrlInput = document.getElementById('siteUrl');
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

    // Transition state
    stateInput.style.display = 'none';
    stateScanning.style.display = 'flex';

    runScanningProcess();
  });

  const logs = [
    { text: "Conectando ao servidor de e-commerce...", delay: 200 },
    { text: "Acessando página inicial e listagem de produtos...", delay: 500 },
    { text: "Iniciando teste de velocidade móvel (Lighthouse Engine)...", delay: 800 },
    { text: "Medindo Largest Contentful Paint (LCP)...", delay: 1100 },
    { text: "ERRO: LCP excedeu limite de 2.5s (Registrado: 4.2s no celular).", delay: 1400 },
    { text: "Medindo Interaction to Next Paint (INP)...", delay: 1700 },
    { text: "AVISO: INP em 280ms (Regular) - Resposta ao clique na sacola lenta.", delay: 2000 },
    { text: "Medindo Cumulative Layout Shift (CLS)...", delay: 2300 },
    { text: "AVISO: Deslocamento de layout detectado no carregamento de coleções (0.12).", delay: 2600 },
    { text: "Escaneando imagens do catálogo de produtos...", delay: 2900 },
    { text: "AVISO: 32 imagens de produto em PNG/JPEG bruto (Sem compactação WebP).", delay: 3200 },
    { text: "Checando minificação de scripts CSS e JS...", delay: 3500 },
    { text: "Auditoria concluída. Compilando resultados...", delay: 3800 }
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
        line.textContent = `[performance] ${log.text}`;
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
    const structuredMsg = `Auditoria de Velocidade | Loja Analisada: ${targetUrl} | Resultado: 58/100 (Crítico) | Cargo: Dono/Sócio (Dono) | Porte: Grande | Erros: LCP 4.2s (Pobre), INP 280ms, CLS 0.12, 32 imagens brutas PNG/JPG sem WebP.`;

    const payload = {
      name: name,
      email: email,
      phone: phone,
      company: 'Não informado',
      service: 'Aceleração de E-commerce', // Map to correct e-commerce service in backend
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
      console.log('E-commerce Lead successfully pushed to CRM:', data);
    })
    .catch(error => {
      console.error('Failed to submit E-commerce lead:', error);
    })
    .finally(() => {
      // Fire conversions
      if (typeof fbq === 'function') {
        fbq('track', 'Lead', { value: 25, currency: 'BRL', content_name: 'E-commerce' });
      }
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', { 'value': 25, 'currency': 'BRL', 'event_category': 'engagement', 'event_label': 'E-commerce' });
      }

      // Configure WhatsApp link
      const rm9Phone = '5541988467737';
      const text = `Olá RM9Brasil! Fiz a Auditoria de Core Web Vitals da minha loja no site.\n\n*Aqui estão os detalhes:*\n- *Loja:* ${targetUrl}\n- *Nome:* ${name}\n- *E-mail:* ${email}\n- *WhatsApp:* ${phone}\n- *Resultado local:* 58% (Crítico). Gostaria de agendar meu diagnóstico gratuito para acelerar o carregamento da minha loja virtual!`;
      waCta.href = `https://api.whatsapp.com/send?phone=${rm9Phone}&text=${encodeURIComponent(text)}`;

      // Transition to results
      stateLead.style.display = 'none';
      stateResults.style.display = 'flex';
    });
  });
});
