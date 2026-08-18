#!/bin/sh
set -eu

AUTH_SNIPPET=/etc/nginx/conf.d/auth.conf

is_auth_enabled() {
  case "${AUTH_ENABLED:-false}" in
    true|TRUE|1|yes|YES) return 0 ;;
    *) return 1 ;;
  esac
}

if is_auth_enabled; then
  if [ -z "${AUTH_PASSWORD:-}" ]; then
    echo "AUTH_ENABLED is true but AUTH_PASSWORD is not set" >&2
    exit 1
  fi

  AUTH_USER="${AUTH_USER:-airbnb}"
  htpasswd -bc /etc/nginx/.htpasswd "$AUTH_USER" "$AUTH_PASSWORD"
  cat > "$AUTH_SNIPPET" <<'EOF'
auth_basic "Airbnb Monitor";
auth_basic_user_file /etc/nginx/.htpasswd;
EOF
else
  : > "$AUTH_SNIPPET"
fi

exec nginx -g 'daemon off;'
