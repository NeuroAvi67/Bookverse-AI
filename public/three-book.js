/**
 * ==============================================================================
 * BOOKVERSE AI — INTERACTIVE 3D BOOK ENGINE (Three.js & GSAP)
 * ==============================================================================
 * Renders a high-fidelity 3D hardcover book with:
 * 1. Realistic thickness, spine curvature, and paper edge ridges
 * 2. Dynamic cover texturing from Google Books / Open Library
 * 3. Subtle floating physics and ambient champagne/blue studio lighting
 * 4. Interactive cover opening and page reveal animations
 * 5. Touch / pointer drag orbit and raycast interaction
 * 6. Automatic 2D fallback for low-spec devices or reduced-motion
 * ==============================================================================
 */

class Interactive3DBookEngine {
  constructor(containerId = 'book-canvas-container') {
    this.container = document.getElementById(containerId);
    this.isOpen = false;
    this.is3DActive = true;
    this.pointerDown = false;
    this.prevPointerPos = { x: 0, y: 0 };
    this.targetRotation = { x: 0.15, y: -0.45 };
    this.currentRotation = { x: 0.15, y: -0.45 };
    this.idleTime = 0;
    
    // Check WebGL availability
    if (!this.checkWebGLSupport()) {
      console.warn('WebGL not supported or disabled. Falling back to 2D Book View.');
      this.activate2DFallback();
      return;
    }

    this.init();
  }

  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  init() {
    if (!this.container) return;

    // Dimensions
    this.width = this.container.clientWidth || 500;
    this.height = this.container.clientHeight || 480;

    // 1. Scene, Camera & Renderer
    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0.4, 5.8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 2. Realistic Studio Lighting
    this.setupLighting();

    // 3. Build 3D Hardcover Book Geometry
    this.createBookMesh();

    // 4. Ground Shadow Receiver
    this.createContactShadow();

    // 5. Input Listeners (Drag, Hover, Touch, Click)
    this.setupEventListeners();

    // 6. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Ambient fill with midnight navy tone
    const ambientLight = new THREE.AmbientLight(0x475569, 1.4);
    this.scene.add(ambientLight);

    // Warm champagne key light with soft shadow
    this.keyLight = new THREE.DirectionalLight(0xFFF3D6, 2.2);
    this.keyLight.position.set(4, 5, 5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 15;
    this.keyLight.shadow.bias = -0.001;
    this.scene.add(this.keyLight);

    // Electric blue rim backlight for cinematic silhouette
    const rimLight = new THREE.DirectionalLight(0x38BDF8, 1.6);
    rimLight.position.set(-5, 3, -4);
    this.scene.add(rimLight);

    // Subtle soft bottom bounce
    const bounceLight = new THREE.PointLight(0xD4AF37, 0.8, 10);
    bounceLight.position.set(0, -2, 2);
    this.scene.add(bounceLight);
  }

  createBookMesh() {
    // Book Dimensions
    this.bookWidth = 2.4;
    this.bookHeight = 3.5;
    this.bookDepth = 0.42;

    this.bookGroup = new THREE.Group();
    this.bookGroup.position.set(0, 0, 0);

    // --- A. TEXTURES ---
    this.textureLoader = new THREE.TextureLoader();
    this.defaultCoverTexture = this.createDefaultCoverCanvas('DUNE', 'Frank Herbert');

    // Materials
    this.leatherMaterial = new THREE.MeshStandardMaterial({
      color: 0x071126,
      roughness: 0.45,
      metalness: 0.15
    });

    this.goldTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      roughness: 0.25,
      metalness: 0.85
    });

    this.pagesMaterial = new THREE.MeshStandardMaterial({
      color: 0xF8F6ED,
      roughness: 0.85,
      metalness: 0.05
    });

