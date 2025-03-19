# Blur Image Generator

This extension automatically generates blurred image placeholders using either Blurhash or Thumbhash algorithms and stores them as metadata for your Directus files.

## Installation

There are two primary ways to install this extension:

1. **Using the Directus Marketplace (Recommended)**
   - Navigate to Settings > Extensions
   - Search for "Blur Image Generator"
   - Click Install

2. **Manual Installation**
   - Download the extension files
   - Place them in your Directus project's `extensions` directory
   - Restart your Directus instance

## Configuration

After installation, configure the extension through the Directus settings:

1. Navigate to Settings > Settings
2. Scroll to the bottom to find the "Blur Hash Generator" section
3. Choose your preferred hash algorithm:
   - **[Thumbhash](https://github.com/evanw/thumbhash)** (default): An efficient algorithm that produces compact image placeholders
   - **[Blurhash](https://github.com/woltapp/blurhash)**: An alternative algorithm with different visual characteristics

## Usage

Once configured, the extension will automatically generate and store hash values for newly uploaded images. These hashes will be available in the files metadata.
Once every startup it will check for image files without a blur hash configured and apply it to them.
If you change the settings to another algorithm it will also apply the new hash to all images again. Be carful if you have a large files set and prepare for some heavy load spikes.

> The Hash itself is converted to base64 in case of Thumbhash to prevent escaping errors. So it needs to be converted to binary before transforming into a base64 data url.

The hash size should be around **20 to 30 bytes** and after you create the data url out of the hash it's size should be around **20kb**. This size only applies to the client and is never transfered over the network. That is the magic of the blurred images as hashes.

### Accessing the Hash

When you query files through the Directus API, the hash will be included in the data with the key `blur_img_hash`.

```json
{
  "id": "###",
  "title": "example.jpg",
  "blur_img_hash":"1QcSHQRnh493V4dIh4eXh1h4",
}
```

## Client Implementation Examples

### Thumbhash (Default)

#### React with thumbhash package

```bash
npm install thumbhash
```

```jsx
import { thumbHashToDataURL } from 'thumbhash';

function Image({ src, alt, hash }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Convert base64 hash to binary array
  const binaryThumbHash = hash ? Uint8Array.from(atob(hash), c => c.charCodeAt(0)) : null;
  
  // Generate blur placeholder as data URL
  const placeholderUrl = binaryThumbHash ? thumbHashToDataURL(binaryThumbHash) : null;
  
  return (
    <div style={{ position: "relative" }}>
      {!imageLoaded && placeholderUrl && (
        <img
          src={placeholderUrl}
          alt="Loading placeholder"
          style={{ position: "absolute", width: "100%", height: "100%" }}
        />
      )}
      <img
        src={src}
        alt={alt}
        style={{ display: imageLoaded ? "block" : "none" }}
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  );
}
```

### Blurhash

#### React with blurhash package

```bash
npm install blurhash react-blurhash
```

```jsx
import { Blurhash } from "react-blurhash";

function Image({ src, alt, hash }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  return (
    <div style={{ position: "relative" }}>
      {!imageLoaded && hash && (
        <Blurhash
          hash={hash}
          width="100%"
          height="100%"
          resolutionX={32}
          resolutionY={32}
          punch={1}
        />
      )}
      <img
        src={src}
        alt={alt}
        style={{ display: imageLoaded ? "block" : "none" }}
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  );
}
```

#### Vue with thumbhash package

```bash
npm install thumbhash
```

```javascript
<template>
  <div class="image-container">
    <img
      v-if="!imageLoaded && placeholderUrl"
      :src="placeholderUrl"
      alt="Loading placeholder"
      class="placeholder"
    />
    <img
      :src="src"
      :alt="alt"
      :style="{ display: imageLoaded ? 'block' : 'none' }"
      @load="imageLoaded = true"
    />
  </div>
</template>

<script>
import { thumbHashToDataURL } from 'thumbhash';

export default {
  props: {
    src: String,
    alt: String,
    hash: String
  },
  data() {
    return {
      imageLoaded: false
    }
  },
  computed: {
    placeholderUrl() {
      if (!this.hash) return null;
      const binaryThumbHash = Uint8Array.from(atob(this.hash), c => c.charCodeAt(0));
      return thumbHashToDataURL(binaryThumbHash);
    }
  }
}
</script>

<style scoped>
.image-container {
  position: relative;
}
.placeholder {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
```

#### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/thumbhash/dist/thumbhash.js"></script>
  <style>
    .image-container {
      position: relative;
    }
    .placeholder {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div class="image-container" id="imageContainer">
    <!-- Placeholder will be inserted here -->
    <img id="mainImage" src="your-image-url.jpg" alt="Example image" style="display: none;">
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Get image data from Directus API by ID
      const imageId = 'your-image-id'; // Replace with actual image ID
      const response = await fetch(`/assets/${imageId}?fields=id,blur_img_hash,title`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const { blur_img_hash: hash } = data.data; // Get hash from image data
      const imageContainer = document.getElementById('imageContainer');
      const mainImage = document.getElementById('mainImage');
      
      // Convert base64 hash to binary array
      const binaryThumbHash = hash ? new Uint8Array(atob(hash).split('').map(c => c.charCodeAt(0))) : null;
      
      // Generate blur placeholder as data URL
      if (binaryThumbHash) {
        const placeholderUrl = thumbhash.thumbHashToDataURL(binaryThumbHash);
        
        // Create and insert placeholder image
        const placeholderImg = document.createElement('img');
        placeholderImg.src = placeholderUrl;
        placeholderImg.alt = "Loading placeholder";
        placeholderImg.className = "placeholder";
        imageContainer.insertBefore(placeholderImg, mainImage);
        
        // Show main image and remove placeholder when loaded
        mainImage.onload = function() {
          mainImage.style.display = 'block';
          placeholderImg.remove();
        };
      }
    });
  </script>
</body>
</html>
```

## License

This project is licensed under the MIT License.

## Additional Resources

- [Blurhash GitHub Repository](https://github.com/woltapp/blurhash)
- [Thumbhash GitHub Repository](https://github.com/evanw/thumbhash)
- [Directus Extensions Documentation](https://directus.io/docs/extensions)
