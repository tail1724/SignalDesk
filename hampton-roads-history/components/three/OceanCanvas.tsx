"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Decorative, low-poly wave field behind the homepage hero headline (WS-18).
// Deliberately client-only and dynamically imported (see OceanBackground.tsx)
// so the `three` bundle never ships on the initial page load or blocks the
// LCP text element in HeroBentoGrid — this is pure background flourish.
export function OceanCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.4, 6);
    camera.lookAt(0, -0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(14, 9, 56, 36);
    geometry.rotateX(-Math.PI / 2.15);
    const position = geometry.attributes.position;
    const basePositions = Float32Array.from(position.array);

    const material = new THREE.PointsMaterial({
      size: 0.03,
      color: new THREE.Color("#4f7d8c"),
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const clock = new THREE.Clock();
    let elapsed = 0;
    let frameId = 0;

    function animate() {
      frameId = requestAnimationFrame(animate);
      elapsed += clock.getDelta();

      for (let i = 0; i < position.count; i++) {
        const x = basePositions[i * 3];
        const z = basePositions[i * 3 + 2];
        const y =
          Math.sin(x * 0.6 + elapsed * 0.6) * 0.15 +
          Math.cos(z * 0.5 + elapsed * 0.45) * 0.15;
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

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden />;
}
