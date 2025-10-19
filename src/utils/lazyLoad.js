/**
 * Lazy Loading Utility for Components
 * Code-split large modals and features for better performance
 */

/**
 * Lazy load a component with loading state
 */
export function lazyLoadComponent(importFn, options = {}) {
  const {
    loading = null,
    error = null,
    delay = 200,
    timeout = 10000
  } = options;

  let component = null;
  let loadPromise = null;
  let loadError = null;
  let isLoading = false;

  return {
    async load() {
      if (component) return component;
      if (loadError) throw loadError;
      if (loadPromise) return loadPromise;

      isLoading = true;
      
      loadPromise = Promise.race([
        importFn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Component load timeout')), timeout)
        )
      ]);

      try {
        const module = await loadPromise;
        component = module.default || module;
        isLoading = false;
        return component;
      } catch (err) {
        loadError = err;
        isLoading = false;
        throw err;
      }
    },
    
    get loading() {
      return isLoading;
    },
    
    get error() {
      return loadError;
    }
  };
}

/**
 * Preload component for better UX
 */
export function preloadComponent(importFn) {
  return importFn().catch(err => {
    console.warn('Failed to preload component:', err);
  });
}

/**
 * Lazy load multiple components
 */
export async function lazyLoadMultiple(components) {
  const promises = Object.entries(components).map(async ([key, importFn]) => {
    const module = await importFn();
    return [key, module.default || module];
  });
  
  const results = await Promise.all(promises);
  return Object.fromEntries(results);
}

/**
 * Preload components on idle
 */
export function preloadOnIdle(importFn, options = {}) {
  const { timeout = 5000 } = options;

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => preloadComponent(importFn), { timeout });
  } else {
    setTimeout(() => preloadComponent(importFn), timeout);
  }
}

/**
 * Preload component on interaction
 */
export function preloadOnInteraction(importFn, element, event = 'mouseenter') {
  const handler = () => {
    preloadComponent(importFn);
    element.removeEventListener(event, handler);
  };
  
  element.addEventListener(event, handler);
  
  return () => element.removeEventListener(event, handler);
}

/**
 * Lazy load with retry logic
 */
export async function lazyLoadWithRetry(importFn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const module = await importFn();
      return module.default || module;
    } catch (error) {
      if (i === retries - 1) throw error;
      
      console.warn(`Component load failed, retrying... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

/**
 * Lazy load image with intersection observer
 */
export function lazyLoadImage(img, options = {}) {
  const { rootMargin = '50px', threshold = 0.01 } = options;

  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without IntersectionObserver
    if (img.dataset.src) {
      img.src = img.dataset.src;
    }
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const lazyImg = entry.target;
        
        if (lazyImg.dataset.src) {
          lazyImg.src = lazyImg.dataset.src;
        }
        
        if (lazyImg.dataset.srcset) {
          lazyImg.srcset = lazyImg.dataset.srcset;
        }
        
        lazyImg.classList.add('loaded');
        observer.unobserve(lazyImg);
      }
    });
  }, { rootMargin, threshold });

  observer.observe(img);
  
  return () => observer.disconnect();
}

/**
 * Lazy load video with intersection observer
 */
export function lazyLoadVideo(video, options = {}) {
  const { rootMargin = '50px', threshold = 0.01 } = options;

  if (!('IntersectionObserver' in window)) {
    // Fallback
    if (video.dataset.src) {
      video.src = video.dataset.src;
      video.load();
    }
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const lazyVideo = entry.target;
        
        if (lazyVideo.dataset.src) {
          lazyVideo.src = lazyVideo.dataset.src;
        }
        
        // Load source elements
        Array.from(lazyVideo.children).forEach(source => {
          if (source.dataset.src) {
            source.src = source.dataset.src;
          }
        });
        
        lazyVideo.load();
        observer.unobserve(lazyVideo);
      }
    });
  }, { rootMargin, threshold });

  observer.observe(video);
  
  return () => observer.disconnect();
}

/**
 * Lazy load all images in container
 */
export function lazyLoadImagesInContainer(container, options = {}) {
  const images = container.querySelectorAll('img[data-src]');
  const cleanupFunctions = [];
  
  images.forEach(img => {
    const cleanup = lazyLoadImage(img, options);
    if (cleanup) cleanupFunctions.push(cleanup);
  });
  
  return () => cleanupFunctions.forEach(cleanup => cleanup());
}

/**
 * Prefetch resource
 */
export function prefetchResource(url, type = 'fetch') {
  const link = document.createElement('link');
  link.rel = type === 'script' ? 'preload' : 'prefetch';
  link.href = url;
  
  if (type === 'script') {
    link.as = 'script';
  } else if (type === 'style') {
    link.as = 'style';
  }
  
  document.head.appendChild(link);
  
  return () => document.head.removeChild(link);
}

/**
 * Dynamic import with error boundary
 */
export async function safeDynamicImport(importFn, fallback = null) {
  try {
    const module = await importFn();
    return module.default || module;
  } catch (error) {
    console.error('Dynamic import failed:', error);
    return fallback;
  }
}

export default {
  lazyLoadComponent,
  preloadComponent,
  lazyLoadMultiple,
  preloadOnIdle,
  preloadOnInteraction,
  lazyLoadWithRetry,
  lazyLoadImage,
  lazyLoadVideo,
  lazyLoadImagesInContainer,
  prefetchResource,
  safeDynamicImport
};
