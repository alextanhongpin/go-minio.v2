package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	minio "github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func main() {
	endpoint := "127.0.0.1:9000"
	accessKeyID := "minioadmin"
	secretAccessKey := "minioadmin"
	bucketName := "assets"
	folder := "images"
	useSSL := false

	publicEndpoint := fmt.Sprintf("http://%s/%s", endpoint, bucketName)

	// Initialize minio client object.
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Fatalln(err)
	}

	uploader := NewImageUploader(minioClient, bucketName)

	mux := http.NewServeMux()
	mux.HandleFunc("/presign", CORS(Presign(uploader, folder, publicEndpoint)))

	fmt.Println("Listening on port :8080. Press Ctrl+C to exit.")
	http.ListenAndServe(":8080", mux)
}

func Presign(uploader *ImageUploader, folder, publicEndpoint string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		fileType := r.URL.Query().Get("fileType")
		ctx := r.Context()
		presignURL, assetPath, formData, err := uploader.PresignURL(ctx, folder, fileType)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		type response struct {
			PresignURL string            `json:"presignUrl"`
			AssetURL   string            `json:"assetUrl"`
			FormData   map[string]string `json:"formData"`
		}
		err = json.NewEncoder(w).Encode(response{
			PresignURL: presignURL.String(),
			AssetURL:   publicEndpoint + "/" + assetPath,
			FormData:   formData,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

func CORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Access-Control-Allow-Origin", "*")
		w.Header().Add("Access-Control-Allow-Credentials", "true")
		w.Header().Add("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		w.Header().Add("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")

		if r.Method == "OPTIONS" {
			http.Error(w, "No Content", http.StatusNoContent)
			return
		}

		next(w, r)
	}
}
