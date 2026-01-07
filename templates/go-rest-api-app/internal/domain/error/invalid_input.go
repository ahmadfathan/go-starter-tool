package domainerr

type InvalidInputError struct {
	Field  string // e.g. "email"
	Reason string // e.g. "invalid format"
}

func (e *InvalidInputError) Error() string {
	return "invalid input"
}
