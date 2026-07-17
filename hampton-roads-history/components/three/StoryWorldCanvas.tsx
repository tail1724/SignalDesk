"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Decorative scene behind the cinematic hero (CivicHero). Client-only,
// dynamically imported via StoryWorldPoster so the `three` bundle never
// ships on first load or competes with the LCP element (the poster image).
// Budget: one draw call, ~2,000 points, no textures — comfortably inside
// the ≤45 draw calls / ≤60k tris / ≤32MB texture ceiling in
// design-blueprint.html §03. Pauses when off-viewport or the tab is hidden;
// bails out entirely under Save-Data or a failed WebGL context.
export function StoryWorldCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (nav.connection?.saveData) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const maxDpr = isMobile ? 1.5 : 2;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.4, 6);
    camera.lookAt(0, -0.5, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // no WebGL — StoryWorldPoster's static image already covers this
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(14, 9, 56, 36);
    geometry.rotateX(-Math.PI / 2.15);
    const position = geometry.attributes.position;
    const basePositions = Float32Array.from(position.array);

    const material = new THREE.PointsMaterial({
      size: 0.028,
      color: new THREE.Color("#c99a42"),
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const clock = new THREE.Clock();
    let elapsed = 0;
    let frameId = 0;
    let running = true;

    function animate() {
      frameId = requestAnimationFrame(animate);
      if (!running) return;
      elapsed += clock.getDelta();

      for (let i = 0; i < position.count; i++) {
        const x = basePositions[i * 3];
        const z = basePositions[i * 3 + 2];
        const y =
          Math.sin(x * 0.6 + elapsed * 0.6) * 0.15 + Math.cos(z * 0.5 + elapsed * 0.45) * 0.15;
        position.setY(i, y);
      }
      position.needsUpdate = true;

      renderer.render(scene, camera);
    }
    animate();

    function handleResize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", handleResize);

    function handleVisibility() {
      running = !document.hidden;
    }
    document.addEventListener("visibilitychange", handleVisibility);

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        running = !document.hidden && (entries[0]?.isIntersecting ?? false);
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      visibilityObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden />;
}
