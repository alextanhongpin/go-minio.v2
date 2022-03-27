const ASSET_BASE_URL = "http://localhost:9000/assets";

export function isInternalImageSource(url) {
  return url.startsWith(ASSET_BASE_URL);
}

// When an image is selected by the user,
// I want to upload it to my cloud storage,
// And then return the url of the image,
// So that I can use the url in my application.
export async function uploadImage(file) {
  const resp = await fetch(
    `http://localhost:8080/presign?fileType=${file.type}`
  );
  const body = await resp.json();
  const { assetUrl, presignUrl, formData } = body;

  const form = new FormData();
  for (const [key, value] of Object.entries(formData)) {
    form.append(key, value);
  }
  form.append("content-type", file.type);

  // This must come last.
  form.append("file", file);

  {
    // NOTE: There's also presigned PUT, which is
    // different from presigned POST.
    const resp = await fetch(presignUrl, {
      method: "POST",
      body: form,
    });

    if (resp.status !== 204) {
      throw new Error("Unable to upload image");
    }
  }
  return assetUrl;
}

// When an external url is provided,
// I want to download the image locally first,
// And then reupload it back to my own cloud storage,
// In order not to violate the copyright.
export async function downloadImage(url) {
  const resp = await fetch(new Request(url));
  const contentType = resp.headers.get("content-type");
  if (!contentType.startsWith("image/")) {
    throw new Error(`source url is not an image: ${contentType}`);
  }
  const blob = await resp.blob();
  return blob;
}