    // --- B. PAGES BLOCK (Inner Paper Volume) ---
    const pagesGeo = new THREE.BoxGeometry(
      this.bookWidth - 0.08,
      this.bookHeight - 0.14,
      this.bookDepth - 0.08
    );
    this.pagesMesh = new THREE.Mesh(pagesGeo, this.pagesMaterial);
    this.pagesMesh.position.set(0.02, 0, 0);
    this.pagesMesh.castShadow = true;
    this.pagesMesh.receiveShadow = true;
    this.bookGroup.add(this.pagesMesh);

    // --- C. BACK COVER ---
    const backCoverGeo = new THREE.BoxGeometry(this.bookWidth, this.bookHeight, 0.04);
    this.backCoverMesh = new THREE.Mesh(backCoverGeo, this.leatherMaterial);
    this.backCoverMesh.position.set(0, 0, -this.bookDepth / 2 + 0.02);
    this.backCoverMesh.castShadow = true;
    this.bookGroup.add(this.backCoverMesh);

    // --- D. SPINE (Curved Left Edge) ---
    const spineGeo = new THREE.CylinderGeometry(
      this.bookDepth / 2,
      this.bookDepth / 2,
      this.bookHeight,
      16,
      1,
      false,
      Math.PI / 2,
      Math.PI
    );
    this.spineMesh = new THREE.Mesh(spineGeo, this.leatherMaterial);
    this.spineMesh.rotation.y = Math.PI / 2;
    this.spineMesh.position.set(-this.bookWidth / 2, 0, 0);
    this.bookGroup.add(this.spineMesh);

    // --- E. FRONT COVER & PIVOT GROUP ---
    // The pivot point must be anchored along the left spine edge to swing open realistically
    this.coverPivot = new THREE.Group();
    this.coverPivot.position.set(-this.bookWidth / 2, 0, this.bookDepth / 2 - 0.02);

    const frontCoverGeo = new THREE.BoxGeometry(this.bookWidth, this.bookHeight, 0.04);
    // Multi-material: front face gets the artwork texture, edges get leather
    const frontFaceMaterial = new THREE.MeshStandardMaterial({
      map: this.defaultCoverTexture,
      roughness: 0.35,
      metalness: 0.1
    });

    const coverMaterials = [
      this.leatherMaterial, // right
      this.leatherMaterial, // left
      this.leatherMaterial, // top
      this.leatherMaterial, // bottom
      frontFaceMaterial,    // front cover art
      this.pagesMaterial    // inside front cover (paper end-leaf)
    ];

    this.frontCoverMesh = new THREE.Mesh(frontCoverGeo, coverMaterials);
    // Center the mesh relative to its left-hand pivot
    this.frontCoverMesh.position.set(this.bookWidth / 2, 0, 0);
    this.frontCoverMesh.castShadow = true;

    this.coverPivot.add(this.frontCoverMesh);
    this.bookGroup.add(this.coverPivot);

