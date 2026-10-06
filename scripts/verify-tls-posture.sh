#!/usr/bin/env bash
set -euo pipefail

mapfile -t HOSTS < <(node --input-type=module -e 'import {site} from "./scripts/site-config.mjs"; const host=new URL(site.origin).hostname; console.log(host+"\nwww."+host)')
logs="$(mktemp -d)"
trap 'rm -rf "$logs"' EXIT

probe_tls() {
  local host="$1"
  local flag="$2"
  local cipher_args=()
  local output

  if [[ "$flag" == "-tls1" || "$flag" == "-tls1_1" ]]; then
    cipher_args=(-cipher 'ALL:@SECLEVEL=0')
  fi

  output="$(timeout 20 openssl s_client \
    -connect "${host}:443" \
    -servername "$host" \
    "$flag" \
    "${cipher_args[@]}" \
    -brief </dev/null 2>&1 || true)"

  if grep -q 'CONNECTION ESTABLISHED' <<<"$output"; then
    printf '%s\n' "$output"
    return 0
  fi

  return 1
}

probe_cipher_family() {
  local host="$1"
  local label="$2"
  local ciphers="$3"
  local output

  output="$(timeout 20 openssl s_client \
    -connect "${host}:443" \
    -servername "$host" \
    -tls1_2 \
    -cipher "$ciphers" \
    -brief </dev/null 2>&1 || true)"

  if grep -q 'CONNECTION ESTABLISHED' <<<"$output"; then
    local suite
    suite="$(grep -m1 'Ciphersuite:' <<<"$output" | sed 's/^[[:space:]]*//')"
    echo "OBSERVED: ${host} negotiates ${label} under TLS 1.2 (${suite:-suite not reported})."
    return 0
  fi

  echo "OBSERVED: ${host} did not negotiate ${label} under TLS 1.2."
  return 1
}

for host in "${HOSTS[@]}"; do
  echo "Checking TLS posture for ${host}"

  if probe_tls "$host" -tls1 >${logs}/tls1.log; then
    echo "FAIL: ${host} accepted TLS 1.0"
    cat ${logs}/tls1.log
    exit 1
  fi
  echo "PASS: ${host} rejects TLS 1.0"

  if probe_tls "$host" -tls1_1 >${logs}/tls11.log; then
    echo "FAIL: ${host} accepted TLS 1.1"
    cat ${logs}/tls11.log
    exit 1
  fi
  echo "PASS: ${host} rejects TLS 1.1"

  if ! probe_tls "$host" -tls1_2 >${logs}/tls12.log; then
    echo "FAIL: ${host} did not accept TLS 1.2"
    cat ${logs}/tls12.log 2>/dev/null || true
    exit 1
  fi
  echo "PASS: ${host} accepts TLS 1.2"

  if ! probe_tls "$host" -tls1_3 >${logs}/tls13.log; then
    echo "FAIL: ${host} did not accept TLS 1.3"
    cat ${logs}/tls13.log 2>/dev/null || true
    exit 1
  fi
  echo "PASS: ${host} accepts TLS 1.3"

  # Observational only: support for a cipher family at Cloudflare's public edge is
  # not, by itself, proof of exploitability. These probes make prior scanner
  # findings reproducible without turning compatibility heuristics into failures.
  probe_cipher_family "$host" "CBC cipher" \
    'ECDHE-ECDSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:AES128-SHA:AES256-SHA:@SECLEVEL=0' || true
  probe_cipher_family "$host" "static-RSA key exchange" 'kRSA:@SECLEVEL=0' || true

done



echo 'TLS protocol acceptance passed for both production hosts.'
