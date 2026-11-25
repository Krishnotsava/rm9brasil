<?php
// Copie este arquivo para api/config.php no servidor (Hostinger) e preencha.
// O config.php fica fora do Git para senha e chave não ficarem públicas.

// ===== E-MAIL DOS LEADS (obrigatório para os leads chegarem) =====
// Use uma caixa de e-mail real do domínio, por exemplo contato@rm9brasil.com.br.
// Hostinger: SMTP_HOST smtp.hostinger.com, porta 465
// Google Workspace: SMTP_HOST smtp.gmail.com, porta 465, e a SENHA DE APP do Google
define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 465);
define('SMTP_USER', 'contato@rm9brasil.com.br');
define('SMTP_PASS', '');

// Para onde os leads vão
define('LEAD_DESTINATARIO', 'romero@rm9brasil.com.br');

// ===== AVISO NO WHATSAPP (opcional) =====
// Como pegar a chave (uma vez só, pelo seu celular):
// 1. Abra o guia oficial: https://www.callmebot.com/blog/free-api-whatsapp-messages/
// 2. Salve nos contatos o número do bot que aparece lá.
// 3. Mande no WhatsApp: I allow callmebot to send me messages
// 4. O bot responde com a sua APIKEY. Cole abaixo.
define('CALLMEBOT_PHONE', '+5541988467737');
define('CALLMEBOT_APIKEY', '');
