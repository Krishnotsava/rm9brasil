// CONFIGURAÇÃO DO FIREBASE
// IMPORTANTE: Chaves de conexão do projeto rm9-portal-cliente
const firebaseConfig = {
  apiKey: "AIzaSyDMmdUDMwh-6-JW83mB87qs0oTT8rAgNcw",
  authDomain: "rm9-portal-cliente.firebaseapp.com",
  projectId: "rm9-portal-cliente",
  storageBucket: "rm9-portal-cliente.firebasestorage.app",
  messagingSenderId: "886696118794",
  appId: "1:886696118794:web:9661493431457cf05fadf3",
  measurementId: "G-92ZJKZZRHY"
};

// Inicializa o Firebase (apenas se a configuração padrão tiver sido alterada)
const isConfigured = firebaseConfig.apiKey !== "SUA_API_KEY_AQUI";

if (isConfigured) {
  firebase.initializeApp(firebaseConfig);
} else {
  console.info("Firebase não configurado. Entre com o email 'demo@rm9.com.br' e senha 'demo' para testar offline.");
}

document.addEventListener('DOMContentLoaded', () => {
  // ELEMENTOS DO DOM
  const loginPage = document.getElementById('loginPage');
  const dashboardPage = document.getElementById('dashboardPage');
  
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const btnLogin = document.getElementById('btnLogin');
  const loginError = document.getElementById('loginError');
  
  const clientLogo = document.getElementById('clientLogo');
  const welcomeText = document.querySelector('.welcome-text');
  const btnLogout = document.getElementById('btnLogout');
  
  const dashLoading = document.getElementById('dashLoading');
  const iframeReport = document.getElementById('iframeReport');

  // Mapeamento de erros do Firebase para Português
  const getFriendlyErrorMessage = (code) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'O endereço de e-mail inserido é inválido.';
      case 'auth/user-disabled':
        return 'Esta conta de usuário foi desativada.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-mail ou senha incorretos. Por favor, tente novamente.';
      case 'auth/too-many-requests':
        return 'Múltiplas tentativas incorretas. Acesso bloqueado temporariamente. Tente mais tarde.';
      case 'auth/network-request-failed':
        return 'Falha na conexão com a rede. Verifique seu acesso à internet.';
      default:
        return 'Ocorreu um erro ao realizar o login. Tente novamente.';
    }
  };

  // 1. MONITORAMENTO DO ESTADO DE AUTENTICAÇÃO (DEMO OU FIREBASE)
  if (sessionStorage.getItem('demo_session') === 'active') {
    // Carrega o modo demonstração se o usuário já estiver logado na sessão atual
    loadDemoDashboard();
  } else if (isConfigured) {
    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged((user) => {
      if (user) {
        showDashboard(user, db);
      } else {
        showLoginPage();
      }
    });
  } else {
    showLoginPage();
  }

  // 2. FUNÇÃO PARA CARREGAR O DASHBOARD DO FIREBASE (PRODUÇÃO)
  const showDashboard = (user, db) => {
    loginPage.style.display = 'none';
    dashboardPage.style.display = 'flex';
    
    dashLoading.style.display = 'flex';
    iframeReport.style.display = 'none';
    iframeReport.src = '';
    clientLogo.style.display = 'none';
    welcomeText.textContent = 'Carregando painel...';

    db.collection('clientes').doc(user.uid).get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data();
          welcomeText.textContent = `Performance | ${data.nome_cliente}`;
          
          if (data.logo_cliente_url) {
            clientLogo.src = data.logo_cliente_url;
            clientLogo.style.display = 'block';
          }
          
          if (data.looker_studio_url) {
            iframeReport.src = data.looker_studio_url;
            iframeReport.style.display = 'block';
          } else {
            welcomeText.textContent = 'Erro: Painel não configurado.';
            dashLoading.innerHTML = '<p style="color: var(--primary);">Nenhum relatório foi associado a esta conta.</p>';
            return;
          }
          dashLoading.style.display = 'none';
        } else {
          console.error("Configurações do cliente não encontradas para o UID:", user.uid);
          welcomeText.textContent = 'Acesso não configurado';
          dashLoading.innerHTML = `
            <p style="color: var(--primary); font-weight: bold;">Configuração ausente no banco de dados.</p>
            <p style="font-size: 0.9rem; color: var(--text-secondary); text-align: center; max-width: 320px;">
              Sua conta foi criada, mas nenhum relatório Looker Studio foi associado ao seu perfil. Fale com a RM9.
            </p>
          `;
        }
      })
      .catch((error) => {
        console.error("Erro ao ler dados do Firestore:", error);
        welcomeText.textContent = 'Erro de sincronização';
        dashLoading.innerHTML = `
          <p style="color: var(--primary);">Erro ao carregar dados do servidor.</p>
          <p style="font-size: 0.85rem; color: var(--text-muted);">${error.message}</p>
        `;
      });
  };

  // 3. FUNÇÃO PARA CARREGAR O MODO DEMO OFFLINE
  function loadDemoDashboard() {
    loginPage.style.display = 'none';
    dashboardPage.style.display = 'flex';
    dashLoading.style.display = 'flex';
    iframeReport.style.display = 'none';
    
    welcomeText.textContent = "Performance | Cliente Demo (RM9)";
    clientLogo.src = "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png";
    clientLogo.style.display = 'block';
    
    // Iframe público do Looker Studio para demonstração
    iframeReport.src = "https://lookerstudio.google.com/embed/reporting/0B5OJ1lJ2495-M3ZDRHpxM2tEalk/page/1M";
    iframeReport.style.display = 'block';
    
    setTimeout(() => {
      dashLoading.style.display = 'none';
    }, 500);
  }

  // 4. FUNÇÃO PARA EXIBIR A TELA DE LOGIN
  function showLoginPage() {
    dashboardPage.style.display = 'none';
    loginPage.style.display = 'flex';
    if (loginForm) loginForm.reset();
    removeLoadingState();
  }

  // 5. LÓGICA DE SUBMIT DO FORMULÁRIO DE LOGIN
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      
      if (!email || !password) return;
      
      setLoadingState();
      hideError();

      // MODO DEMO (Atalho de validação local)
      if (email === 'demo@rm9.com.br' && password === 'demo') {
        setTimeout(() => {
          sessionStorage.setItem('demo_session', 'active');
          loadDemoDashboard();
          removeLoadingState();
        }, 800);
        return;
      }

      // Se tentar qualquer outro e-mail sem o Firebase configurado
      if (!isConfigured) {
        setTimeout(() => {
          removeLoadingState();
          showError("Acesso restrito (Firebase não configurado). Use email 'demo@rm9.com.br' e senha 'demo' para testar.");
        }, 500);
        return;
      }

      // Executa login no Firebase Auth
      const auth = firebase.auth();
      auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          console.log("Usuário autenticado com sucesso!");
        })
        .catch((error) => {
          console.error("Erro na autenticação:", error);
          removeLoadingState();
          showError(getFriendlyErrorMessage(error.code));
        });
    });
  }

  // 6. LÓGICA DO BOTÃO SAIR (LOGOUT)
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (sessionStorage.getItem('demo_session') === 'active') {
        sessionStorage.removeItem('demo_session');
        showLoginPage();
        return;
      }
      
      if (isConfigured) {
        const auth = firebase.auth();
        auth.signOut()
          .then(() => {
            console.log("Sessão encerrada com sucesso!");
          })
          .catch((error) => {
            console.error("Erro ao encerrar sessão:", error);
            alert("Ocorreu um erro ao sair do portal. Por favor, tente novamente.");
          });
      }
    });
  }

  // Funções Auxiliares de Interface
  function setLoadingState() {
    if (btnLogin) btnLogin.classList.add('btn-loading');
  }

  function removeLoadingState() {
    if (btnLogin) btnLogin.classList.remove('btn-loading');
  }

  function showError(msg) {
    if (loginError) {
      loginError.textContent = msg;
      loginError.style.display = 'block';
    }
  }

  function hideError() {
    if (loginError) {
      loginError.style.display = 'none';
      loginError.textContent = '';
    }
  }
});
