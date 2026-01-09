package config

import (
	"fmt"
	"reflect"
	"strings"

	"{{module_name}}/pkg/encryption"

	"github.com/mitchellh/mapstructure"
	"github.com/spf13/viper"
)

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

	err := v.Unmarshal(
		&appConfig,
		viper.DecodeHook(
			mapstructure.ComposeDecodeHookFunc(
				decryptHook(),
			),
		),
	)
	if err != nil {
		return appConfig, err
	}

	return appConfig, nil
}

func decryptHook() mapstructure.DecodeHookFunc {
	return func(
		from reflect.Type,
		to reflect.Type,
		data interface{},
	) (interface{}, error) {

		// We only care about string → string
		if from.Kind() != reflect.String || to.Kind() != reflect.String {
			return data, nil
		}

		value := data.(string)

		if strings.HasPrefix(value, "ENC(") && strings.HasSuffix(value, ")") {
			encrypted := strings.TrimSuffix(strings.TrimPrefix(value, "ENC("), ")")

			decrypted, err := encryption.Decrypt(encrypted)
			if err != nil {
				return nil, fmt.Errorf("failed to decrypt value: %w", err)
			}

			return decrypted, nil
		}

		return data, nil
	}
}
