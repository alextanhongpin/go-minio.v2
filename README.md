# Generic Image Upload


Context:
- we want a performant way to upload images, without going through the server
- we use the concept of presign url
- client requests a presign url for a given image type
- server generates a presign url with validation rules
- client uploads the image to the presign url
- client receives a response with the image url
- this url can then be associated with any relations in the database, and used as it is
