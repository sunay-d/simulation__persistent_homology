import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/controls/OrbitControls.js';

const container = document.getElementById("canvas-container");
const radiusRange = document.getElementById("radiusRange");
const radiusValue = document.getElementById("radiusValue");
const regenBtn = document.getElementById("regenBtn");
const toggleCircles = document.getElementById("toggleCircles");
const pointCountInput = document.getElementById("pointCount");
const info = document.getElementById("info");

let pointCount = Number(pointCountInput.value);
let points = [];
let radius = Number(radiusRange.value);
let showCircles = toggleCircles.checked;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050620);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 4000);
camera.position.set(0, 0, 900);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 120;
controls.maxDistance = 2700;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.68);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
directionalLight.position.set(0.8, 1.1, 0.5);
scene.add(directionalLight);

const grid = new THREE.GridHelper(820, 24, 0x3c5f9c, 0x1f2b4d);
grid.position.y = -180;
scene.add(grid);

const pointsGroup = new THREE.Group();
const spheresGroup = new THREE.Group();
const edgesGroup = new THREE.Group();
const trianglesGroup = new THREE.Group();
const tetrahedronsGroup = new THREE.Group();
scene.add(pointsGroup, spheresGroup, edgesGroup, trianglesGroup, tetrahedronsGroup);

function getDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function circleTripleIntersection(a, b, c, r) {
    const dij = getDistance(a, b);
    const dik = getDistance(a, c);
    const djk = getDistance(b, c);
    if (dij > 2 * r || dik > 2 * r || djk > 2 * r) return false;

    const maxSide = Math.max(dij, dik, djk);
    const sumSq = dij * dij + dik * dik + djk * djk;
    if (maxSide * maxSide >= sumSq - maxSide * maxSide) {
    return maxSide / 2 <= r;
    }

    const s = (dij + dik + djk) / 2;
    const area = Math.sqrt(Math.max(0, s * (s - dij) * (s - dik) * (s - djk)));
    if (area <= 1e-9) return false;
    const circumradius = (dij * dik * djk) / (4 * area);
    return circumradius <= r;
}

function toSceneRadius(r) {
    return r * 2.8;
}

function clearGroup(group) {
    while (group.children.length) {
    group.remove(group.children[0]);
    }
}

function newPoints() {
    points = [];
    const range = 360;
    for (let i = 0; i < pointCount; i++) {
    points.push({
        x: (Math.random() - 0.5) * range,
        y: (Math.random() - 0.5) * range,
        z: (Math.random() - 0.5) * range * 0.34
    });
    }
    info.textContent = `Nokta sayısı: ${pointCount}`;
}

