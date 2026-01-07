package apperror

import (
	"errors"
	"fmt"
	"net/http"
)

type AppError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// Implements the error interface
func (e *AppError) Error() string {
	return fmt.Sprintf("[%s] %s - %s", e.Code, e.Message, e.Details)
}

// Maps error codes to appropriate HTTP status codes
func (e *AppError) StatusCode() int {
	switch e.Code {
	case Validation, BadRequest:
		return http.StatusBadRequest
	case Unauthorized:
		return http.StatusUnauthorized
	case Forbidden:
		return http.StatusForbidden
	case NotFound:
		return http.StatusNotFound
	case Conflict:
		return http.StatusConflict
	case ServiceUnavailable:
		return http.StatusServiceUnavailable
	default:
		return http.StatusInternalServerError
	}
}

// Helper function to create a new error with a custom code, message, and details
func New(code, message, details string) *AppError {
	return &AppError{Code: code, Message: message, Details: details}
}

// Convenience functions for common error types

func ValidationError(message, details string) *AppError {
	return New(Validation, message, details)
}

func NotFoundError(resource string) *AppError {
	return New(NotFound, fmt.Sprintf("%s not found", resource), "")
}

func InternalError(details string) *AppError {
	return New(Internal, "Something went wrong", details)
}

func UnauthorizedError() *AppError {
	return New(Unauthorized, "Unauthorized", "")
}

func IsNotFoundError(err error) bool {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr.Code == Validation
	}
	return false
}
