# add all the esseential steps for production deployment
#!/bin/bash

apt install git -y
apt install ufw -y
apt install curl -y
ufw allow OpenSSH
ufw open 80
ufw open 443
ufw enable

apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
git clone https://github.com/Mann-webspider/invoice-gen.git
cd invoice-gen
docker compose up -d --build
echo "Deployment completed successfully!"