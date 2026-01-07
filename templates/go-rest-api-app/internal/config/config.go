package config

type Environment string

const (
	Development Environment = "development"
	Staging     Environment = "staging"
	Production  Environment = "production"

	AppEnvKey = "APP_ENV"
)

func CurrentEnv() Environment {
	env := Env(AppEnvKey, string(Development))
	switch env {
	case string(Development):
		return Development
	case string(Staging):
		return Staging
	case string(Production):
		return Production
	default:
		return Development
	}
}

func GetConfigDir() string {
	switch CurrentEnv() {
	case Development:
		return "./files/etc/config"
	default: // staging & production
		return "/etc/config"
	}
}

func GetConfigFileName(appName string) string {
	switch CurrentEnv() {
	case Development:
		return appName + ".development"
	case Staging:
		return appName + ".staging"
	case Production:
		return appName + ".production"
	default:
		return appName
	}
}
