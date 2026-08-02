"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

const vertexShader = `
uniform float uTime;
uniform vec2 uHover;
uniform float uHoverState;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 pos = position;
  
  // Subtle wave distortion based on mouse position
  float dist = distance(uv, uHover);
  float intensity = smoothstep(0.5, 0.0, dist) * uHoverState;
  
  pos.z += sin(dist * 20.0 - uTime * 5.0) * 0.05 * intensity;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uTexture;
uniform vec2 uHover;
uniform float uHoverState;
uniform vec2 uResolution;
uniform vec2 uImageResolution;
varying vec2 vUv;

void main() {
  // Implement object-fit: cover logic
  vec2 ratio = vec2(
    min((uResolution.x / uResolution.y) / (uImageResolution.x / uImageResolution.y), 1.0),
    min((uResolution.y / uResolution.x) / (uImageResolution.y / uImageResolution.x), 1.0)
  );
  vec2 uv = vec2(
    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
  
  // Calculate distance from mouse
  float dist = distance(vUv, uHover);
  float effect = smoothstep(0.4, 0.0, dist) * uHoverState;
  
  // RGB Split (Chromatic Aberration) based on hover effect
  float rgbShift = effect * 0.03;
  
  // Displace UVs
  vec2 uvR = uv + vec2(rgbShift, rgbShift);
  vec2 uvG = uv;
  vec2 uvB = uv - vec2(rgbShift, rgbShift);
  
  float r = texture2D(uTexture, uvR).r;
  float g = texture2D(uTexture, uvG).g;
  float b = texture2D(uTexture, uvB).b;
  
  gl_FragColor = vec4(r, g, b, 1.0);
}
`;

export default function WebGLImage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;

    // SCENE
    const scene = new THREE.Scene();

    // CAMERA
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 5;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Calculate visible area for full screen cover
    const visibleHeight = 2 * Math.tan((45 * Math.PI) / 360) * 5;
    const visibleWidth = visibleHeight * (window.innerWidth / window.innerHeight);

    // MESH (Plane covering the entire visible camera area)
    const geometry = new THREE.PlaneGeometry(visibleWidth, visibleHeight, 32, 32);
    
    // TEXTURE
    const textureLoader = new THREE.TextureLoader();
    // Using the user's Tanjiro image
    const texture = textureLoader.load("/tanjiro-kamado-red-5120x2880-22577.png");

    // Image resolution of the Tanjiro image (5120x2880)
    const imageResolution = new THREE.Vector2(5120, 2880);

    // MATERIAL
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: texture },
        uHover: { value: new THREE.Vector2(0.5, 0.5) },
        uHoverState: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uImageResolution: { value: imageResolution }
      },
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // MOUSE TRACKING & RAYCASTING
    const mouse = new THREE.Vector2(0.5, 0.5); // Normalized coordinates for raycaster
    const raycaster = new THREE.Raycaster();
    
    const handleMouseMove = (event: MouseEvent) => {
      // Normalize mouse to -1 to +1 for raycasting
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(mesh);
      
      if (intersects.length > 0) {
        const uv = intersects[0].uv;
        if (uv) {
          gsap.to(material.uniforms.uHover.value, {
            x: uv.x,
            y: uv.y,
            duration: 0.5,
            ease: "power2.out"
          });
          gsap.to(material.uniforms.uHoverState, {
            value: 1,
            duration: 0.3
          });
        }
      } else {
        gsap.to(material.uniforms.uHoverState, {
          value: 0,
          duration: 0.5
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    // ANIMATION LOOP
    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      material.uniforms.uTime.value = clock.getElapsedTime();
      
      renderer.render(scene, camera);
    };
    animate();

    // RESIZE HANDLER
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      
      // Update geometry size to match new screen dimensions
      const newVisibleHeight = 2 * Math.tan((45 * Math.PI) / 360) * 5;
      const newVisibleWidth = newVisibleHeight * (window.innerWidth / window.innerHeight);
      mesh.geometry.dispose();
      mesh.geometry = new THREE.PlaneGeometry(newVisibleWidth, newVisibleHeight, 32, 32);

      // Update uniforms and renderer
      material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      containerRef.current?.removeChild(renderer.domElement);
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 w-full h-full pointer-events-auto"
    />
  );
}
