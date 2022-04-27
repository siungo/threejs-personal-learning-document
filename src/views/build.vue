<template>
  <div class="build" ref="build">
    <h1>滑动鼠标滚轮穿梭在房子中</h1>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as THREE from 'three'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  // alpha: true,
})

const build = ref<HTMLElement | null>(null)

let model

const cameraRoute = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 0, 15),
    new THREE.Vector3(-7, 0, 10),
    new THREE.Vector3(-7, 0, -1),
    new THREE.Vector3(0.2, 0, -2),
    new THREE.Vector3(0.2, 0, 0.5),
    new THREE.Vector3(-4.5, 0, 0.5),
    new THREE.Vector3(-4.5, 0, 4.5),
    new THREE.Vector3(3, 0, 5),
    new THREE.Vector3(5, 0, 5.5),
    new THREE.Vector3(4, 0, -2),
    new THREE.Vector3(2, 0, -5),
    new THREE.Vector3(2, 0, -6),
    new THREE.Vector3(5, 0, -6),
    new THREE.Vector3(5, 0, -1),
    new THREE.Vector3(7.5, 0, 1),
    new THREE.Vector3(7.5, 0, 4),
    new THREE.Vector3(6, 0, 6),
    new THREE.Vector3(6, 0, 15),
  ],
  true
)

let progress = 0
const rate = 0.002

const initThree = () => {
  if (!build.value) {
    return false
  }

  const point = cameraRoute.getPoint(0)

  const nextPoint = cameraRoute.getPoint(rate)

  camera.position.set(point.x, point.y, point.z)
  camera.lookAt(nextPoint)

  scene.add(camera)
  scene.add(ambientLight)

  directionalLight.position.set(-10, 10, 30)
  scene.add(directionalLight)

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true

  build.value.appendChild(renderer.domElement)

  // new OrbitControls(camera, renderer.domElement)
}

const initCameraRoute = () => {
  const geo = new THREE.BufferGeometry().setFromPoints(
    cameraRoute.getPoints(100)
  )
  const mate = new THREE.LineBasicMaterial({
    color: 'red',
  })

  const line = new THREE.Line(geo, mate)

  scene.add(line)
}

const initResize = () => {
  window.addEventListener('resize', () => {
    // 重设相机宽高比例
    camera.aspect = window.innerWidth / window.innerHeight
    // 更新相机投影矩阵
    camera.updateProjectionMatrix()
    // 重设渲染器渲染范围
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
}

const initModel = () => {
  const loader = new GLTFLoader()

  loader.load('/model/build/scene.gltf', (gltf) => {
    model = gltf.scene

    model.position.set(335, -72, -15)
    model.scale.multiplyScalar(1.5)

    model.traverse((child) => {
      if (child['isMesh']) {
        const color = child['material'].color.getHex()

        if (color == 5263440 || color == 5262669) {
          child['material'].color = new THREE.Color(0xeeeeee)
        }
      }
    })

    // const axes = new THREE.AxesHelper(100)
    // scene.add(axes)

    scene.add(model)
  })
}

const aniCameraProgress = (type: boolean) => {
  progress = type ? (progress += rate) : (progress -= rate)

  progress = progress > 1 ? 0 : progress
  progress = progress < 0 ? 1 : progress

  const point = cameraRoute.getPoint(progress)

  const nextPoint = cameraRoute.getPoint(progress + rate)

  camera.position.set(point.x, point.y, point.z)

  camera.lookAt(nextPoint)
}

const mouseHandler = (e: Event) => {
  const type = e['deltaY'] > 0
  aniCameraProgress(type)
}

const animate = () => {
  requestAnimationFrame(animate)

  renderer.render(scene, camera)
}

onMounted(() => {
  initThree()

  initResize()

  initModel()

  // initCameraRoute()

  animate()

  window.addEventListener('mousewheel', mouseHandler)
})
</script>

<style lang="less">
.build {
  position: relative;
  h1 {
    position: absolute;
    color: #fff;
    font-size: 32px;
    transform: translate(-50%, 0);
    left: 50%;
    top: 50px;
  }
}
</style>