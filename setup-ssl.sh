#!/bin/bash

# Create directories
mkdir -p certbot/www certbot/conf

# Get initial certificate
sudo docker run -it --rm \
  -v $(pwd)/certbot/www:/var/www/certbot \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly --standalone -d invoice.mannshelby.xyz

echo "SSL certificates generated! Now restart your docker-compose services."