    // Initial group placement
    this.bookGroup.rotation.x = this.targetRotation.x;
    this.bookGroup.rotation.y = this.targetRotation.y;
    this.scene.add(this.bookGroup);
  }

  createContactShadow() {
    const shadowGeo = new THREE.PlaneGeometry(8, 8);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.2;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);
  }

  createDefaultCoverCanvas(title = 'DUNE', author = 'Frank Herbert') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1536;
    const ctx = canvas.getContext('2d');

    // Rich dark gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#09152E');
    grad.addColorStop(0.5, '#050B17');
    grad.addColorStop(1, '#020409');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Champagne gold double border
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 14;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(85, 85, canvas.width - 170, canvas.height - 170);

    // Central Emblem
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 500, 140, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Geometric Crest
    ctx.font = '72px "Cinzel", serif';
    ctx.fillStyle = '#D4AF37';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BV', canvas.width / 2, 500);
    ctx.restore();

    // Title
    ctx.fillStyle = '#FFF8E7';
    ctx.font = 'bold 76px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.toUpperCase(), canvas.width / 2, 820);

    // Subtitle / Tagline
    ctx.fillStyle = '#38BDF8';
    ctx.font = '28px "JetBrains Mono", monospace';
    ctx.letterSpacing = '6px';
    ctx.fillText('CANONICAL MASTERWORK', canvas.width / 2, 900);

    // Gold Divider line
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(300, 960);
    ctx.lineTo(canvas.width - 300, 960);
    ctx.stroke();

    // Author
    ctx.fillStyle = '#D4AF37';
    ctx.font = '500 46px "Inter", sans-serif';
    ctx.fillText(author, canvas.width / 2, 1100);

    // Bottom Badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '24px "Inter", sans-serif';
    ctx.fillText('BOOKVERSE AI CURATED ARCHIVE', canvas.width / 2, 1400);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return texture;
  }

  /**
   * Updates cover texture with remote image or newly generated canvas
   */
  updateBookCover(imageUrl, title, author) {
    if (!this.frontCoverMesh) return;

    if (imageUrl && !imageUrl.includes('placeholder')) {
      this.textureLoader.load(
        imageUrl,
        (loadedTex) => {
          loadedTex.anisotropy = 8;
          this.frontCoverMesh.material[4].map = loadedTex;
          this.frontCoverMesh.material[4].needsUpdate = true;
        },
        undefined,
        () => {
          // On image load failure, use generated typography canvas
          const fallbackTex = this.createDefaultCoverCanvas(title, author);
          this.frontCoverMesh.material[4].map = fallbackTex;
          this.frontCoverMesh.material[4].needsUpdate = true;
        }
      );
    } else {
      const customTex = this.createDefaultCoverCanvas(title, author);
      this.frontCoverMesh.material[4].map = customTex;
      this.frontCoverMesh.material[4].needsUpdate = true;
    }
  }

  /**
   * Interactive Cover Opening Animation via GSAP
   */
  openBook(onComplete) {
    if (!this.coverPivot || this.isOpen) return;
    this.isOpen = true;

    // Smooth camera shift and book rotation towards user
    gsap.to(this.bookGroup.rotation, {
      x: 0.1,
      y: -0.15,
      duration: 1.2,
      ease: 'power3.out'
    });

    gsap.to(this.bookGroup.position, {
      x: 0.4,
      y: 0.1,
      duration: 1.2,
      ease: 'power3.out'
    });

    // Animate front cover swing open
    gsap.to(this.coverPivot.rotation, {
      y: -Math.PI * 0.88, // Opens ~160 degrees
      duration: 1.4,
      ease: 'power3.inOut',
      onComplete: () => {
        if (typeof onComplete === 'function') onComplete();
      }
    });

    // Slight flutter on pages mesh to simulate page tension
    gsap.to(this.pagesMesh.rotation, {
      y: -0.05,
      duration: 1.2,
      ease: 'power2.out'
    });

    const statusPill = document.getElementById('stage-book-status');
    if (statusPill) statusPill.innerText = 'Volume Unfolded';
  }

  /**
   * Close Book Cover Animation
   */
  closeBook(onComplete) {
    if (!this.coverPivot || !this.isOpen) return;
    this.isOpen = false;

    gsap.to(this.coverPivot.rotation, {
      y: 0,
      duration: 1.1,
      ease: 'power3.inOut'
    });

    gsap.to(this.pagesMesh.rotation, {
      y: 0,
      duration: 1.1,
      ease: 'power2.inOut'
    });

    gsap.to(this.bookGroup.position, {
      x: 0,
      y: 0,
      duration: 1.1,
      ease: 'power2.out'
    });

    gsap.to(this.bookGroup.rotation, {
      x: this.targetRotation.x,
      y: this.targetRotation.y,
      duration: 1.1,
      ease: 'power2.out',
      onComplete: () => {
        if (typeof onComplete === 'function') onComplete();
      }
    });

    const statusPill = document.getElementById('stage-book-status');
    if (statusPill) statusPill.innerText = 'Interactive 3D Hardcover';
  }

  toggleOpen() {
    if (this.isOpen) {
      this.closeBook();
    } else {
      this.openBook();
    }
  }

  resetCamera() {
    gsap.to(this.targetRotation, { x: 0.15, y: -0.45, duration: 0.8, ease: 'power2.out' });
    gsap.to(this.camera.position, { x: 0, y: 0.4, z: 5.8, duration: 0.8, ease: 'power2.out' });
    this.closeBook();
  }

  setupEventListeners() {
    const dom = this.renderer.domElement;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    // Mouse Down / Touch Start
    const onStart = (e) => {
      this.pointerDown = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.prevPointerPos = { x: clientX, y: clientY };
    };

    // Mouse Move / Touch Move
    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (this.pointerDown && !this.isOpen) {
        const deltaX = clientX - this.prevPointerPos.x;
        const deltaY = clientY - this.prevPointerPos.y;

        this.targetRotation.y += deltaX * 0.008;
        this.targetRotation.x += deltaY * 0.006;

        // Clamp vertical pitch to keep the book upright
        this.targetRotation.x = Math.max(-0.5, Math.min(0.6, this.targetRotation.x));
        this.prevPointerPos = { x: clientX, y: clientY };
        this.idleTime = 0;
      }

      // Parallax update
      const rect = dom.getBoundingClientRect();
      this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    // Mouse Up / Touch End
    const onEnd = () => {
      this.pointerDown = false;
    };

    // Click to Open
    const onClick = () => {
      if (this.isOpen) return;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObject(this.frontCoverMesh, true);
      if (intersects.length > 0) {
        this.openBook(() => {
          if (window.openActiveBookStudio) window.openActiveBookStudio();
        });
      }
    };

    dom.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    dom.addEventListener('click', onClick);

    dom.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);

    // Window Resize
    window.addEventListener('resize', () => {
      if (!this.container) return;
      this.width = this.container.clientWidth;
      this.height = this.container.clientHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });

    // Control buttons hooks
    const openBtn = document.getElementById('open-book-btn');
    if (openBtn) {
      openBtn.addEventListener('click', () => this.toggleOpen());
    }

    const resetBtn = document.getElementById('reset-3d-cam-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetCamera());
    }

    const modeBtn = document.getElementById('toggle-3d-mode-btn');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => this.toggle2DFallback());
    }
  }

  toggle2DFallback() {
    this.is3DActive = !this.is3DActive;
    const canvasDom = this.renderer.domElement;
    const fallbackDom = document.getElementById('fallback-2d-container');
    const modeLabel = document.getElementById('mode-label');

    if (this.is3DActive) {
      if (canvasDom) canvasDom.style.display = 'block';
      if (fallbackDom) fallbackDom.style.display = 'none';
      if (modeLabel) modeLabel.innerText = '3D Engine';
    } else {
      if (canvasDom) canvasDom.style.display = 'none';
      if (fallbackDom) fallbackDom.style.display = 'flex';
      if (modeLabel) modeLabel.innerText = '2D Fallback';
    }
  }

  activate2DFallback() {
    this.is3DActive = false;
    const fallbackDom = document.getElementById('fallback-2d-container');
    const modeLabel = document.getElementById('mode-label');
    if (fallbackDom) fallbackDom.style.display = 'flex';
    if (modeLabel) modeLabel.innerText = '2D Fallback';
  }

  animate() {
    requestAnimationFrame(this.animate);
    if (!this.is3DActive) return;

    this.idleTime += 0.01;

    // Smooth rotational interpolation (damping)
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;

    if (!this.isOpen) {
      this.bookGroup.rotation.x = this.currentRotation.x;
      this.bookGroup.rotation.y = this.currentRotation.y;

      // Subtle breathing float physics
      this.bookGroup.position.y = Math.sin(this.idleTime * 1.5) * 0.08;
      this.bookGroup.position.x = Math.cos(this.idleTime * 0.8) * 0.03;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.book3DEngine = new Interactive3DBookEngine('book-canvas-container');
});
