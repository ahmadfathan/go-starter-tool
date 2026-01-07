package router

import (
	"github.com/gin-gonic/gin"
)

type HandlerOpt struct {
	HTTPMethod   string
	RelativePath string
	Handlers     []gin.HandlerFunc
}

func InitializeRouter(
	debug bool,
	middlewares []gin.HandlerFunc,
	opts ...HandlerOpt,
) *gin.Engine {

	if !debug {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	r.Use(middlewares...)

	// Sample handler
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Server is running",
		})
	})

	for _, v := range opts {
		r.Handle(v.HTTPMethod, v.RelativePath, v.Handlers...)
	}

	return r
}
