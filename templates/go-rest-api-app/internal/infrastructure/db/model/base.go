package model

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type Base struct {
	ID        uuid.UUID    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	CreatedAt time.Time    `gorm:"column:created_at"`
	UpdatedAt sql.NullTime `gorm:"column:updated_at"`
}
