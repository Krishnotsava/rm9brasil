<?php
/**
 * RM9Brasil - Processador Central de Formulários e Notificações de E-mail
 * Envia notificações formatadas diretamente para romero@rm9brasil.com.br
 */

// Headers de CORS e JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => true, 'status' => 'online', 'message' => 'Endpoint operacional']);
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

// Extrair campos unificados
$nome = htmlspecialchars(trim($data['nome'] ?? $data['name'] ?? $data['responsavel'] ?? 'Não informado'));
$email = htmlspecialchars(trim($data['email'] ?? 'Não informado'));
$whatsapp = htmlspecialchars(trim($data['whatsapp'] ?? $data['phone'] ?? $data['telefone'] ?? 'Não informado'));
$segmento = htmlspecialchars(trim($data['segmento'] ?? $data['setor'] ?? $data['nicho'] ?? $data['area'] ?? $data['customFields']['segmento'] ?? 'Não informado'));
$mensagem = nl2br(htmlspecialchars(trim($data['mensagem'] ?? $data['desafio'] ?? $data['msg'] ?? $data['servicos'] ?? $data['customFields']['desafio'] ?? 'Sem observações adicionais')));
$faturamento = htmlspecialchars(trim($data['faturamento'] ?? $data['customFields']['faturamento'] ?? ''));
$gargalo = htmlspecialchars(trim($data['gargalo'] ?? $data['customFields']['gargalo'] ?? ''));
$service = htmlspecialchars(trim($data['service'] ?? $data['tipo'] ?? 'Contato Geral do Site'));
$source = htmlspecialchars(trim($data['source'] ?? 'rm9brasil.com.br'));
$empresa = htmlspecialchars(trim($data['empresa'] ?? ''));
$cidade = htmlspecialchars(trim($data['cidade'] ?? ''));
$link_curriculo = htmlspecialchars(trim($data['link_curriculo'] ?? ''));
$link_kit = htmlspecialchars(trim($data['link_kit'] ?? ''));

$dataHora = date('d/m/Y H:i:s');
$whatsappClean = preg_replace('/[^0-9]/', '', $whatsapp);

// Definir assunto do e-mail
$assunto = "[Lead RM9] Novo Contato: {$nome} - {$segmento}";
if (!empty($empresa)) {
    $assunto = "[Parceiro/Fornecedor RM9] {$empresa} ({$nome})";
} elseif ($service === 'trabalhe_conosco') {
    $assunto = "[Trabalhe Conosco RM9] Candidatura: {$nome} ({$segmento})";
}

// Montar corpo HTML de alto padrão
$corpoHtml = "
<!DOCTYPE html>
<html lang='pt-BR'>
<head>
    <meta charset='UTF-8'>
    <title>{$assunto}</title>
</head>
<body style='margin: 0; padding: 25px; background-color: #050507; font-family: Arial, Helvetica, sans-serif; color: #f0f1f5;'>
    <div style='max-width: 600px; margin: 0 auto; background: #0d0e15; border: 1px solid #2a2d3d; border-radius: 14px; overflow: hidden;'>
        
        <!-- HEADER -->
        <div style='background: #141520; padding: 20px 25px; border-bottom: 2px solid #e2f800;'>
            <div style='font-size: 20px; font-weight: bold; color: #ffffff;'>RM9<span style='color: #e2f800;'>BRASIL</span></div>
            <div style='margin-top: 5px; font-size: 14px; color: #e2f800; font-weight: bold;'>{$service}</div>
        </div>

        <!-- CONTEUDO -->
        <div style='padding: 25px;'>
            
            <table style='width: 100%; border-collapse: collapse; font-size: 14px;'>
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; width: 140px; border-bottom: 1px solid #1c1f2e;'><strong>Nome / Solicitante:</strong></td>
                    <td style='padding: 10px 0; color: #ffffff; font-weight: bold; border-bottom: 1px solid #1c1f2e;'>{$nome}</td>
                </tr>
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid #1c1f2e;'><strong>E-mail:</strong></td>
                    <td style='padding: 10px 0; border-bottom: 1px solid #1c1f2e;'><a href='mailto:{$email}' style='color: #e2f800; text-decoration: none;'>{$email}</a></td>
                </tr>
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid #1c1f2e;'><strong>WhatsApp:</strong></td>
                    <td style='padding: 10px 0; border-bottom: 1px solid #1c1f2e;'>
                        <a href='https://wa.me/55{$whatsappClean}' style='display: inline-block; background: #25d366; color: #050507; font-weight: bold; text-decoration: none; padding: 5px 12px; border-radius: 20px; font-size: 12px;' target='_blank'>
                            📱 Abrir WhatsApp ({$whatsapp}) ➔
                        </a>
                    </td>
                </tr>
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid #1c1f2e;'><strong>Segmento / Área:</strong></td>
                    <td style='padding: 10px 0; color: #ffffff; border-bottom: 1px solid #1c1f2e;'>{$segmento}</td>
                </tr>";

