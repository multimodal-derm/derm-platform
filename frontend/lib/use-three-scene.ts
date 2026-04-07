import { useEffect } from "react";
import * as THREE from "three";

/**
 * Dermoscope-themed loading animation:
 * - Central scanning reticle (crosshair + pulsing lens ring)
 * - Orbiting cell-like particles
 * - Scanning sweep arc
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
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);

    const resizeObserver = new ResizeObserver(() => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h || 1;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    });
    resizeObserver.observe(canvas);

    // ── Dermoscope lens ring ─────────────────────────────────────────────
    const lensRingGeo = new THREE.TorusGeometry(2.2, 0.03, 16, 128);
    const lensRingMat = new THREE.MeshBasicMaterial({
      color: "#00d4ff",
      transparent: true,
      opacity: 0.6,
    });
    const lensRing = new THREE.Mesh(lensRingGeo, lensRingMat);
    scene.add(lensRing);

    // Inner ring
    const innerRingGeo = new THREE.TorusGeometry(1.6, 0.015, 16, 128);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: "#00d4ff",
      transparent: true,
      opacity: 0.25,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    scene.add(innerRing);

    // ── Crosshair lines ─────────────────────────────────────────────────
    const crosshairMat = new THREE.LineBasicMaterial({
      color: "#00d4ff",
      transparent: true,
      opacity: 0.2,
    });

    const makeLineSegment = (points: THREE.Vector3[]) => {
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, crosshairMat);
      scene.add(line);
      return line;
    };

    makeLineSegment([
      new THREE.Vector3(-2.2, 0, 0),
      new THREE.Vector3(-0.4, 0, 0),
    ]);
    makeLineSegment([
      new THREE.Vector3(0.4, 0, 0),
      new THREE.Vector3(2.2, 0, 0),
    ]);
    makeLineSegment([
      new THREE.Vector3(0, -2.2, 0),
      new THREE.Vector3(0, -0.4, 0),
    ]);
    makeLineSegment([
      new THREE.Vector3(0, 0.4, 0),
      new THREE.Vector3(0, 2.2, 0),
    ]);

    // ── Tick marks on lens ring ──────────────────────────────────────────
    const tickMat = new THREE.LineBasicMaterial({
      color: "#00d4ff",
      transparent: true,
      opacity: 0.3,
    });
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const innerR = i % 9 === 0 ? 2.0 : 2.1;
      const outerR = 2.35;
      const pts = [
        new THREE.Vector3(
          Math.cos(angle) * innerR,
          Math.sin(angle) * innerR,
          0,
        ),
        new THREE.Vector3(
          Math.cos(angle) * outerR,
          Math.sin(angle) * outerR,
          0,
        ),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      scene.add(new THREE.Line(geo, tickMat));
    }

    // ── Scanning sweep arc ──────────────────────────────────────────────
    const sweepCurve = new THREE.ArcCurve(0, 0, 2.2, 0, Math.PI * 0.4, false);
    const sweepPts = sweepCurve.getPoints(32);
    const sweepGeo = new THREE.BufferGeometry().setFromPoints(
      sweepPts.map((p) => new THREE.Vector3(p.x, p.y, 0)),
    );
    const sweepMat = new THREE.LineBasicMaterial({
      color: "#00ffcc",
      transparent: true,
      opacity: 0.7,
    });
    const sweepLine = new THREE.Line(sweepGeo, sweepMat);
    scene.add(sweepLine);

    // ── Cell-like particles ─────────────────────────────────────────────
    const N_CELLS = 60;
    const cellGroup = new THREE.Group();

    interface CellDatum {
      mesh: THREE.Mesh;
      angle: number;
      radius: number;
      speed: number;
      yOffset: number;
    }

    const cellData: CellDatum[] = [];

    for (let i = 0; i < N_CELLS; i++) {
      const radius = 0.5 + Math.random() * 1.8;
      const angle = Math.random() * Math.PI * 2;
      const size = 0.03 + Math.random() * 0.06;

      const geo = new THREE.SphereGeometry(size, 8, 8);
      const colors = ["#00d4ff", "#00b4a0", "#4a9eff"];
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % 3],
        transparent: true,
        opacity: 0.15 + Math.random() * 0.35,
      });
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        (Math.random() - 0.5) * 1.5,
      );

      cellGroup.add(mesh);
      cellData.push({
        mesh,
        angle,
        radius,
        speed:
          (0.0003 + Math.random() * 0.001) *
          (Math.random() > 0.5 ? 1 : -1),
        yOffset: Math.random() * Math.PI * 2,
      });
    }

    scene.add(cellGroup);

    // ── Outer ambient particles ─────────────────────────────────────────
    const N_AMBIENT = 150;
    const ambientPositions = new Float32Array(N_AMBIENT * 3);
    const ambientVelocities = new Float32Array(N_AMBIENT * 3);

    for (let i = 0; i < N_AMBIENT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2.5 + Math.random() * 3;
      ambientPositions[i * 3] = Math.cos(angle) * r;
      ambientPositions[i * 3 + 1] = Math.sin(angle) * r;
      ambientPositions[i * 3 + 2] = (Math.random() - 0.5) * 3;
      ambientVelocities[i * 3] = (Math.random() - 0.5) * 0.002;
      ambientVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      ambientVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }

    const ambientGeo = new THREE.BufferGeometry();
    ambientGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(ambientPositions, 3),
    );
    const ambientMat = new THREE.PointsMaterial({
      size: 0.025,
      color: "#ffffff",
      transparent: true,
      opacity: 0.2,
    });
    scene.add(new THREE.Points(ambientGeo, ambientMat));

    // ── Animation loop ──────────────────────────────────────────────────
    const speed = reducedMotion ? 0.2 : 1.0;
    let frameId: number;

    const animate = (timestamp: number) => {
      frameId = requestAnimationFrame(animate);

      // Sweep arc rotates around the lens
      sweepLine.rotation.z -= 0.008 * speed;

      // Pulse inner ring
      const pulse = Math.sin(timestamp * 0.002 * speed);
      innerRing.scale.setScalar(1 + pulse * 0.05);
      innerRingMat.opacity = 0.2 + pulse * 0.1;

      // Subtle lens ring pulse
      lensRingMat.opacity = 0.5 + Math.sin(timestamp * 0.001 * speed) * 0.15;

      // Orbit cell particles
      for (const cell of cellData) {
        cell.angle += cell.speed * speed;
        const wobble = Math.sin(timestamp * 0.001 + cell.yOffset) * 0.1;
        cell.mesh.position.x = Math.cos(cell.angle) * cell.radius;
        cell.mesh.position.y = Math.sin(cell.angle) * cell.radius + wobble;
      }

      // Drift ambient particles
      for (let i = 0; i < N_AMBIENT; i++) {
        const ix = i * 3;
        ambientPositions[ix] += ambientVelocities[ix] * speed;
        ambientPositions[ix + 1] += ambientVelocities[ix + 1] * speed;
        ambientPositions[ix + 2] += ambientVelocities[ix + 2] * speed;

        const dist = Math.sqrt(
          ambientPositions[ix] ** 2 +
            ambientPositions[ix + 1] ** 2 +
            ambientPositions[ix + 2] ** 2,
        );
        if (dist > 5.5) {
          const a = Math.random() * Math.PI * 2;
          const r = 2.5 + Math.random() * 0.5;
          ambientPositions[ix] = Math.cos(a) * r;
          ambientPositions[ix + 1] = Math.sin(a) * r;
          ambientPositions[ix + 2] = (Math.random() - 0.5) * 2;
        }
      }
      ambientGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(animate);

    // ── Cleanup ─────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      scene.traverse((obj) => {
        if (
          obj instanceof THREE.Mesh ||
          obj instanceof THREE.Points ||
          obj instanceof THREE.Line
        ) {
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