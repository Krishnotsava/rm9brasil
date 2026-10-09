<?php
/**
 * RM9Brasil - Processador Central de Formulários e Notificações de E-mail
 * Envia notificações formatadas diretamente para romero@rm9brasil.com.br
 */

// Headers de CORS e JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

// Ler dados brutos do JSON ou POST
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!is_array($data) || empty($data)) {
    $data = $_POST;
}

// Destinatário oficial
$destinatario = 'romero@rm9brasil.com.br';

// Extrair campos unificados (com fallbacks)
$nome = trim($data['nome'] ?? $data['name'] ?? $data['responsavel'] ?? 'Não informado');
$email = trim($data['email'] ?? 'Não informado');
$whatsapp = trim($data['whatsapp'] ?? $data['phone'] ?? $data['telefone'] ?? 'Não informado');
$segmento = trim($data['segmento'] ?? $data['setor'] ?? $data['nicho'] ?? $data['area'] ?? $data['customFields']['segmento'] ?? 'Não informado');
$mensagem = trim($data['mensagem'] ?? $data['desafio'] ?? $data['msg'] ?? $data['servicos'] ?? $data['customFields']['desafio'] ?? 'Sem observações adicionais');
$faturamento = trim($data['faturamento'] ?? $data['customFields']['faturamento'] ?? '');
$gargalo = trim($data['gargalo'] ?? $data['customFields']['gargalo'] ?? '');
$service = trim($data['service'] ?? $data['tipo'] ?? 'Contato Geral do Site');
$source = trim($data['source'] ?? 'rm9brasil.com.br');
$empresa = trim($data['empresa'] ?? '');
$cidade = trim($data['cidade'] ?? '');
$link_curriculo = trim($data['link_curriculo'] ?? '');
$link_kit = trim($data['link_kit'] ?? '');

$dataHora = date('d/m/Y H:i:s');
$whatsappClean = preg_replace('/[^0-9]/', '', $whatsapp);

// Definir assunto do e-mail
$assunto = "[Lead RM9] Novo Contato: {$nome} - {$segmento}";
if (!empty($empresa)) {
    $assunto = "[Parceiro/Fornecedor RM9] {$empresa} ({$nome})";
} elseif ($service === 'trabalhe_conosco') {
    $assunto = "[Trabalhe Conosco RM9] Candidatura: {$nome} ({$segmento})";
}

// Montar corpo HTML de alto padrão (High-Contrast Dark Theme RM9)
$corpoHtml = "
<!DOCTYPE html>
<html lang='pt-BR'>
<head>
    <meta charset='UTF-8'>
    <title>{$assunto}</title>
</head>
<body style='margin: 0; padding: 30px; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #f0f1f5;'>
    <div style='max-width: 620px; margin: 0 auto; background: #0d0e15; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);'>
        
        <!-- HEADER -->
        <div style='background: linear-gradient(135deg, #141520 0%, #08080c 100%); padding: 25px 30px; border-bottom: 2px solid #e2f800;'>
            <div style='display: flex; align-items: center; justify-content: space-between;'>
                <span style='font-size: 20px; font-weight: 900; letter-spacing: -0.03em; color: #ffffff;'>RM9<span style='color: #e2f800;'>BRASIL</span></span>
                <span style='font-size: 11px; font-family: monospace; text-transform: uppercase; background: rgba(226, 248, 0, 0.1); color: #e2f800; border: 1px solid rgba(226, 248, 0, 0.3); padding: 4px 10px; border-radius: 999px;'>Novo Lead do Site</span>
            </div>
            <h2 style='margin: 15px 0 0 0; font-size: 18px; color: #ffffff; font-weight: 700;'>{$service}</h2>
        </div>

        <!-- CONTEÚDO -->
        <div style='padding: 30px;'>
            
            <table style='width: 100%; border-collapse: collapse; font-size: 14px;'>
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; width: 140px; border-bottom: 1px solid rgba(255,255,255,0.06);'><strong>Nome / Solicitante:</strong></td>
                    <td style='padding: 10px 0; color: #ffffff; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.06);'>{$nome}</td>
                </tr>
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid rgba(255,255,255,0.06);'><strong>E-mail:</strong></td>
                    <td style='padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);'><a href='mailto:{$email}' style='color: #e2f800; text-decoration: none;'>{$email}</a></td>
                </tr>
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid rgba(255,255,255,0.06);'><strong>WhatsApp:</strong></td>
                    <td style='padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);'>
                        <a href='https://wa.me/55{$whatsappClean}' style='display: inline-block; background: #25d366; color: #050507; font-weight: 800; text-decoration: none; padding: 4px 12px; border-radius: 999px; font-size: 12px;' target='_blank'>
                            📱 Abrir WhatsApp ({$whatsapp}) ➔
                        </a>
                    </td>
                </tr>
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid rgba(255,255,255,0.06);'><strong>Segmento / Área:</strong></td>
                    <td style='padding: 10px 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.06);'>{$segmento}</td>
                </tr>";

