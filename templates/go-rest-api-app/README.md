# {{AppName}} Service

**{{AppName}}** is a Go service generated using **Go Starter Tool** and built with **Clean Architecture** principles. Designed for scalability, maintainability, and clear separation of concerns.

## Key Features

- Clean Architecture–based structure
- Modular and extensible design
- Environment-based configuration
- Secure secret handling with encryption wrapper
- HTTP service using Gin
- Supports multiple environments (development / staging / production)

## Project Structure

```text
{{app_name}}
├── cmd
│   └── {{app_name}}
│       └── apphttp
│           └── main.go
├── files
│   └── etc
│       └── config
│           └── {{app_name}}.development.yaml
├── internal
│   ├── config
│   │   ├── app.go
│   │   ├── config.go
│   │   └── env.go
│   ├── domain
│   │   ├── constant
│   │   ├── entity
│   │   ├── error
│   │   └── repository
│   ├── infrastructure
│   │   ├── db
│   │   │   ├── dao
│   │   │   └── model
│   │   ├── redis
│   │   ├── repository
│   │   └── router
│   │       └── gin.go
│   ├── logger
│   │   └── logger.go
│   ├── transport
│   │   └── http
│   │       ├── apperror
│   │       │   ├── codes.go
│   │       │   ├── errors.go
│   │       │   └── mapper.go
│   │       ├── controller
│   │       │   ├── helper
│   │       │   │   └── response.go
│   │       │   ├── mapper
│   │       │   └── types.go
│   │       └── dto
│   └── usecase
└── pkg
    └── encryption
        └── encryption.go
```

## Getting Started

1. Install dependencies  
   go mod tidy

2. Setup environment  
   cp .env.sample .env  
   Fill all required variables.

3. Configuration  
   Config files are located in files/etc/config.  
   You can create separate configs per environment.  
   Do not store plain secrets. Use: ENC(YOUR_ENCRYPTED_SECRET)

4. Build  
   make build-http-{{app_name}}

5. Run  
   ./app-http-{{app_name}}

## Architecture Overview

- Domain: core business logic, no framework dependency
- Usecase: application rules and orchestration
- Infrastructure: database, redis, external services
- Transport (HTTP): Gin controllers, DTOs, error handling
- Config & Logger: centralized configuration and logging

## Development Guidelines

- Dependency flow: domain → usecase → infrastructure → transport
- Domain must stay framework-agnostic
- Add features starting from domain and usecase
- Infrastructure and transport depend on domain abstractions

## Notes

- Suitable for backend services and microservices
- Designed for long-term maintainability and team collaboration
- Generated using Go Starter Tool
- Always encrypt secrets before committing
