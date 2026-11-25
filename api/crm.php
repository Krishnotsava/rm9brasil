<?php
/**
 * RM9 CRM: API privada (login por senha definida em api/config.php).
 *   define('CRM_SENHA', 'sua-senha-forte');   // ou um hash gerado com password_hash()
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

$cfg = __DIR__ . '/config.php';
if (is_file($cfg)) { require_once $cfg; }
require_once __DIR__ . '/lib/crm-store.php';

session_name('rm9crm');
session_set_cookie_params([
    'lifetime' => 60 * 60 * 24 * 30,
    'path' => '/',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

function out($arr, $code = 200) { http_response_code($code); echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }

$input = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($input)) { $input = []; }
$action = $_GET['action'] ?? ($input['action'] ?? '');

// ---------- Login ----------
if ($action === 'login') {
    if (!defined('CRM_SENHA') || CRM_SENHA === '') { out(['ok' => false, 'erro' => 'Senha do CRM ainda não configurada em api/config.php'], 503); }
    $senha = (string) ($input['senha'] ?? '');
    $okSenha = (strpos(CRM_SENHA, '$2y$') === 0) ? password_verify($senha, CRM_SENHA) : hash_equals(CRM_SENHA, $senha);
    if (!$okSenha) { sleep(2); out(['ok' => false, 'erro' => 'Senha incorreta'], 401); }
    session_regenerate_id(true);
    $_SESSION['crm'] = true;
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
    out(['ok' => true, 'csrf' => $_SESSION['csrf']]);
}
if ($action === 'logout') { $_SESSION = []; session_destroy(); out(['ok' => true]); }

if (empty($_SESSION['crm'])) { out(['ok' => false, 'erro' => 'login'], 401); }
if ($action === 'session') { out(['ok' => true, 'csrf' => $_SESSION['csrf']]); }

// Escritas exigem o token da sessão
$escrita = in_array($action, ['save', 'delete', 'comment'], true);
if ($escrita && (($_SERVER['HTTP_X_CSRF'] ?? '') !== ($_SESSION['csrf'] ?? '-'))) { out(['ok' => false, 'erro' => 'Sessão expirada, entre de novo'], 403); }

$ETAPAS = ['Novo', 'Em contato', 'Reunião', 'Proposta enviada', 'Negociação', 'Ganho', 'Perdido'];
$CAMPOS = ['nome', 'empresa', 'email', 'whatsapp', 'origem', 'servico', 'faturamento', 'funcionarios', 'valor', 'etapa', 'motivo_perda', 'followup'];

function limpa($v) { return mb_substr(trim(strip_tags((string) $v)), 0, 500); }

if ($action === 'list') {
    out(['ok' => true, 'leads' => crm_read()['leads'], 'hoje' => crm_today()]);
}

if ($action === 'save') {
    $l = $input['lead'] ?? [];
    if (!is_array($l)) { out(['ok' => false, 'erro' => 'Dados inválidos'], 400); }
    $res = crm_transaction(function (&$data) use ($l, $CAMPOS, $ETAPAS) {
        $now = crm_now();
        $idx = null;
        if (!empty($l['id'])) {
            foreach ($data['leads'] as $i => $x) { if ($x['id'] === $l['id']) { $idx = $i; break; } }
        }
        $lead = $idx === null ? [
            'id' => crm_new_id(), 'etapa' => 'Novo', 'comentarios' => [], 'criado_em' => $now,
            'proposta_em' => '', 'fechado_em' => '', 'origem_detalhe' => '',
        ] : $data['leads'][$idx];
        $etapaAntes = $lead['etapa'] ?? 'Novo';
        foreach ($CAMPOS as $c) { if (array_key_exists($c, $l)) { $lead[$c] = limpa($l[$c]); } }
        if (!in_array($lead['etapa'], $ETAPAS, true)) { $lead['etapa'] = 'Novo'; }
        if (!empty($lead['followup']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $lead['followup'])) { $lead['followup'] = ''; }
        // Datas de marco
        if (in_array($lead['etapa'], ['Proposta enviada', 'Negociação', 'Ganho'], true) && empty($lead['proposta_em'])) { $lead['proposta_em'] = $now; }
        if (in_array($lead['etapa'], ['Ganho', 'Perdido'], true)) {
            if ($etapaAntes !== $lead['etapa'] || empty($lead['fechado_em'])) { $lead['fechado_em'] = $now; }
            $lead['followup'] = '';
        } else {
            $lead['fechado_em'] = '';
            $lead['motivo_perda'] = '';
        }
        if ($etapaAntes !== $lead['etapa'] && $idx !== null) {
            $lead['comentarios'][] = ['em' => $now, 'texto' => "Etapa: {$etapaAntes} → {$lead['etapa']}", 'auto' => true];
        }
        if (!empty($l['novo_comentario'])) { $lead['comentarios'][] = ['em' => $now, 'texto' => limpa($l['novo_comentario'])]; }
        $lead['atualizado_em'] = $now;
        if ($idx === null) { $data['leads'][] = $lead; } else { $data['leads'][$idx] = $lead; }
        return $lead;
    });
    out(['ok' => true, 'lead' => $res]);
}

if ($action === 'delete') {
    $id = (string) ($input['id'] ?? '');
    crm_transaction(function (&$data) use ($id) {
        $data['leads'] = array_values(array_filter($data['leads'], function ($x) use ($id) { return $x['id'] !== $id; }));
    });
    out(['ok' => true]);
}

out(['ok' => false, 'erro' => 'Ação desconhecida'], 400);
