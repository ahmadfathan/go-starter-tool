package apperror

import (
	"fmt"

	domainerr "{{module_name}}/internal/domain/error"
)

func FromDomainError(err error) *AppError {
	switch e := err.(type) {
	case *domainerr.NotFoundError:
		return NotFoundError(e.Entity)
	case *domainerr.InvalidInputError:
		return ValidationError("Invalid input", fmt.Sprintf("%s: %s", e.Field, e.Reason))
	default:
		return InternalError(err.Error())
	}
}
