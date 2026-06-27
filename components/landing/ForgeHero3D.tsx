"use client";

import { useEffect, useRef } from "react";

export default function ForgeHero3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const el = canvasRef.current!;
    if (!el) return;

    let scene: import("three").Scene;
    let camera: import("three").PerspectiveCamera;
    let renderer: import("three").WebGLRenderer;
    let mesh: import("three").Mesh;
    let animating = true;

    async function init() {
      const THREE = await import("three");

      renderer = new THREE.WebGLRenderer({
        canvas: el as HTMLCanvasElement,
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.setClearColor(0x000000, 0);

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 100);
      camera.position.set(0, 0, 5);

      const geometry = new THREE.DodecahedronGeometry(1.6, 0);

      const material = new THREE.MeshPhongMaterial({
        color: 0xc0341d,
        emissive: 0x4d1208,
        specular: 0xe8963c,
        shininess: 60,
        transparent: true,
        opacity: 0.88,
        wireframe: false,
      });

      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const edgesGeo = new THREE.EdgesGeometry(geometry);
      const edgesMat = new THREE.LineBasicMaterial({
        color: 0xe8963c,
        transparent: true,
        opacity: 0.35,
      });
      const edges = new THREE.LineSegments(edgesGeo, edgesMat);
      mesh.add(edges);

      const ambient = new THREE.AmbientLight(0xffffff, 0.25);
      scene.add(ambient);

      const keyLight = new THREE.PointLight(0xc0341d, 3.5, 12);
      keyLight.position.set(3, 4, 4);
      scene.add(keyLight);

      const fillLight = new THREE.PointLight(0xe8963c, 1.8, 10);
      fillLight.position.set(-4, -2, 2);
      scene.add(fillLight);

      const rimLight = new THREE.PointLight(0xffeedd, 0.6, 8);
      rimLight.position.set(0, -4, -3);
      scene.add(rimLight);

      let mouseX = 0;
      let mouseY = 0;
      const onMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("mousemove", onMouseMove);

      let t = 0;
      function animate() {
        if (!animating) return;
        frameRef.current = requestAnimationFrame(animate);
        t += 0.004;

        mesh.rotation.x += 0.003;
        mesh.rotation.y += 0.005;
        mesh.rotation.z += 0.001;

        mesh.position.x += (mouseX * 0.35 - mesh.position.x) * 0.04;
        mesh.position.y += (-mouseY * 0.25 - mesh.position.y) * 0.04;

        const scale = 1 + Math.sin(t) * 0.025;
        mesh.scale.setScalar(scale);

        renderer.render(scene, camera);
      }
      animate();

      const onResize = () => {
        camera.aspect = el.clientWidth / el.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(el.clientWidth, el.clientHeight);
      };
      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", onResize);
      };
    }

    const cleanup = init();

    return () => {
      animating = false;
      cancelAnimationFrame(frameRef.current);
      cleanup.then((fn) => fn?.());
      renderer?.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block", willChange: "transform" }}
    />
  );
}
