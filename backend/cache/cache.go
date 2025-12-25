package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client
var ctx = context.Background()

func Init() error {
	host := os.Getenv("REDIS_HOST")
	if host == "" {
		host = "localhost"
	}
	port := os.Getenv("REDIS_PORT")
	if port == "" {
		port = "6379"
	}
	password := os.Getenv("REDIS_PASSWORD")

	Client = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", host, port),
		Password: password,
		DB:       0,
	})

	_, err := Client.Ping(ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return nil
}

func GetTasksByBoardID(boardID string) ([]byte, error) {
	key := fmt.Sprintf("tasks:board:%s", boardID)
	val, err := Client.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, nil
	} else if err != nil {
		return nil, err
	}

	return []byte(val), nil
}

func SetTasksByBoardID(boardID string, tasks interface{}, expiration time.Duration) error {
	key := fmt.Sprintf("tasks:board:%s", boardID)
	data, err := json.Marshal(tasks)
	if err != nil {
		return err
	}

	return Client.Set(ctx, key, data, expiration).Err()
}

func GetAllTasks() ([]byte, error) {
	key := "tasks:all"
	val, err := Client.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, nil
	} else if err != nil {
		return nil, err
	}

	return []byte(val), nil
}

func SetAllTasks(tasks interface{}, expiration time.Duration) error {
	key := "tasks:all"
	data, err := json.Marshal(tasks)
	if err != nil {
		return err
	}

	return Client.Set(ctx, key, data, expiration).Err()
}

func InvalidateBoardTasks(boardID string) error {
	key := fmt.Sprintf("tasks:board:%s", boardID)
	return Client.Del(ctx, key).Err()
}

func InvalidateAllTasks() error {
	if err := Client.Del(ctx, "tasks:all").Err(); err != nil {
		return err
	}

	keys, err := Client.Keys(ctx, "tasks:board:*").Result()
	if err != nil {
		return err
	}

	if len(keys) > 0 {
		return Client.Del(ctx, keys...).Err()
	}

	return nil
}
