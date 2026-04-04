import { useEffect } from "react";
import * as THREE from "three";

/**
 * useThreeScene
 *
 * Encapsulates all Three.js setup, animation loop, and cleanup for the
 * medical loading screen. Only runs client-side (guaranteed by ssr:false
 * on the parent MedicalLoadingScreen component).
 *
 * @param canvasRef - ref to the <canvas> element to render into
 * @param reducedMotion - when true, animation speeds are reduced by 80%
 */
export function useThreeScene(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  reducedMotion: boolean
): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    // ── Scene ─────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // ── Camera ────────────────────────────────────────────────────────────
    // PerspectiveCamera framed to show the DNA helix (~4 units tall) and
    // scan ring (radius 1.8) comfortably within the viewport.
    const aspect = canvas.clientWidth / canvas.clientHeight || 1;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
    camera.position.set(0, 0, 6);
    camera.lookAt(0, 0, 0);

    // ── ResizeObserver — keep renderer in sync with canvas size ───────────
    const resizeObserver = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h || 1;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    resizeObserver.observe(canvas);

    // ── DNA Helix (task 2.2) ──────────────────────────────────────────────
    const N_HELIX_SPHERES = 20;
    const helixRadius = 0.6;
    const yScale = 0.3;
    const helixGroup = new THREE.Group();

    const mat1 = new THREE.MeshBasicMaterial({ color: "#00d4ff" });
    const mat2 = new THREE.MeshBasicMaterial({ color: "#00b4a0" });
    const rungMat = new THREE.MeshBasicMaterial({ color: "#00d4ff", transparent: true, opacity: 0.5 });

    const strand1Points: THREE.Vector3[] = [];
    const strand2Points: THREE.Vector3[] = [];

    for (let i = 0; i < N_HELIX_SPHERES; i++) {
      const t = (i / (N_HELIX_SPHERES - 1)) * Math.PI * 4;
      const y = t * yScale - Math.PI * 2 * yScale; // center vertically

      const x1 = helixRadius * Math.cos(t);
      const z1 = helixRadius * Math.sin(t);
      const x2 = helixRadius * Math.cos(t + Math.PI);
      const z2 = helixRadius * Math.sin(t + Math.PI);

      strand1Points.push(new THREE.Vector3(x1, y, z1));
      strand2Points.push(new THREE.Vector3(x2, y, z2));

      const sphereGeo = new THREE.SphereGeometry(0.08, 8, 8);

      const sphere1 = new THREE.Mesh(sphereGeo, mat1);
      sphere1.position.set(x1, y, z1);
      helixGroup.add(sphere1);

      const sphere2 = new THREE.Mesh(sphereGeo, mat2);
      sphere2.position.set(x2, y, z2);
      helixGroup.add(sphere2);
    }

    // Connecting rungs between paired strand points
    for (let i = 0; i < N_HELIX_SPHERES - 1; i++) {
      const p1 = strand1Points[i];
      const p2 = strand2Points[i];

      const dir = new THREE.Vector3().subVectors(p2, p1);
      const length = dir.length();
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

      const rungGeo = new THREE.CylinderGeometry(0.02, 0.02, length, 6);
      const rung = new THREE.Mesh(rungGeo, rungMat);
      rung.position.copy(mid);
      rung.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.normalize()
      );
      helixGroup.add(rung);
    }

    scene.add(helixGroup);

    // ── Scan Ring (task 2.4) ──────────────────────────────────────────────
    const scanRingGeo = new THREE.TorusGeometry(1.8, 0.04, 16, 64);
    const scanRingMat = new THREE.MeshBasicMaterial({
      color: "#00ffff",
      transparent: true,
    });
    const scanRing = new THREE.Mesh(scanRingGeo, scanRingMat);
    scene.add(scanRing);

    // ── Particle Field (task 2.5) ─────────────────────────────────────────
    const N_PARTICLES = 300;
    const PARTICLE_SPHERE_RADIUS = 3;

    const particlePositions = new Float32Array(N_PARTICLES * 3);
    const particleVelocities = new Float32Array(N_PARTICLES * 3);

    // Rejection sampling: generate points uniformly inside a sphere
    let filled = 0;
    while (filled < N_PARTICLES) {
      const x = (Math.random() * 2 - 1) * PARTICLE_SPHERE_RADIUS;
      const y = (Math.random() * 2 - 1) * PARTICLE_SPHERE_RADIUS;
      const z = (Math.random() * 2 - 1) * PARTICLE_SPHERE_RADIUS;
      if (x * x + y * y + z * z <= PARTICLE_SPHERE_RADIUS * PARTICLE_SPHERE_RADIUS) {
        particlePositions[filled * 3]     = x;
        particlePositions[filled * 3 + 1] = y;
        particlePositions[filled * 3 + 2] = z;
        // Small random drift velocity for each particle
        particleVelocities[filled * 3]     = (Math.random() - 0.5) * 0.004;
        particleVelocities[filled * 3 + 1] = (Math.random() - 0.5) * 0.004;
        particleVelocities[filled * 3 + 2] = (Math.random() - 0.5) * 0.004;
        filled++;
      }
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: "#ffffff",
      transparent: true,
      opacity: 0.35,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Animation loop (task 2.6) ─────────────────────────────────────────
    const rotationSpeed = reducedMotion ? 0.001 : 0.005;
    const SCAN_PERIOD_MS = 3000;
    let frameId: number;

    const animate = (timestamp: number) => {
      frameId = requestAnimationFrame(animate);

      // Rotate helix around Y-axis
      helixGroup.rotation.y += rotationSpeed;

      // Pulse scan ring scale and opacity on a sine wave (~3s period)
      const phase = (timestamp % SCAN_PERIOD_MS) / SCAN_PERIOD_MS; // 0..1
      const sine = Math.sin(phase * Math.PI * 2);                   // -1..1
      const scale = 1.0 + sine * 0.1;                               // 0.9..1.1
      scanRing.scale.setScalar(scale);
      scanRingMat.opacity = 0.6 + sine * 0.3;                       // 0.3..0.9

      // Drift particles and wrap at sphere boundary
      for (let i = 0; i < N_PARTICLES; i++) {
        const ix = i * 3;
        particlePositions[ix]     += particleVelocities[ix];
        particlePositions[ix + 1] += particleVelocities[ix + 1];
        particlePositions[ix + 2] += particleVelocities[ix + 2];

        const x = particlePositions[ix];
        const y = particlePositions[ix + 1];
        const z = particlePositions[ix + 2];
        if (x * x + y * y + z * z > PARTICLE_SPHERE_RADIUS * PARTICLE_SPHERE_RADIUS) {
          // Reflect back toward origin by negating position
          particlePositions[ix]     = -x;
          particlePositions[ix + 1] = -y;
          particlePositions[ix + 2] = -z;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    // ── Cleanup ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, reducedMotion]);
}
