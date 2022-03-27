include .env
export

mc:
	@docker pull minio/mc
	@docker run -it --entrypoint=/bin/sh minio/mc
	# Set path to local storage.
	# mc alias set local http://host.docker.internal:9000 minioadmin minioadmin
	# mc mb local/assets - create new bucket called assets.
	# mc rb local/assets - remove bucket called assets.
	# mc ls local
	# mc policy set public local/assets - set bucket to public.

up:
	@docker-compose up -d

down:
	@docker-compose down


.PHONY: server
server:
	@cd server && go run main.go
