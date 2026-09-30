<?php
/**
 * RM9Brasil - Processador de Formulários Institucionais
 * Envia notificações formatadas diretamente para romero@rm9brasil.com.br
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?? $_POST;

$destinatario = 'romero@rm9brasil.com.br';
$tipo = isset($data['tipo']) ? trim($data['tipo']) : 'contato_geral';

$assunto = "[RM9Brasil] Nova Notificação do Site";
$corpoHtml = "";

switch ($tipo) {
    case 'trabalhe_conosco':
        $nome = htmlspecialchars($data['nome'] ?? 'Não informado');
        $email = htmlspecialchars($data['email'] ?? 'Não informado');
        $whatsapp = htmlspecialchars($data['whatsapp'] ?? 'Não informado');
        $area = htmlspecialchars($data['area'] ?? 'Geral');
        $link_curriculo = htmlspecialchars($data['link_curriculo'] ?? 'Não informado');
        $linkedin = htmlspecialchars($data['linkedin'] ?? 'Não informado');
        $mensagem = nl2br(htmlspecialchars($data['mensagem'] ?? 'Sem mensagem'));

        $assunto = "[Trabalhe Conosco RM9] Candidatura: {$nome} - {$area}";
        $corpoHtml = "
        <div style='font-family: Arial, sans-serif; background: #0c0d12; color: #f0f0f5; padding: 30px; border-radius: 8px;'>
            <h2 style='color: #00f2fe; margin-top: 0;'>🚀 Nova Candidatura - Trabalhe Conosco RM9</h2>
            <hr style='border: 1px solid #1f2333; margin: 20px 0;'>
            <p><strong>Nome:</strong> {$nome}</p>
            <p><strong>E-mail:</strong> <a href='mailto:{$email}' style='color: #00f2fe;'>{$email}</a></p>
            <p><strong>WhatsApp:</strong> <a href='https://wa.me/" . preg_replace('/[^0-9]/', '', $whatsapp) . "' style='color: #25d366;'>{$whatsapp}</a></p>
            <p><strong>Área de Atuação:</strong> <span style='background: #1f2333; padding: 4px 10px; border-radius: 4px;'>{$area}</span></p>
            <p><strong>Link do Currículo / Portfolio:</strong> <a href='{$link_curriculo}' target='_blank' style='color: #00f2fe;'>{$link_curriculo}</a></p>
            <p><strong>LinkedIn / Portfólio:</strong> <a href='{$linkedin}' target='_blank' style='color: #00f2fe;'>{$linkedin}</a></p>
            <div style='margin-top: 20px; background: #131620; padding: 15px; border-radius: 6px; border-left: 4px solid #00f2fe;'>
                <strong>Pitch & Por que se identificou com a filosofia da RM9:</strong><br><br>
                {$mensagem}
            </div>
            <p style='font-size: 11px; color: #71768e; margin-top: 25px;'>Enviado via rm9brasil.com.br/trabalhe-conosco.html em " . date('d/m/Y H:i:s') . "</p>
        </div>";
        break;

    case 'fornecedor':
        $empresa = htmlspecialchars($data['empresa'] ?? 'Não informado');
        $cnpj = htmlspecialchars($data['cnpj'] ?? 'Não informado');
        $responsavel = htmlspecialchars($data['responsavel'] ?? 'Não informado');
        $email = htmlspecialchars($data['email'] ?? 'Não informado');
        $telefone = htmlspecialchars($data['telefone'] ?? 'Não informado');
        $segmento = htmlspecialchars($data['segmento'] ?? 'Não informado');
        $servicos = nl2br(htmlspecialchars($data['servicos'] ?? 'Não informado'));
        $link_kit = htmlspecialchars($data['link_kit'] ?? 'Não informado');

        $assunto = "[Fornecedor RM9] Cadastro: {$empresa} ({$segmento})";
        $corpoHtml = "
        <div style='font-family: Arial, sans-serif; background: #0c0d12; color: #f0f0f5; padding: 30px; border-radius: 8px;'>
            <h2 style='color: #e5ff00; margin-top: 0;'>🏢 Novo Cadastro de Fornecedor / Veículo de Mídia</h2>
            <hr style='border: 1px solid #1f2333; margin: 20px 0;'>
            <p><strong>Empresa / Razão Social:</strong> {$empresa}</p>
            <p><strong>CNPJ:</strong> {$cnpj}</p>
            <p><strong>Responsável Comercial:</strong> {$responsavel}</p>
            <p><strong>E-mail:</strong> <a href='mailto:{$email}' style='color: #00f2fe;'>{$email}</a></p>
            <p><strong>Telefone / WhatsApp:</strong> {$telefone}</p>
            <p><strong>Segmento:</strong> <span style='background: #1f2333; padding: 4px 10px; border-radius: 4px; color: #e5ff00;'>{$segmento}</span></p>
            <p><strong>Link Mídia Kit / Tabela de Preços:</strong> <a href='{$link_kit}' target='_blank' style='color: #00f2fe;'>{$link_kit}</a></p>
            <div style='margin-top: 20px; background: #131620; padding: 15px; border-radius: 6px; border-left: 4px solid #e5ff00;'>
                <strong>Serviços e Soluções Oferecidas:</strong><br><br>
                {$servicos}
            </div>
            <p style='font-size: 11px; color: #71768e; margin-top: 25px;'>Enviado via rm9brasil.com.br/fornecedores.html em " . date('d/m/Y H:i:s') . "</p>
        </div>";
        break;

    case 'parceiro_estrategico':
        $nome = htmlspecialchars($data['nome'] ?? 'Não informado');
        $email = htmlspecialchars($data['email'] ?? 'Não informado');
        $whatsapp = htmlspecialchars($data['whatsapp'] ?? 'Não informado');
        $cidade = htmlspecialchars($data['cidade'] ?? 'Não informado');
        $perfil = htmlspecialchars($data['perfil'] ?? 'Não informado');
        $nicho = htmlspecialchars($data['nicho'] ?? 'Não informado');
        $mensagem = nl2br(htmlspecialchars($data['mensagem'] ?? 'Sem mensagem'));

        $assunto = "[Parceiro RM9] Proposta de Parceria Estratégica: {$nome} ({$cidade})";
        $corpoHtml = "
        <div style='font-family: Arial, sans-serif; background: #0c0d12; color: #f0f0f5; padding: 30px; border-radius: 8px;'>
            <h2 style='color: #00f2fe; margin-top: 0;'>🤝 Proposta de Parceria Estratégica - Empreenda com a RM9</h2>
            <hr style='border: 1px solid #1f2333; margin: 20px 0;'>
            <p><strong>Nome / Proponente:</strong> {$nome}</p>
            <p><strong>E-mail:</strong> <a href='mailto:{$email}' style='color: #00f2fe;'>{$email}</a></p>
            <p><strong>WhatsApp:</strong> <a href='https://wa.me/" . preg_replace('/[^0-9]/', '', $whatsapp) . "' style='color: #25d366;'>{$whatsapp}</a></p>
            <p><strong>Cidade / Região:</strong> {$cidade}</p>
            <p><strong>Perfil Profissional:</strong> {$perfil}</p>
            <p><strong>Nicho / Mercado de Atuação:</strong> {$nicho}</p>
            <div style='margin-top: 20px; background: #131620; padding: 15px; border-radius: 6px; border-left: 4px solid #00f2fe;'>
                <strong>Visão de Negócio & Oportunidade:</strong><br><br>
                {$mensagem}
            </div>
            <p style='font-size: 11px; color: #71768e; margin-top: 25px;'>Enviado via rm9brasil.com.br/empreenda.html em " . date('d/m/Y H:i:s') . "</p>
        </div>";
        break;

    default: // Diagnóstico / Lead da Home
        $nome = htmlspecialchars($data['nome'] ?? 'Não informado');
        $email = htmlspecialchars($data['email'] ?? 'Não informado');
        $whatsapp = htmlspecialchars($data['whatsapp'] ?? 'Não informado');
        $faturamento = htmlspecialchars($data['faturamento'] ?? 'Não informado');
        $gargalo = htmlspecialchars($data['gargalo'] ?? 'Não informado');
        $setor = htmlspecialchars($data['setor'] ?? 'Não informado');

        $assunto = "[Lead RM9] Novo Diagnóstico de Negócio: {$nome}";
        $corpoHtml = "
        <div style='font-family: Arial, sans-serif; background: #0c0d12; color: #f0f0f5; padding: 30px; border-radius: 8px;'>
            <h2 style='color: #00f2fe; margin-top: 0;'>⚡ Novo Lead - Diagnóstico Estratégico RM9</h2>
            <hr style='border: 1px solid #1f2333; margin: 20px 0;'>
            <p><strong>Nome / Empresa:</strong> {$nome}</p>
            <p><strong>E-mail:</strong> <a href='mailto:{$email}' style='color: #00f2fe;'>{$email}</a></p>
            <p><strong>WhatsApp:</strong> <a href='https://wa.me/" . preg_replace('/[^0-9]/', '', $whatsapp) . "' style='color: #25d366;'>{$whatsapp}</a></p>
            <p><strong>Faixa de Faturamento:</strong> <span style='color: #e5ff00; font-weight: bold;'>{$faturamento}</span></p>
            <p><strong>Principal Gargalo:</strong> {$gargalo}</p>
            <p><strong>Setor:</strong> {$setor}</p>
            <p style='font-size: 11px; color: #71768e; margin-top: 25px;'>Enviado via rm9brasil.com.br em " . date('d/m/Y H:i:s') . "</p>
        </div>";
        break;
}

$headers = "MIME-Version: 1.0
";
$headers .= "Content-Type: text/html; charset=UTF-8
";
$headers .= "From: RM9Brasil Sistema <no-reply@rm9brasil.com.br>
";
$headers .= "Reply-To: " . ($email ?? 'contato@rm9brasil.com.br') . "
";
$headers .= "X-Mailer: PHP/" . phpversion();

$enviado = @mail($destinatario, $assunto, $corpoHtml, $headers);

$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
}
@file_put_contents($logDir . '/leads.log', date('Y-m-d H:i:s') . " | {$tipo} | " . json_encode($data, JSON_UNESCAPED_UNICODE) . "
", FILE_APPEND);

echo json_encode([
    'success' => true,
    'message' => 'Recebido com sucesso pela equipe da RM9Brasil! Entraremos em contato em breve.'
]);
