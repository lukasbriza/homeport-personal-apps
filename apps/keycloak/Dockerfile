FROM quay.io/keycloak/keycloak:24.0.5

# Enable features
RUN /opt/keycloak/bin/kc.sh build

# Start Keycloak
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start"]
