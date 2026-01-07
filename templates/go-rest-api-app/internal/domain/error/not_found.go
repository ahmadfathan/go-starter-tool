package domainerr

import "fmt"

// NotFoundError tells WHAT domain object was not found
type NotFoundError struct {
	Entity string // e.g. "User", "Order"
	ID     string // optional
}

func (e *NotFoundError) Error() string {
	if e.ID != "" {
		return fmt.Sprintf("%s with id %s not found", e.Entity, e.ID)
	}
	return e.Entity + " not found"
}
