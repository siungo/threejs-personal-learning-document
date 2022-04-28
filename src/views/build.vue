<template>
  <div class="build" ref="build">
    <h1>滑动鼠标滚轮穿梭在房子中</h1>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, render } from 'vue'
import * as THREE from 'three'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'

import buildPic1 from '@img/build-pic-1.png'

import createPic from '@libs/createPic'

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

const picMeshs: THREE.Mesh[] = []

const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene,
  camera
)

const effectFXAA = new ShaderPass(FXAAShader)

let model

let group = new THREE.Group()

const cameraRoute = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-5, 0, 15),
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

    group.add(model)

    model.position.set(335, -72, -15)
    model.scale.multiplyScalar(1.5)

    let buildMeshs: THREE.Object3D<THREE.Event>[] = []
    model.traverse((child) => {
      if (child['isMesh']) {
        const color = child['material'].color.getHex()

        if (color == 5263440 || color == 5262669) {
          child['material'].color = new THREE.Color(0xeeeeee)
          buildMeshs.push(child)
        }
      }
    })

    const picMesh1 = createPic(buildPic1)

    picMesh1.rotation.set(0, -Math.PI / 2, 0)
    picMesh1.position.set(-5.58, 0, 7.5)

    group.add(picMesh1)

    picMeshs.push(picMesh1)

    // const axes = new THREE.AxesHelper(100)
    // scene.add(axes)

    scene.add(group)

    initComposer()
  })
}

const initComposer = () => {
  composer.setSize(window.innerWidth, window.innerHeight)
  composer.setPixelRatio(window.devicePixelRatio)
  composer.renderTarget1.texture.encoding = THREE.sRGBEncoding
  composer.renderTarget2.texture.encoding = THREE.sRGBEncoding

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  composer.addPass(renderPass)

  // outlinePass.selectedObjects = picMeshs
  outlinePass.edgeStrength = 10.0 // 边框的亮度
  outlinePass.edgeGlow = 1 // 光晕[0, 1]
  outlinePass.usePatternTexture = false // 是否使用父级材质
  outlinePass.edgeThickness = 1 // 边框宽度
  outlinePass.downSampleRatio = 1 // 边框弯曲度
  outlinePass.pulsePeriod = 5 // 呼吸闪烁的速度
  outlinePass.visibleEdgeColor.set(0xffffff) // 呼吸显示的颜色
  outlinePass.hiddenEdgeColor = new THREE.Color(0, 0, 0) // 呼吸消失的颜色
  outlinePass.clear = true

  composer.addPass(outlinePass)

  effectFXAA.uniforms.resolution.value.set(
    1 / window.innerWidth,
    1 / window.innerHeight
  )
  effectFXAA.renderToScreen = true
  // composer.addPass(effectFXAA)
}

const aniCameraProgress = (type: boolean) => {
  progress = type ? (progress += rate) : (progress -= rate)

  progress = progress > 1 ? 0 : progress
  progress = progress < 0 ? 1 : progress

  const point = cameraRoute.getPoint(progress)

  const nextPoint = cameraRoute.getPoint(progress + rate)

  camera.position.set(point.x, point.y, point.z)

  if (progress >= 0.04 && progress <= 0.08) {
    camera.lookAt(picMeshs[0].position)
  } else {
    camera.lookAt(nextPoint)
  }
}

const mouseWheelHandler = (e: Event) => {
  const type = e['deltaY'] > 0

  aniCameraProgress(type)
}

const animate = () => {
  requestAnimationFrame(animate)

  composer.render()
  // renderer.render(scene, camera)
}

const mouseMoveHandler = (e: MouseEvent) => {
  e.preventDefault();

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(scene.children)

  const selMesh = intersects.map((v => {
    return picMeshs.filter((j => {
      return v.object.id == j.id
    }))
  })).filter(m => {
    return m.length != 0
  }).flat();

  outlinePass.selectedObjects = selMesh;
}

onMounted(() => {
  initThree()

  initResize()

  initModel()

  // initCameraRoute()

  animate()

  window.addEventListener('mousewheel', mouseWheelHandler)
  window.addEventListener('mousemove', mouseMoveHandler)
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