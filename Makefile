include .env
export

mc:
	@docker pull minio/mc
	@docker run -it --entrypoint=/bin/sh minio/mc
	@#mc alias set local http://host.docker.internal:9000 minioadmin minioadmin;
	@#mc ls local/assets/images

up:
	@docker-compose up -d

down:
	@docker-compose down


.PHONY: server client
server:
	@cd server && go run *.go


client:
	@cd client && npm run start
