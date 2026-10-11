#!/usr/bin/env bash
# Staged fresh-host setup using Docker's official Debian apt repository.
set -euo pipefail
if [[ "${1:-}" == "--help" ]]; then
  echo 'Usage: sudo bash scripts/install-docker-debian.sh'
  echo 'Debian 12/13 only. Reuses working Docker; never removes conflicting packages or data.'
  exit 0
fi
[[ -r /etc/os-release ]] || { echo 'Cannot identify the operating system.' >&2; exit 1; }
source /etc/os-release
[[ "$ID" == debian && ( "$VERSION_ID" == 12 || "$VERSION_ID" == 13 ) ]] || { echo 'Use the official Docker instructions for your OS; this helper supports Debian 12/13 only.' >&2; exit 1; }
[[ "$EUID" == 0 ]] || { echo 'Run this helper with sudo. It installs packages and starts Docker.' >&2; exit 1; }
echo 'Chapter 1/3: inspect Docker and existing packages.'
if ! command -v docker >/dev/null; then
  for package in docker.io docker-compose docker-doc docker-buildx podman-docker containerd runc; do
    if dpkg-query -W -f='${Status}' "$package" 2>/dev/null | grep -q 'install ok installed'; then
      echo "Existing $package needs administrator review. No packages were removed." >&2; exit 1
    fi
  done
  if [[ -e /etc/apt/sources.list.d/docker.sources || -e /etc/apt/sources.list.d/docker.list ]]; then
    echo 'An existing Docker repository needs review; this helper will not overwrite it.' >&2; exit 1
  fi
  echo 'Chapter 2/3: install from the official Docker Debian repository.'
  apt-get update
  apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  cat > /etc/apt/sources.list.d/docker.sources <<SOURCES
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: $VERSION_CODENAME
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
SOURCES
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
else
  echo 'Chapter 2/3: existing Docker retained; no package changes.'
fi
echo 'Chapter 3/3: verify Docker functionality.'
docker version
docker compose version
docker compose up --help | grep -q -- '--wait-timeout' || { echo 'Compose lacks the launcher --wait-timeout option. Update it using official instructions.' >&2; exit 1; }
[[ "$(docker info --format '{{.OSType}}')" == linux ]] || { echo 'Linux containers are required.' >&2; exit 1; }
docker run --rm hello-world
echo 'Docker is verified for this administrator. Return to Quick Start, then run sudo bash start-district.sh from drawsplat/.'
echo 'Optional: add an authorized administrator to the docker group using official instructions; this grants host administrative control.'
