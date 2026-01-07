package config

import "github.com/spf13/viper"

type AppConfig struct {
	Host  string
	Port  int
	DB    DBConfig
	Redis RedisConfig
	// Add more config here
}

type DBConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Name     string
}

type RedisConfig struct {
	Host string
	Port int
}

func LoadConfig(appName string) (AppConfig, error) {
	var (
		appConfig               AppConfig
		cfgDirPath, cfgFileName string
	)

	cfgDirPath = GetConfigDir()
	cfgFileName = GetConfigFileName(appName)
	v := viper.New()
	v.AddConfigPath(cfgDirPath)
	v.SetConfigName(cfgFileName)
	v.SetConfigType("yaml")

	if err := v.ReadInConfig(); err != nil {
		return appConfig, err
	}

	err := v.Unmarshal(&appConfig)
	if err != nil {
		return appConfig, err
	}

	return appConfig, nil
}
