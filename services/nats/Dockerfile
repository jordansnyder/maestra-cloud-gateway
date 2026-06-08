# Maestra Cloud Gateway — NATS (Railway)
# Bakes the Railway-specific config into the image, since Railway has no bind mounts.
FROM nats:2.10-alpine

COPY nats-server.conf /etc/nats/nats-server.conf

EXPOSE 4223 8223

CMD ["--config", "/etc/nats/nats-server.conf"]
