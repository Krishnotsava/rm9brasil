<?php
/**
 * RM9 CRM: armazenamento simples em JSON (fora do alcance público, na pasta /logs protegida pelo .htaccess).
 */
function crm_data_file() {
    $dir = __DIR__ . '/../../logs';
    if (!is_dir($dir)) { @mkdir($dir, 0755, true); }
    $ht = $dir . '/.htaccess';
    if (!is_file($ht)) { @file_put_contents($ht, "Require all denied\nDeny from all\n"); }
    return $dir . '/crm.json';
}

/** Lê, aplica $fn e grava com trava de arquivo. $fn recebe array por referência. */
function crm_transaction(callable $fn) {
    $file = crm_data_file();
    $fp = fopen($file, 'c+');
    if (!$fp) { throw new RuntimeException('Não foi possível abrir o arquivo do CRM'); }
    flock($fp, LOCK_EX);
    $raw = stream_get_contents($fp);
    $data = json_decode($raw ?: '', true);
    if (!is_array($data)) { $data = ['leads' => []]; }
    if (!isset($data['leads']) || !is_array($data['leads'])) { $data['leads'] = []; }
    $result = $fn($data);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $result;
}

function crm_read() {
    $file = crm_data_file();
    if (!is_file($file)) { return ['leads' => []]; }
    $data = json_decode((string) file_get_contents($file), true);
    return (is_array($data) && isset($data['leads'])) ? $data : ['leads' => []];
}

function crm_now() {
    $tz = new DateTimeZone('America/Sao_Paulo');
    return (new DateTime('now', $tz))->format('Y-m-d H:i:s');
}

function crm_today() {
    $tz = new DateTimeZone('America/Sao_Paulo');
    return (new DateTime('now', $tz))->format('Y-m-d');
}

function crm_new_id() {
    return 'L' . date('ymd') . bin2hex(random_bytes(4));
}

/** Adiciona um lead vindo do formulário do site. */
function crm_add_from_form(array $f) {
    return crm_transaction(function (&$data) use ($f) {
        $now = crm_now();
        $lead = [
            'id' => crm_new_id(),
            'nome' => $f['nome'] ?? '',
            'empresa' => $f['empresa'] ?? '',
            'email' => $f['email'] ?? '',
            'whatsapp' => $f['whatsapp'] ?? '',
            'origem' => 'Site Formulário',
            'origem_detalhe' => $f['source'] ?? '',
            'servico' => $f['servico'] ?? '',
            'faturamento' => $f['faturamento'] ?? '',
            'funcionarios' => $f['funcionarios'] ?? '',
            'valor' => '',
            'etapa' => 'Novo',
            'motivo_perda' => '',
            'followup' => crm_today(),
            'comentarios' => [],
            'criado_em' => $now,
            'atualizado_em' => $now,
            'proposta_em' => '',
            'fechado_em' => '',
            'anexos' => [],
        ];
        if (!empty($f['mensagem'])) {
            $lead['comentarios'][] = ['em' => $now, 'texto' => 'Mensagem do formulário: ' . $f['mensagem']];
        }
        $data['leads'][] = $lead;
        return $lead['id'];
    });
}

/** Pasta privada dos anexos (propostas). */
function crm_files_dir() {
    $dir = dirname(crm_data_file()) . '/crm-arquivos';
    if (!is_dir($dir)) { @mkdir($dir, 0755, true); }
    return $dir;
}

/** Normaliza origens antigas para a lista atual. */
function crm_origem_nova($o) {
    $map = [
        'Formulário do site' => 'Site Formulário',
        'WhatsApp' => 'Site WhatsApp',
        'Google' => 'Google Orgânico (site)',
        'Outro' => 'Outros',
    ];
    return $map[$o] ?? $o;
}
