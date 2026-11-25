<?php
/** Pré-cadastro antes de abrir o WhatsApp do site: grava o lead no CRM. */
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo '{"ok":false}'; exit; }
$raw = file_get_contents('php://input');
$d = json_decode($raw ?: '', true);
if (!is_array($d)) { $d = $_POST; }
$t = function ($k, $max = 120) use ($d) { return mb_substr(trim(strip_tags((string) ($d[$k] ?? ''))), 0, $max); };
// honeypot contra robôs
if ($t('site') !== '') { echo '{"ok":true}'; exit; }
$nome = $t('nome'); $wa = $t('whatsapp', 30);
$digits = preg_replace('/\D/', '', $wa);
if (mb_strlen($nome) < 2 || strlen($digits) < 10 || strlen($digits) > 13) { http_response_code(400); echo '{"ok":false,"erro":"dados"}'; exit; }
try {
    require_once __DIR__ . '/lib/crm-store.php';
    crm_add_whatsapp([
        'nome' => $nome, 'whatsapp' => $wa, 'empresa' => $t('empresa'),
        'servico' => $t('servico'), 'pagina' => $t('pagina', 200),
    ]);
    // log simples
    $dir = __DIR__ . '/../logs';
    @file_put_contents($dir . '/leads.log', date('Y-m-d H:i:s') . " | WhatsApp pré-cadastro | {$nome} | {$wa} | " . $t('pagina', 200) . "\n", FILE_APPEND | LOCK_EX);
    echo '{"ok":true}';
} catch (\Throwable $e) {
    http_response_code(500); echo '{"ok":false}';
}