if (!empty($faturamento)) {
    $corpoHtml .= "
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid #1c1f2e;'><strong>Faturamento:</strong></td>
                    <td style='padding: 10px 0; color: #e2f800; font-weight: bold; border-bottom: 1px solid #1c1f2e;'>{$faturamento}</td>
                </tr>";
}

if (!empty($gargalo)) {
    $corpoHtml .= "
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid #1c1f2e;'><strong>Gargalo Atual:</strong></td>
                    <td style='padding: 10px 0; color: #ffffff; border-bottom: 1px solid #1c1f2e;'>{$gargalo}</td>
                </tr>";
}

if (!empty($empresa)) {
    $corpoHtml .= "
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid #1c1f2e;'><strong>Empresa / Razão:</strong></td>
                    <td style='padding: 10px 0; color: #ffffff; border-bottom: 1px solid #1c1f2e;'>{$empresa}</td>
                </tr>";
}

if (!empty($cidade)) {
    $corpoHtml .= "
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid #1c1f2e;'><strong>Cidade / Região:</strong></td>
                    <td style='padding: 10px 0; color: #ffffff; border-bottom: 1px solid #1c1f2e;'>{$cidade}</td>
                </tr>";
}

if (!empty($link_curriculo)) {
    $corpoHtml .= "
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid #1c1f2e;'><strong>Currículo / Link:</strong></td>
                    <td style='padding: 10px 0; border-bottom: 1px solid #1c1f2e;'><a href='{$link_curriculo}' target='_blank' style='color: #e2f800;'>{$link_curriculo}</a></td>
                </tr>";
}

if (!empty($link_kit)) {
    $corpoHtml .= "
                <tr>
                    <td style='padding: 10px 0; color: #9fa3b5; border-bottom: 1px solid #1c1f2e;'><strong>Mídia Kit / Tabela:</strong></td>
                    <td style='padding: 10px 0; border-bottom: 1px solid #1c1f2e;'><a href='{$link_kit}' target='_blank' style='color: #e2f800;'>{$link_kit}</a></td>
                </tr>";
}

$corpoHtml .= "
            </table>

            <!-- BLOCO DE MENSAGEM / DESAFIO -->
            <div style='margin-top: 20px; background: #131622; border: 1px solid #232738; border-radius: 8px; padding: 15px;'>
                <div style='font-size: 11px; text-transform: uppercase; color: #e2f800; font-weight: bold; margin-bottom: 8px;'>
                    Desafio / Mensagem do Solicitante:
                </div>
                <div style='color: #e2e4ed; font-size: 14px; line-height: 1.5;'>{$mensagem}</div>
            </div>

            <!-- FOOTER INFO -->
            <div style='margin-top: 20px; padding-top: 15px; border-top: 1px solid #1c1f2e; font-size: 11px; color: #64677a;'>
                Origem: {$source} • Data/Hora: {$dataHora}
            </div>

        </div>
    </div>
</body>
</html>
";

// Headers de envio com remetente do proprio dominio
$headers = "MIME-Version: 1.0
";
$headers .= "Content-Type: text/html; charset=UTF-8
";
$headers .= "From: RM9Brasil Notificacoes <contato@rm9brasil.com.br>
";
if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $headers .= "Reply-To: {$email}
";
} else {
    $headers .= "Reply-To: romero@rm9brasil.com.br
";
}
$headers .= "X-Mailer: PHP/" . phpversion() . "
";

// Disparar email
$enviado = @mail($destinatario, $assunto, $corpoHtml, $headers);

// Log local
$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
}
@file_put_contents(
    $logDir . '/leads.log', 
    date('Y-m-d H:i:s') . " | {$service} | Mail: " . ($enviado ? 'OK' : 'FAIL') . " | " . json_encode($data, JSON_UNESCAPED_UNICODE) . "
", 
    FILE_APPEND
);

echo json_encode([
    'success' => true,
    'email_sent' => $enviado,
    'message' => 'Mensagem processada com sucesso!'
]);
