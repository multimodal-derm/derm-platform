"use client";

import { useEffect } from "react";
import * as THREE from "three";

/**
 * Enhanced Clinical 3D Scene:
 * - Monochrome "Technical" palette (zinc/slate)
 * - Sharp, low-opacity crosshairs
 * - High-density ambient point cloud
 */
export function useThreeScene(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  reducedMotion: boolean,
): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    const scene = new THREE.Scene();

    const aspect = canvas.clientWidth / canvas.clientHeight || 1;
    const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    const resizeObserver = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h || 1;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    resizeObserver.observe(canvas);

    // ── COLORS: SWAP CYAN FOR MONOCHROME TECHNICAL ───────────────────────────
    const THEME = {
      primary: "#ffffff",
      secondary: "#a1a1aa", // zinc-400
      accent: "#ffffff",
      dim: "#3f3f46", // zinc-700
    };

    // ── Main Lens Housing ─────────────────────────────────────────────
    const lensRingGeo = new THREE.TorusGeometry(2.4, 0.015, 16, 128);
    const lensRingMat = new THREE.MeshBasicMaterial({
      color: THEME.secondary,
      transparent: true,
      opacity: 0.3,
    });
    const lensRing = new THREE.Mesh(lensRingGeo, lensRingMat);
    scene.add(lensRing);

    // Pulse Ring (Inner)
    const innerRingGeo = new THREE.TorusGeometry(2.0, 0.005, 16, 128);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: THEME.primary,
      transparent: true,
      opacity: 0.1,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    scene.add(innerRing);

    // ── Technical Crosshairs (Sharper/Finer) ────────────────────────────
    const crosshairMat = new THREE.LineBasicMaterial({
      color: THEME.primary,
      transparent: true,
      opacity: 0.15,
    });

    const makeLine = (p1: THREE.Vector3, p2: THREE.Vector3) => {
      const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const line = new THREE.Line(geo, crosshairMat);
      scene.add(line);
    };

    const L_GAP = 0.5;
    const L_EXT = 2.4;
    makeLine(new THREE.Vector3(-L_EXT, 0, 0), new THREE.Vector3(-L_GAP, 0, 0));
    makeLine(new THREE.Vector3(L_GAP, 0, 0), new THREE.Vector3(L_EXT, 0, 0));
    makeLine(new THREE.Vector3(0, -L_EXT, 0), new THREE.Vector3(0, -L_GAP, 0));
    makeLine(new THREE.Vector3(0, L_GAP, 0), new THREE.Vector3(0, L_EXT, 0));

    // ── Technical Ticks ──────────────────────────────────────────
    const tickMat = new THREE.LineBasicMaterial({
      color: THEME.secondary,
      transparent: true,
      opacity: 0.2,
    });
    for (let i = 0; i < 72; i++) {
      const angle = (i / 72) * Math.PI * 2;
      const isMajor = i % 18 === 0;
      const innerR = isMajor ? 2.3 : 2.35;
      const outerR = 2.45;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(angle) * innerR, Math.sin(angle) * innerR, 0),
        new THREE.Vector3(Math.cos(angle) * outerR, Math.sin(angle) * outerR, 0),
      ]);
      scene.add(new THREE.Line(geo, tickMat));
    }

    // ── Sweep Scanner (Ghost Effect) ──────────────────────────────────────────────
    const sweepCurve = new THREE.ArcCurve(0, 0, 2.4, 0, Math.PI * 0.25, false);
    const sweepPts = sweepCurve.getPoints(32);
    const sweepGeo = new THREE.BufferGeometry().setFromPoints(
      sweepPts.map((p) => new THREE.Vector3(p.x, p.y, 0)),
    );
    const sweepMat = new THREE.LineBasicMaterial({
      color: THEME.primary,
      transparent: true,
      opacity: 0.6,
    });
    const sweepLine = new THREE.Line(sweepGeo, sweepMat);
    scene.add(sweepLine);

    // ── Point Cloud (Replaces Cell Spheres for "Data" look) ──────────────────────────
    const N_POINTS = 300;
    const pointPositions = new Float32Array(N_POINTS * 3);
    for (let i = 0; i < N_POINTS; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 2.2;
      pointPositions[i * 3] = Math.cos(angle) * r;
      pointPositions[i * 3 + 1] = Math.sin(angle) * r;
      pointPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.0;
    }
    const pointGeo = new THREE.BufferGeometry();
    pointGeo.setAttribute("position", new THREE.BufferAttribute(pointPositions, 3));
    const pointMat = new THREE.PointsMaterial({
      size: 0.015,
      color: THEME.secondary,
      transparent: true,
      opacity: 0.4,
    });
    const points = new THREE.Points(pointGeo, pointMat);
    scene.add(points);

    // ── Animation loop ──────────────────────────────────────────────────
    const speedMultiplier = reducedMotion ? 0.2 : 1.0;
    let frameId: number;

    const animate = (timestamp: number) => {
      frameId = requestAnimationFrame(animate);

      // Rotate Scanners
      sweepLine.rotation.z -= 0.012 * speedMultiplier;
      points.rotation.z += 0.001 * speedMultiplier;

      // Technical Pulses
      const pulse = Math.sin(timestamp * 0.003 * speedMultiplier);
      innerRing.scale.setScalar(1 + pulse * 0.02);
      innerRingMat.opacity = 0.05 + pulse * 0.05;
      
      lensRingMat.opacity = 0.2 + Math.sin(timestamp * 0.001 * speedMultiplier) * 0.1;

      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    // ── Cleanup ─────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Line) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            (obj.material as THREE.Material).dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [canvasRef, reducedMotion]);
}