package main

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"{{module_name}}/internal/config"
	infraredis "{{module_name}}/internal/infrastructure/redis"
	"{{module_name}}/internal/infrastructure/router"
	"{{module_name}}/internal/logger"
	"{{module_name}}/internal/transport/http/middleware"
	"{{module_name}}/pkg/encryption"
)

const appName = "{{app_name}}"

type App struct {
	Debug      bool
	Config     config.AppConfig
	DB         *gorm.DB
	Redis      *redis.Client
	Logger     *slog.Logger
	HTTPServer *gin.Engine
}

func main() {
	loadEnv()

	app, err := bootstrapApp()
	if err != nil {
		log.Fatalf("failed to bootstrap app: %v", err)
	}

	if err := app.Run(); err != nil {
		app.Logger.
			With("component", "main", "error", err).
			Error("application stopped with error")
	}
}

/*
|--------------------------------------------------------------------------
| Bootstrap
|--------------------------------------------------------------------------
*/

func bootstrapApp() (*App, error) {
	debug := os.Getenv("DEBUG") == "true"

	log := initLogger(debug)

	// ✅ MUST be initialized before loading config
	if err := initEncryptionKey(); err != nil {
		log.
			With("component", "encryption", "error", err).
			Error("failed to initialize encryption key")
		return nil, err
	}

	cfg, err := loadConfig(log)
	if err != nil {
		return nil, err
	}

	db, err := initDatabase(cfg)
	if err != nil {
		log.
			With("component", "database", "error", err).
			Error("failed to initialize database")
		return nil, err
	}

	redisCli, err := initRedis(cfg)
	if err != nil {
		log.
			With("component", "redis", "error", err).
			Error("failed to initialize redis")
		return nil, err
	}

	httpServer := initHTTPServer(debug)

	return &App{
		Debug:      debug,
		Config:     cfg,
		DB:         db,
		Redis:      redisCli,
		Logger:     log,
		HTTPServer: httpServer,
	}, nil
}

/*
|--------------------------------------------------------------------------
| App Runtime
|--------------------------------------------------------------------------
*/

func (a *App) Run() error {
	address := resolveAddress(a.Config)

	a.Logger.
		With("address", address).
		Info("starting HTTP server")

	return a.HTTPServer.Run(address)
}

/*
|--------------------------------------------------------------------------
| Initializers
|--------------------------------------------------------------------------
*/

func loadEnv() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env")
	}
}

func initLogger(debug bool) *slog.Logger {
	return logger.New(
		appName,
		string(config.CurrentEnv()),
		debug,
	)
}

func initEncryptionKey() error {
	key := config.Env("ENC_KEY", "")
	if key == "" {
		return fmt.Errorf("ENC_KEY is not set")
	}

	return encryption.SetKey([]byte(key))
}

func loadConfig(log *slog.Logger) (config.AppConfig, error) {
	cfg, err := config.LoadConfig(appName)
	if err != nil {
		log.
			With("component", "config", "error", err).
			Error("failed to load config")
	}
	return cfg, err
}

func initDatabase(cfg config.AppConfig) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%d sslmode=disable",
		cfg.DB.Host,
		cfg.DB.User,
		cfg.DB.Password,
		cfg.DB.Name,
		cfg.DB.Port,
	)

	return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}

func initRedis(cfg config.AppConfig) (*redis.Client, error) {
	return infraredis.NewRedisClient(infraredis.Config{
		Host: cfg.Redis.Host,
		Port: cfg.Redis.Port,
	})
}

func initHTTPServer(debug bool) *gin.Engine {
	globalMiddlewares := []gin.HandlerFunc{
		middleware.ErrorMiddleware(),
	}

	return router.InitializeRouter(
		debug,
		globalMiddlewares,
		router.HandlerOpt{
			HTTPMethod:   http.MethodPost,
			RelativePath: "/",
			Handlers:     []gin.HandlerFunc{},
		},
	)
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

func resolveAddress(cfg config.AppConfig) string {
	host := config.Env("HOST", cfg.Host)

	port := cfg.Port
	if portStr := config.Env("PORT", ""); portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil {
			port = p
		}
	}

	return fmt.Sprintf("%s:%d", host, port)
}
