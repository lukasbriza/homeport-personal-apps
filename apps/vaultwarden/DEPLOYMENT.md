# Accessing server admin page
To acess server admin page you need to generate ADMIN_TOKEN inside of running vaultwarden container.

1. Run `docker exec -it vaultwarden-prod /valutwarden hash`
2. Set vault admin password.
3. Copy generated ADMIN_TOKEN and set it to env of container.
4. Shut down and copose up container.
5. Acces admin page on `<vault_url>/admin` and enter ADMIN_TOKEN
