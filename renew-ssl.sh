# Create renewal script
cat > renew-ssl.sh << 'EOF'
#!/bin/bash
sudo docker-compose run --rm certbot renew
sudo docker-compose restart nginx
EOF

chmod +x renew-ssl.sh

# Add to crontab (runs twice a day)
echo "0 12,0 * * * /home/ubuntu/invoice-gen/renew-ssl.sh" | sudo crontab -
