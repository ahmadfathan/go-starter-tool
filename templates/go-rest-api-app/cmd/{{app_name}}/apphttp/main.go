package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"{{module_name}}/internal/config"

	"github.com/redis/go-redis/v9"

	"{{module_name}}/internal/infrastructure/router"
	"{{module_name}}/internal/logger"
	"{{module_name}}/internal/transport/http/middleware"
	"{{module_name}}/pkg/encryption"

	"github.com/gin-gonic/gin"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	infraredis "{{module_name}}/internal/infrastructure/redis"
)

const (
	appName = "{{app_name}}"
)

func runApp(
	debug bool,
	appConfig config.AppConfig,
	db *gorm.DB,
	redisCli *redis.Client,
) error {

	// create DAOs

	// create repositories

	// create usecases

	// create controllers

	globalMiddlewares := []gin.HandlerFunc{
		middleware.ErrorMiddleware(),
		// add more middleware here
	}

	r := router.InitializeRouter(
		debug,
		globalMiddlewares,
		router.HandlerOpt{
			HTTPMethod: http.MethodPost, RelativePath: "/",
			Handlers: []gin.HandlerFunc{},
		},
	)

	host := config.Env("HOST", appConfig.Host)

	port := appConfig.Port
	if portStr := config.Env("PORT", ""); portStr != "" {
		parsedPort, err := strconv.ParseInt(portStr, 10, 32)
		if err != nil {
			return fmt.Errorf("invalid PORT value %q: %w", portStr, err)
		}
		port = int(parsedPort)
	}

	address := fmt.Sprintf("%s:%d", host, port)

	return r.Run(address)
}

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system env")
	}

	debug := os.Getenv("DEBUG") == "true"

	// Init logger
	log := logger.New(
		appName,
		string(config.CurrentEnv()),
		debug,
	)

	// Set the key once at app start (32 bytes for AES-256)
	encryptionKey := config.Env("ENC_KEY", "")

	err = encryption.SetKey([]byte(encryptionKey))
	if err != nil {
		log.
			With(
				"component", "main",
				"error", err,
			).
			Error("failed to set encryption key")
		os.Exit(1)
	}

	// Load config
	appConfig, err := config.LoadConfig(appName)
	if err != nil {
		log.
			With(
				"component", "main",
				"error", err,
			).
			Error("failed to load config")
		os.Exit(1)
	}

	// Connect to DB
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%d sslmode=disable",
		appConfig.DB.Host,
		appConfig.DB.User,
		appConfig.DB.Password,
		appConfig.DB.Name,
		appConfig.DB.Port,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.
			With(
				"component", "main",
				"error", err,
			).
			Error("failed to connect to the database")
		os.Exit(1)
	}

	// Create redis client
	redisCli, err := infraredis.NewRedisClient(infraredis.Config{
		Host: appConfig.Redis.Host,
		Port: appConfig.Redis.Port,
	})
	if err != nil {
		log.
			With(
				"component", "main",
				"error", err,
			).
			Error("failed to create redis client")
		os.Exit(1)
	}

	err = runApp(
		debug,
		appConfig,
		db,
		redisCli,
	)

	if err != nil {
		log.
			With(
				"component", "main",
				"error", err,
			).
			Error("failed to start the app")
	}
}
