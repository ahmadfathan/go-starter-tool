package apperror

const (
	// Validation / Client
	Validation = "VALIDATION_ERROR"
	BadRequest = "BAD_REQUEST"
	NotFound   = "NOT_FOUND"
	Conflict   = "CONFLICT"

	// Auth
	Unauthorized = "UNAUTHORIZED"
	Forbidden    = "FORBIDDEN"

	// Business Logic
	OperationNotAllowed = "OPERATION_NOT_ALLOWED"
	InsufficientFunds   = "INSUFFICIENT_FUNDS"

	// Repository / External
	DatabaseError      = "DATABASE_ERROR"
	ServiceUnavailable = "SERVICE_UNAVAILABLE"

	// System
	Internal = "INTERNAL_SERVER_ERROR"
)
