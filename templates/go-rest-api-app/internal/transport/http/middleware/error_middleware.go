package middleware

import (
	"errors"
	"net/http"

	"{{module_name}}/internal/transport/http/apperror"
	"{{module_name}}/internal/transport/http/controller/helper"

	"github.com/gin-gonic/gin"
)

func ErrorMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next() // execute handlers

		// check if there is an error returned
		if len(c.Errors) > 0 {
			err := c.Errors.Last().Err

			var appErr *apperror.AppError
			if !errors.As(err, &appErr) {
				appErr = apperror.FromDomainError(err)
			}

			if appErr != nil {
				c.JSON(appErr.StatusCode(),
					helper.BaseResponse{Status: "error", Message: appErr.Message, Error: appErr},
				)
			} else {
				c.JSON(http.StatusInternalServerError,
					helper.BaseResponse{Status: "error", Message: err.Error()},
				)
			}

			c.Abort()
		}
	}
}
