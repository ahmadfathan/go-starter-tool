.PHONY: build-http-{{app_name}}
build-http-{{app_name}}:
	go build -v -o app-http-{{app_name}} cmd/{{app_name}}/apphttp/*.go

.PHONY: test
test:
	go test ./...