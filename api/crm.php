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
    $leads = crm_read()['leads'];
    $precisa = false;
    foreach ($leads as $l) { if (crm_origem_nova($l['origem'] ?? '') !== ($l['origem'] ?? '')) { $precisa = true; break; } }
    if ($precisa) {
        $leads = crm_transaction(function (&$data) {
            foreach ($data['leads'] as &$l) { $l['origem'] = crm_origem_nova($l['origem'] ?? ''); }
            unset($l);
            return $data['leads'];
        });
    }
    out(['ok' => true, 'leads' => $leads, 'hoje' => crm_today()]);
}

// ---------- Anexos (propostas) ----------
$EXT_OK = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'webp', 'txt', 'zip'];

if ($action === 'upload') {
    if (($_SERVER['HTTP_X_CSRF'] ?? '') !== ($_SESSION['csrf'] ?? '-')) { out(['ok' => false, 'erro' => 'Sessão expirada, entre de novo'], 403); }
    $leadId = (string) ($_POST['lead'] ?? '');
    $f = $_FILES['arquivo'] ?? null;
    if (!$f || ($f['error'] ?? 1) !== UPLOAD_ERR_OK) { out(['ok' => false, 'erro' => 'Falha no envio do arquivo (limite do servidor ou arquivo vazio)'], 400); }
    if ($f['size'] > 25 * 1024 * 1024) { out(['ok' => false, 'erro' => 'Arquivo acima de 25 MB'], 400); }
    $orig = basename((string) $f['name']);
    $ext = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
    if (!in_array($ext, $EXT_OK, true)) { out(['ok' => false, 'erro' => 'Tipo de arquivo não permitido'], 400); }
    $fid = bin2hex(random_bytes(8)) . '.' . $ext;
    if (!move_uploaded_file($f['tmp_name'], crm_files_dir() . '/' . $fid)) { out(['ok' => false, 'erro' => 'Não foi possível salvar o arquivo'], 500); }
    $res = crm_transaction(function (&$data) use ($leadId, $fid, $orig, $f) {
        foreach ($data['leads'] as &$l) {
            if ($l['id'] === $leadId) {
                if (!isset($l['anexos']) || !is_array($l['anexos'])) { $l['anexos'] = []; }
                $now = crm_now();
                $l['anexos'][] = ['id' => $fid, 'nome' => mb_substr($orig, 0, 120), 'tamanho' => (int) $f['size'], 'em' => $now];
                $l['comentarios'][] = ['em' => $now, 'texto' => 'Anexo adicionado: ' . mb_substr($orig, 0, 120), 'auto' => true];
                $l['atualizado_em'] = $now;
                return $l;
            }
        }
        unset($l);
        return null;
    });
    if (!$res) { @unlink(crm_files_dir() . '/' . $fid); out(['ok' => false, 'erro' => 'Lead não encontrado'], 404); }
    out(['ok' => true, 'lead' => $res]);
}

if ($action === 'file') {
    $fid = basename((string) ($_GET['f'] ?? ''));
    $path = crm_files_dir() . '/' . $fid;
    if ($fid === '' || !preg_match('/^[a-f0-9]{16}\.[a-z0-9]+$/', $fid) || !is_file($path)) { out(['ok' => false, 'erro' => 'Arquivo não encontrado'], 404); }
    $nome = $fid;
    foreach (crm_read()['leads'] as $l) { foreach (($l['anexos'] ?? []) as $a) { if ($a['id'] === $fid) { $nome = $a['nome']; } } }
    $tipos = ['pdf' => 'application/pdf', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp', 'txt' => 'text/plain; charset=utf-8'];
    $ext = strtolower(pathinfo($fid, PATHINFO_EXTENSION));
    header_remove('Content-Type');
    header('Content-Type: ' . ($tipos[$ext] ?? 'application/octet-stream'));
    header('Content-Length: ' . filesize($path));
    header("Content-Disposition: " . (isset($tipos[$ext]) ? 'inline' : 'attachment') . "; filename*=UTF-8''" . rawurlencode($nome));
    header('X-Content-Type-Options: nosniff');
    readfile($path);
    exit;
}

if ($action === 'unattach') {
    if (($_SERVER['HTTP_X_CSRF'] ?? '') !== ($_SESSION['csrf'] ?? '-')) { out(['ok' => false, 'erro' => 'Sessão expirada, entre de novo'], 403); }
    $leadId = (string) ($input['lead'] ?? ''); $fid = basename((string) ($input['f'] ?? ''));
    $res = crm_transaction(function (&$data) use ($leadId, $fid) {
        foreach ($data['leads'] as &$l) {
            if ($l['id'] === $leadId) {
                $l['anexos'] = array_values(array_filter($l['anexos'] ?? [], function ($a) use ($fid) { return $a['id'] !== $fid; }));
                $l['atualizado_em'] = crm_now();
                return $l;
            }
        }
        unset($l);
        return null;
    });
    if ($fid && preg_match('/^[a-f0-9]{16}\.[a-z0-9]+$/', $fid)) { @unlink(crm_files_dir() . '/' . $fid); }
    out(['ok' => (bool) $res, 'lead' => $res]);
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
            'proposta_em' => '', 'fechado_em' => '', 'origem_detalhe' => '', 'anexos' => [],
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
        foreach ($data['leads'] as $x) {
            if ($x['id'] === $id) { foreach (($x['anexos'] ?? []) as $a) { if (preg_match('/^[a-f0-9]{16}\.[a-z0-9]+$/', $a['id'])) { @unlink(crm_files_dir() . '/' . $a['id']); } } }
        }
        $data['leads'] = array_values(array_filter($data['leads'], function ($x) use ($id) { return $x['id'] !== $id; }));
    });
    out(['ok' => true]);
}

out(['ok' => false, 'erro' => 'Ação desconhecida'], 400);
