docker login
docker build -t manndshelby/invoice-backend:1.1 ./backend/
docker build -f ./ui/Dockerfile -t manndshelby/invoice-frontend:1.4 ./ui/

docker push manndshelby/invoice-backend:1.0
docker push manndshelby/invoice-frontend:1.4



ssh -i "test-invoice.pem" ubuntu@ec2-13-203-154-40.ap-south-1.compute.amazonaws.com
docker system prune -a --volumes
