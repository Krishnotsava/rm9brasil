<?php
/**
 * RM9 CRM: lembrete diário de follow-ups por e-mail (e WhatsApp, se o CallMeBot estiver configurado).
 * Cron da Hostinger (todo dia às 8h):  php /home/SEU_USUARIO/public_html/api/crm-lembretes.php
 * Ou por URL: https://rm9brasil.com.br/api/crm-lembretes.php?token=CRM_CRON_TOKEN
 */
$cli = (PHP_SAPI === 'cli');
$cfg = __DIR__ . '/config.php';
if (is_file($cfg)) { require_once $cfg; }
require_once __DIR__ . '/lib/crm-store.php';

if (!$cli) {
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Robots-Tag: noindex, nofollow');
    $tok = (string) ($_GET['token'] ?? '');
    if (!defined('CRM_CRON_TOKEN') || CRM_CRON_TOKEN === '' || !hash_equals(CRM_CRON_TOKEN, $tok)) { http_response_code(403); exit("forbidden\n"); }
}

$hoje = crm_today();
$mes = substr($hoje, 0, 7);
$leads = crm_read()['leads'];
$abertos = array_filter($leads, function ($l) { return !in_array($l['etapa'] ?? '', ['Ganho', 'Perdido'], true); });
$atrasados = []; $deHoje = []; $semData = [];
foreach ($abertos as $l) {
    $f = $l['followup'] ?? '';
    if ($f === '') { $semData[] = $l; } elseif ($f < $hoje) { $atrasados[] = $l; } elseif ($f === $hoje) { $deHoje[] = $l; }
}
$noMes = function ($campo) use ($leads, $mes) { return count(array_filter($leads, function ($l) use ($campo, $mes) { return substr($l[$campo] ?? '', 0, 7) === $mes; })); };
$ganhos = count(array_filter($leads, function ($l) use ($mes) { return ($l['etapa'] ?? '') === 'Ganho' && substr($l['fechado_em'] ?? '', 0, 7) === $mes; }));
$perdidos = count(array_filter($leads, function ($l) use ($mes) { return ($l['etapa'] ?? '') === 'Perdido' && substr($l['fechado_em'] ?? '', 0, 7) === $mes; }));

$linha = function ($l) {
    $t = '- ' . ($l['nome'] ?: 'Sem nome');
    if (!empty($l['empresa'])) { $t .= ' (' . $l['empresa'] . ')'; }
    $t .= ' | ' . ($l['etapa'] ?? '');
    if (!empty($l['whatsapp'])) { $t .= ' | ' . $l['whatsapp']; }
    if (!empty($l['followup'])) { $t .= ' | follow-up ' . date('d/m', strtotime($l['followup'])); }
    return $t;
};

$txt = "Bom dia! Seus follow-ups de hoje no CRM da RM9.\n\n";
$txt .= "ATRASADOS (" . count($atrasados) . ")\n" . (count($atrasados) ? implode("\n", array_map($linha, $atrasados)) : "Nenhum") . "\n\n";
$txt .= "PARA HOJE (" . count($deHoje) . ")\n" . (count($deHoje) ? implode("\n", array_map($linha, $deHoje)) : "Nenhum") . "\n\n";
if (count($semData)) { $txt .= "EM ABERTO SEM DATA DE FOLLOW-UP (" . count($semData) . ")\n" . implode("\n", array_map($linha, $semData)) . "\n\n"; }
$txt .= "RESUMO DO MÊS\nLeads: " . $noMes('criado_em') . " | Propostas: " . $noMes('proposta_em') . " | Ganhos: {$ganhos} | Perdidos: {$perdidos}\n\n";
$txt .= "Abrir o CRM: https://rm9brasil.com.br/pipeline/\n";

$total = count($atrasados) + count($deHoje);
$assunto = $total ? "CRM RM9: {$total} follow-up(s) para hoje" : "CRM RM9: nenhum follow-up para hoje";
$para = (defined('LEAD_DESTINATARIO') && LEAD_DESTINATARIO !== '') ? LEAD_DESTINATARIO : 'romero@rm9brasil.com.br';

$enviado = false;
if (defined('SMTP_HOST') && SMTP_HOST !== '' && defined('SMTP_PASS') && SMTP_PASS !== '') {
    require_once __DIR__ . '/lib/PHPMailer/Exception.php';
    require_once __DIR__ . '/lib/PHPMailer/PHPMailer.php';
    require_once __DIR__ . '/lib/PHPMailer/SMTP.php';
    try {
        $m = new PHPMailer\PHPMailer\PHPMailer(true);
        $m->isSMTP(); $m->Host = SMTP_HOST; $m->Port = defined('SMTP_PORT') ? (int) SMTP_PORT : 465;
        $m->SMTPAuth = true; $m->Username = SMTP_USER; $m->Password = SMTP_PASS;
        $m->SMTPSecure = ($m->Port === 587) ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        $m->CharSet = 'UTF-8'; $m->setFrom(SMTP_USER, 'CRM RM9'); $m->addAddress($para);
        $m->Subject = $assunto; $m->Body = $txt; $m->isHTML(false);
        $enviado = $m->send();
    } catch (\Throwable $e) { $enviado = false; }
} else {
    $enviado = @mail($para, $assunto, $txt, "Content-Type: text/plain; charset=UTF-8\r\nFrom: CRM RM9 <contato@rm9brasil.com.br>\r\n", '-fcontato@rm9brasil.com.br');
}

// WhatsApp (opcional)
if ($total && defined('CALLMEBOT_APIKEY') && CALLMEBOT_APIKEY !== '' && defined('CALLMEBOT_PHONE')) {
    $wa = "CRM RM9: {$total} follow-up(s) hoje.\n" . implode("\n", array_map($linha, array_slice(array_merge($atrasados, $deHoje), 0, 8))) . "\nhttps://rm9brasil.com.br/pipeline/";
    @file_get_contents('https://api.callmebot.com/whatsapp.php?phone=' . rawurlencode(CALLMEBOT_PHONE) . '&text=' . rawurlencode($wa) . '&apikey=' . rawurlencode(CALLMEBOT_APIKEY), false, stream_context_create(['http' => ['timeout' => 8]]));
}

echo ($enviado ? "ok" : "falha no e-mail") . " | atrasados " . count($atrasados) . " | hoje " . count($deHoje) . "\n";
