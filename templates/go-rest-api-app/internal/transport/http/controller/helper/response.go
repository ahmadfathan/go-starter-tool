package helper

import (
	"fmt"
	"io"

	"github.com/gin-gonic/gin"
)

type BaseResponse struct {
	Status  string         `json:"status"`
	Message string         `json:"message"`
	Data    any            `json:"data,omitempty"`
	Error   any            `json:"error,omitempty"`
	Meta    map[string]any `json:"meta,omitempty"`
}

func WriteSuccessResponse(c *gin.Context, statusCode int, message string, data any, meta map[string]any) {
	c.JSON(statusCode, BaseResponse{Status: "success", Message: message, Data: data, Meta: meta})
}

func WriteErrorResponse(c *gin.Context, err error) {
	c.Error(err)
}

func WriteFileDownloadResponse(c *gin.Context, data io.Reader, filename string) {

	// Set headers
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Header("Content-Type", "application/octet-stream")

	// Stream the file
	_, _ = io.Copy(c.Writer, data)

}
