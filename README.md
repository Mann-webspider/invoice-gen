docker login
docker build -t manndshelby/invoice-backend:prod ./backend/
docker build -f ./ui/Dockerfile ./ui/-t manndshelby/invoice-frontend:prod ./ui/

docker push manndshelby/invoice-backend:prod
docker push manndshelby/invoice-frontend:prod