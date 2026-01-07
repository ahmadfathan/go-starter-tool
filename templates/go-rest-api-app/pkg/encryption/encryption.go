package encryption

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"io"
	"os"
	"sync"
)

var (
	appKey []byte
	mu     sync.RWMutex
)

// SetKey sets the global encryption key for the application
func SetKey(key []byte) error {
	if len(key) != 32 {
		return errors.New("key must be 32 bytes long for AES-256")
	}
	mu.Lock()
	defer mu.Unlock()
	appKey = key
	return nil
}

// getKey returns the currently set key
func getKey() ([]byte, error) {
	mu.RLock()
	defer mu.RUnlock()
	if appKey == nil {
		return nil, errors.New("encryption key is not set")
	}
	return appKey, nil
}

// Encrypt encrypts a string and returns base64 encoded ciphertext
func Encrypt(plaintext string) (string, error) {
	key, err := getKey()
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts a base64 encoded string
func Decrypt(ciphertextB64 string) (string, error) {
	key, err := getKey()
	if err != nil {
		return "", err
	}

	data, err := base64.StdEncoding.DecodeString(ciphertextB64)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	if len(data) < gcm.NonceSize() {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := data[:gcm.NonceSize()], data[gcm.NonceSize():]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// EncryptFile encrypts a file and writes the encrypted content back
func EncryptFile(filename string) error {
	content, err := os.ReadFile(filename)
	if err != nil {
		return err
	}

	encrypted, err := Encrypt(string(content))
	if err != nil {
		return err
	}

	return os.WriteFile(filename, []byte(encrypted), 0644)
}

// DecryptFile decrypts a file and writes the decrypted content back
func DecryptFile(filename string) error {
	content, err := os.ReadFile(filename)
	if err != nil {
		return err
	}

	decrypted, err := Decrypt(string(content))
	if err != nil {
		return err
	}

	return os.WriteFile(filename, []byte(decrypted), 0644)
}
