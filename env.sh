#!/bin/sh
set -e

# If envsubst is available, substitute environment variables into the nginx template.
# Otherwise, copy the template unchanged.
TEMPLATE=/etc/nginx/conf.d/default.conf.template
TARGET=/etc/nginx/conf.d/default.conf

if [ -f "$TEMPLATE" ]; then
  if command -v envsubst >/dev/null 2>&1; then
    envsubst < "$TEMPLATE" > "$TARGET"
  else
    cp "$TEMPLATE" "$TARGET"
  fi
fi

exit 0