function updateScene() {
    clearGroup(pointsGroup);
    clearGroup(spheresGroup);
    clearGroup(edgesGroup);
    clearGroup(trianglesGroup);
    clearGroup(tetrahedronsGroup);

    const pointMaterial = new THREE.MeshStandardMaterial({ color: 0xffd27f, emissive: 0x4a3a86, roughness: 0.2, metalness: 0.3 });
    const pointGeometry = new THREE.SphereGeometry(4.2, 10, 8);

    points.forEach((p) => {
    const m = new THREE.Mesh(pointGeometry, pointMaterial);
    m.position.set(p.x, p.y, p.z);
    pointsGroup.add(m);
    });

    if (showCircles) {
    const sphereRadius = toSceneRadius(radius);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x8aa2ff, transparent: true, opacity: 0.05, wireframe: false });
    const ringGeometry = new THREE.SphereGeometry(sphereRadius, 26, 22);
    points.forEach((p) => {
        const sp = new THREE.Mesh(ringGeometry, ringMaterial);
        sp.position.set(p.x, p.y, p.z);
        spheresGroup.add(sp);
    });
    }

    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x91ffff, transparent: true, opacity: 0.78 });
    const edgePositions = [];
    const edgeBound = 2 * toSceneRadius(radius) * 0.98;

    // Removed edge drawing as per user request

    if (edgePositions.length) {
    const edgesGeometry = new THREE.BufferGeometry();
    edgesGeometry.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
    edgesGroup.add(new THREE.LineSegments(edgesGeometry, edgeMaterial));
    }

    const tetraMaterial = new THREE.MeshStandardMaterial({
    color: 0x8ee8ff,
    emissive: 0x0f2f55,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
    });

    const triMaterial = new THREE.MeshStandardMaterial({
    color: 0x8ee8ff,
    emissive: 0x0f2f55,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
    });

    const tetraLineMaterial = new THREE.LineBasicMaterial({ color: 0x35b8e9, transparent: true, opacity: 0.24 });
    const strictThreshold = showCircles ? toSceneRadius(radius) : toSceneRadius(radius);

    // Triangles for three intersecting spheres
    for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
        for (let k = j + 1; k < points.length; k++) {
        const a = points[i];
        const b = points[j];
        const c = points[k];
        if (circleTripleIntersection(a, b, c, strictThreshold)) {
            const triGeo = new THREE.BufferGeometry();
            const triVerts = new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z]);
            triGeo.setAttribute("position", new THREE.BufferAttribute(triVerts, 3));
            triGeo.setIndex([0, 1, 2]);
            triGeo.computeVertexNormals();
            trianglesGroup.add(new THREE.Mesh(triGeo, triMaterial));
        }
        }
    }
    }

    for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
        for (let k = j + 1; k < points.length; k++) {
        for (let l = k + 1; l < points.length; l++) {
            const a = points[i];
            const b = points[j];
            const c = points[k];
            const d = points[l];
            const dab = getDistance(a, b);
            const dac = getDistance(a, c);
            const dad = getDistance(a, d);
            const dbc = getDistance(b, c);
            const dbd = getDistance(b, d);
            const dcd = getDistance(c, d);
            if (dab <= edgeBound && dac <= edgeBound && dad <= edgeBound && dbc <= edgeBound && dbd <= edgeBound && dcd <= edgeBound) {
            const tetraGeo = new THREE.BufferGeometry();
            const tetraVerts = new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z]);
            tetraGeo.setAttribute("position", new THREE.BufferAttribute(tetraVerts, 3));
            tetraGeo.setIndex([0,1,2, 0,1,3, 0,2,3, 1,2,3]);
            tetraGeo.computeVertexNormals();
            tetrahedronsGroup.add(new THREE.Mesh(tetraGeo, tetraMaterial));
            // Boundary lines for each face
            const face1Verts = new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z]);
            const face2Verts = new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z, d.x, d.y, d.z]);
            const face3Verts = new Float32Array([a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z]);
            const face4Verts = new Float32Array([b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z]);
            tetrahedronsGroup.add(new THREE.LineLoop(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(face1Verts, 3)), tetraLineMaterial));
            tetrahedronsGroup.add(new THREE.LineLoop(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(face2Verts, 3)), tetraLineMaterial));
            tetrahedronsGroup.add(new THREE.LineLoop(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(face3Verts, 3)), tetraLineMaterial));
            tetrahedronsGroup.add(new THREE.LineLoop(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(face4Verts, 3)), tetraLineMaterial));
            }
            }
        }
        }
    }
    }


function resize() {
    const w = container.clientWidth;
    const top = container.getBoundingClientRect().top;
    const h = Math.max(260, window.innerHeight - top - 20);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}

window.addEventListener("resize", resize);

radiusRange.addEventListener("input", () => {
    radius = Number(radiusRange.value);
    radiusValue.textContent = radius;
    updateScene();
});

pointCountInput.addEventListener("change", () => {
    let value = Number(pointCountInput.value);
    value = Math.max(5, Math.min(100, isNaN(value) ? 50 : value));
    pointCount = value;
    pointCountInput.value = pointCount;
    info.textContent = `Nokta sayısı: ${pointCount}`;
});

regenBtn.addEventListener("click", () => {
    pointCount = Number(pointCountInput.value);
    newPoints();
    updateScene();
});

toggleCircles.addEventListener("change", () => {
    showCircles = toggleCircles.checked;
    updateScene();
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

newPoints();
resize();
updateScene();
animate();