if (!empty($faturamento)) {
    $corpoHtml .= "
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid rgba(255,255,255,0.06);'><strong>Faturamento:</strong></td>
                    <td style='padding: 10px 0; color: #e2f800; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.06);'>{$faturamento}</td>
                </tr>";
}

if (!empty($gargalo)) {
    $corpoHtml .= "
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid rgba(255,255,255,0.06);'><strong>Gargalo Atual:</strong></td>
                    <td style='padding: 10px 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.06);'>{$gargalo}</td>
                </tr>";
}

if (!empty($empresa)) {
    $corpoHtml .= "
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid rgba(255,255,255,0.06);'><strong>Empresa / Razão:</strong></td>
                    <td style='padding: 10px 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.06);'>{$empresa}</td>
                </tr>";
}

if (!empty($cidade)) {
    $corpoHtml .= "
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid rgba(255,255,255,0.06);'><strong>Cidade / Região:</strong></td>
                    <td style='padding: 10px 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.06);'>{$cidade}</td>
                </tr>";
}

if (!empty($link_curriculo)) {
    $corpoHtml .= "
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid rgba(255,255,255,0.06);'><strong>Currículo / Link:</strong></td>
                    <td style='padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);'><a href='{$link_curriculo}' target='_blank' style='color: #e2f800;'>{$link_curriculo}</a></td>
                </tr>";
}

if (!empty($link_kit)) {
    $corpoHtml .= "
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid rgba(255,255,255,0.06);'><strong>Mídia Kit / Tabela:</strong></td>
                    <td style='padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);'><a href='{$link_kit}' target='_blank' style='color: #e2f800;'>{$link_kit}</a></td>
                </tr>";
}

$corpoHtml .= "
            </table>

            <!-- BLOCO DE MENSAGEM / DESAFIO -->
            <div style='margin-top: 25px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 20px;'>
                <div style='font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.1em; color: #e2f800; margin-bottom: 10px;'>
                    Desafio / Mensagem do Solicitante:
                </div>
                <div style='color: #e2e4ed; font-size: 14px; line-height: 1.6; white-space: pre-wrap;'>{$mensagem}</div>
            </div>

            <!-- FOOTER INFO -->
            <div style='margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #64677a; display: flex; justify-content: space-between;'>
                <span>Origem: {$source}</span>
                <span>Data/Hora: {$dataHora}</span>
            </div>

        </div>
    </div>
</body>
</html>
";

// Headers de envio de e-mail seguros
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'From: RM9Brasil Notificações <contato@rm9brasil.com.br>',
    'Reply-To: ' . (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : 'romero@rm9brasil.com.br'),
    'X-Mailer: PHP/' . phpversion(),
    'X-Priority: 1 (Highest)',
    'Importance: High'
];

$headersStr = implode("
", $headers);

// Enviar e-mail via mail() nativo do servidor
$enviado = @mail($destinatario, $assunto, $corpoHtml, $headersStr);

// Salvar cópia em log local de segurança
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
}
@file_put_contents(
    $logDir . '/leads.log', 
    date('Y-m-d H:i:s') . " | {$service} | Status Mail: " . ($enviado ? 'OK' : 'FAIL') . " | " . json_encode($data, JSON_UNESCAPED_UNICODE) . "
", 
    FILE_APPEND
);

echo json_encode([
    'success' => true,
    'email_sent' => $enviado,
    'message' => 'Mensagem registrada e encaminhada para a diretoria com sucesso!'
]);
