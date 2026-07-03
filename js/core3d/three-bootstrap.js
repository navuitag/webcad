/**
 * Loads Three.js r170 + addons as ES modules, exposes globals for legacy scripts.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Evaluator, Brush, ADDITION, SUBTRACTION, INTERSECTION } from 'three-bvh-csg';

window.THREE = THREE;
window.ThreeAddons = {
  OrbitControls,
  WebGPURenderer,
  GLTFExporter,
  STLExporter,
  OBJExporter,
  STLLoader,
  OBJLoader,
  GLTFLoader,
  CSG: { Evaluator, Brush, ADDITION, SUBTRACTION, INTERSECTION }
};

window.ThreeBootstrap = {
  ready: Promise.resolve(true),
  version: THREE.REVISION
};

console.info(`WebCAD 3D: Three.js r${THREE.REVISION} loaded`);
