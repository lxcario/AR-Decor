import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";
import products from "../src/data/products.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

class NodeFileReader {
  constructor() {
    this.result = null;
    this.onloadend = null;
  }

  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    if (typeof this.onloadend === "function") {
      this.onloadend();
    }
  }

  async readAsDataURL(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    this.result = `data:${blob.type};base64,${buffer.toString("base64")}`;
    if (typeof this.onloadend === "function") {
      this.onloadend();
    }
  }
}

if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = NodeFileReader;
}

function createPlaceholderScene(product) {
  const scene = new THREE.Scene();
  const group = new THREE.Group();
  group.name = product.name;

  const { width, depth, height } = product.dimensionsMeters;
  const geometry = new THREE.BoxGeometry(width, height, depth, 1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#d9c8b4"),
    roughness: 0.78,
    metalness: 0.04,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `${product.slug}-placeholder`;
  mesh.position.y = height / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  const plinthHeight = Math.max(Math.min(height * 0.05, 0.08), 0.025);
  const plinthRadius = Math.max(width, depth) * 0.22;
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(plinthRadius, plinthRadius, plinthHeight, 28),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color("#8b745c"),
      roughness: 0.88,
      metalness: 0.02,
    }),
  );
  plinth.position.y = plinthHeight / 2;
  plinth.name = `${product.slug}-plinth`;
  group.add(plinth);

  scene.add(group);
  scene.updateMatrixWorld(true);

  return scene;
}

async function exportGlb(scene) {
  const exporter = new GLTFExporter();
  const arrayBuffer = await exporter.parseAsync(scene, {
    binary: true,
    onlyVisible: true,
    maxTextureSize: 512,
  });

  return Buffer.from(arrayBuffer);
}

async function exportUsdz(scene) {
  const exporter = new USDZExporter();
  const arrayBuffer = await exporter.parseAsync(scene, {
    quickLookCompatible: true,
    onlyVisible: true,
    maxTextureSize: 512,
  });

  return Buffer.from(arrayBuffer);
}

function resolvePublicPath(assetPath) {
  return path.resolve(repoRoot, "public", assetPath.replace(/^\/+/, ""));
}

async function ensureDirFor(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function main() {
  for (const product of products) {
    const scene = createPlaceholderScene(product);
    const glbPath = resolvePublicPath(product.assets.modelGlb);
    const usdzPath = resolvePublicPath(product.assets.modelUsdz);

    await ensureDirFor(glbPath);
    await ensureDirFor(usdzPath);

    const [glbBuffer, usdzBuffer] = await Promise.all([
      exportGlb(scene),
      exportUsdz(scene),
    ]);

    await fs.writeFile(glbPath, glbBuffer);
    await fs.writeFile(usdzPath, usdzBuffer);

    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }

  console.log(`Generated ${products.length} placeholder GLB/USDZ model pairs.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
