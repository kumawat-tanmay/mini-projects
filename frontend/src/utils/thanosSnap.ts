import gsap from 'gsap';

// Dynamically load html-to-image to avoid npm install dependencies and support modern CSS (oklch)
async function loadHtmlToImage(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).htmlToImage) {
    return (window as any).htmlToImage;
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js';
    script.onload = () => resolve((window as any).htmlToImage);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Creates a Thanos snap disintegration effect on the given element.
 * Sweeps from left to right.
 */
export async function disintegrate(element: HTMLElement, onComplete: () => void) {
  try {
    const htmlToImage = await loadHtmlToImage();
    
    // Create a wrapper for our canvas layers that sits exactly over the element
    const rect = element.getBoundingClientRect();
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.zIndex = '9999';
    wrapper.style.pointerEvents = 'none';
    
    // NoteCard is relative, so appending wrapper to it works perfectly
    element.appendChild(wrapper);

    // Hide any scrollbars before capture so they don't get rendered into the dust
    const scrollableElements = element.querySelectorAll('.overflow-y-auto, .overflow-auto');
    const originalStyles = Array.from(scrollableElements).map((el) => {
      const htmlEl = el as HTMLElement;
      const original = htmlEl.style.overflow;
      htmlEl.style.overflow = 'hidden';
      return { el: htmlEl, original };
    });

    // Capture the element as a canvas natively
    const canvas = await htmlToImage.toCanvas(element, {
      backgroundColor: null,
      pixelRatio: 1, // Keep scale 1 for performance
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      onComplete();
      return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixelArr = imageData.data;

    // Number of canvas layers to create the dust effect
    const layerCount = 32;
    const canvasLayers: HTMLCanvasElement[] = [];
    const ctxLayers: CanvasRenderingContext2D[] = [];

    for (let i = 0; i < layerCount; i++) {
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      c.style.position = 'absolute';
      c.style.top = '0';
      c.style.left = '0';
      c.style.width = '100%';
      c.style.height = '100%';
      wrapper.appendChild(c);
      canvasLayers.push(c);
      
      const layerCtx = c.getContext('2d');
      if (layerCtx) {
        ctxLayers.push(layerCtx);
      }
    }

    // Create empty image data for each layer
    const imageDataLayers = ctxLayers.map(c => c.createImageData(width, height));

    // Distribute pixels across layers, heavily weighted by X coordinate to create left-to-right flow
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const pIndex = (x + y * width) * 4;
        // Skip transparent pixels
        if (pixelArr[pIndex + 3] === 0) continue;

        // Base layer distribution
        // To make it sweep left-to-right, we cluster the layers based on X
        // Further right pixels go to earlier layers (or later) depending on how we animate
        let layerIndex = Math.floor((layerCount * (Math.random() + (x / width) * 2)) / 3);
        if (layerIndex >= layerCount) layerIndex = layerCount - 1;

        const targetData = imageDataLayers[layerIndex].data;
        targetData[pIndex] = pixelArr[pIndex];
        targetData[pIndex + 1] = pixelArr[pIndex + 1];
        targetData[pIndex + 2] = pixelArr[pIndex + 2];
        targetData[pIndex + 3] = pixelArr[pIndex + 3];
      }
    }

    // Put image data into layer canvases
    ctxLayers.forEach((layerCtx, i) => {
      layerCtx.putImageData(imageDataLayers[i], 0, 0);
    });

    // Hide the original content of the element (e.g. .note-inner, footer, etc)
    const children = Array.from(element.children) as HTMLElement[];
    children.forEach(child => {
      if (child !== wrapper) {
        child.style.opacity = '0';
      }
    });

    // Animate the canvas layers
    const tl = gsap.timeline({
      onComplete: () => {
        wrapper.remove();
        onComplete();
      }
    });

    canvasLayers.forEach((layer, i) => {
      const randomAngle = (Math.random() - 0.5) * 15;
      const randomX = 100 + Math.random() * 100;
      const randomY = (Math.random() - 0.5) * 100;
      
      // Delay based on X position cluster (simulated by layer index here)
      // Since layerIndex is somewhat tied to X (right side has higher index),
      // we animate lower indexes (left side) first.
      const delay = (i / layerCount) * 1.5;

      tl.to(layer, {
        x: randomX,
        y: randomY,
        rotation: randomAngle,
        opacity: 0,
        duration: 1.5 + Math.random() * 0.5,
        ease: 'power2.out',
      }, delay);
    });

  } catch (error) {
    console.error('Thanos snap failed, falling back to instant delete', error);
    onComplete();
  }
}
