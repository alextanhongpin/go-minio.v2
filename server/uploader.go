package main

import (
	"context"
	"errors"
	"fmt"
	"mime"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	minio "github.com/minio/minio-go/v7"
)

type ImageUploader struct {
	client *minio.Client
	bucket string
}

func NewImageUploader(client *minio.Client, bucket string) *ImageUploader {
	return &ImageUploader{
		client: client,
		bucket: bucket,
	}
}

func (u *ImageUploader) PresignURL(ctx context.Context, folder, fileType string) (*url.URL, string, map[string]string, error) {
	// Initialize policy condition config.
	policy := minio.NewPostPolicy()

	key, err := newFileNameInFolder(folder, fileType)
	if err != nil {
		return nil, "", nil, err
	}

	// Apply upload policy restrictions.
	policy.SetBucket(u.bucket)
	policy.SetKey(key)
	policy.SetExpires(time.Now().Add(15 * time.Minute))

	// Only allow images.
	policy.SetContentType(fileType)

	// Only allow content size in range 1KB to 5MB.
	policy.SetContentLengthRange(1024, 5*1024*1024)

	// Add a user metadata using key custom and value user.
	// NOTE: Might be useful?
	policy.SetUserMetadata("custom", "user")

	url, formData, err := u.client.PresignedPostPolicy(ctx, policy)
	return url, key, formData, err
}

var ErrExtensionNotFound = errors.New("extension not found")

func extensionByType(mimeType string) (extension string, err error) {
	if !strings.HasPrefix(mimeType, "image/") {
		return "", ErrExtensionNotFound
	}
	v, err := mime.ExtensionsByType(mimeType)
	if err != nil {
		return "", fmt.Errorf("%w: %s", ErrExtensionNotFound, err)
	}
	if len(v) == 0 {
		t := strings.Join(v, ", ")
		if t == "" {
			t = "none"
		}
		return "", fmt.Errorf("%w: %s", ErrExtensionNotFound, t)
	}
	// For image/jpeg, it returns ['.jpe', '.jpeg', '.jpg']
	// We take the last one ...
	return v[len(v)-1], nil
}

func newFileNameInFolder(folder, fileType string) (string, error) {
	ext, err := extensionByType(fileType) // E.g. image/png, image/svg+xml
	if err != nil {
		return "", err
	}
	// Remove leading dot.
	ext = strings.TrimPrefix(ext, ".")

	// Remove leading and trailing slashes.
	folder = strings.TrimPrefix(folder, "/")
	folder = strings.TrimSuffix(folder, "/")

	// Image name is always a uniquely generated UUID.
	id := uuid.New()

	// Possible to not have folder. Images will be stored in root folder.
	if folder == "" {
		return fmt.Sprintf("%s.%s", id, ext), nil
	}

	return fmt.Sprintf("%s/%s.%s", folder, id, ext), nil
}
