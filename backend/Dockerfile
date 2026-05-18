FROM python:3.12-slim

ARG APT_DEBIAN_MIRROR=
ARG APT_SECURITY_MIRROR=
ARG PIP_INDEX_URL=https://pypi.org/simple
ARG PIP_DEFAULT_TIMEOUT=120
ARG PIP_RETRIES=5

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN if [ -n "$APT_DEBIAN_MIRROR" ]; then \
        sed -i "s|http://deb.debian.org/debian|$APT_DEBIAN_MIRROR|g" /etc/apt/sources.list.d/debian.sources; \
    fi \
    && if [ -n "$APT_SECURITY_MIRROR" ]; then \
        sed -i "s|http://deb.debian.org/debian-security|$APT_SECURITY_MIRROR|g" /etc/apt/sources.list.d/debian.sources; \
    fi \
    && apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install \
    --no-cache-dir \
    --default-timeout="$PIP_DEFAULT_TIMEOUT" \
    --retries="$PIP_RETRIES" \
    -i "$PIP_INDEX_URL" \
    -r requirements.txt

COPY . .
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

CMD ["/app/docker-entrypoint.sh"]
