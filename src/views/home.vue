<template>
  <div class="home" ref="home"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as THREE from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'

import shaderData from '@/config/shaderData';
import router from '@/router';

// import logo from '@img/logo.png';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
// const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
})

const home = ref<HTMLElement | null>(null)

let model;

const bloomLayer = new THREE.Layers();
bloomLayer.set(1);

let bloomComposer = new EffectComposer(renderer);
let finalComposer = new EffectComposer(renderer);

const darkMaterial = new THREE.MeshBasicMaterial({
  color: 0x000000
})
let materialsArr = {};

const initThree = () => {
  if (!home.value) {
    return false;
  }

  // scene.background = new THREE.Color(0xffffff);

  // const loader = new THREE.TextureLoader();
  // loader.load(logo, (texture) => {
  //   scene.background = texture;
  // })

  camera.position.z = 1000;
  scene.add(camera);
  scene.add(ambientLight);

  // directionalLight.position.set(0, 500, 100)
  // directionalLight.castShadow = true;
  // scene.add(directionalLight);

  // const helper = new THREE.DirectionalLightHelper(directionalLight, 1)
  // scene.add(helper)

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;

  home.value.appendChild(renderer.domElement);

  new OrbitControls(camera, renderer.domElement)
}

const initModel = () => {
  const loader = new GLTFLoader();

  loader.load('/model/shibuya/scene.gltf', (gltf) => {
    model = gltf.scene;

    model.scale.multiplyScalar(0.4)
    model.position.y = -200
    model.position.x = -400

    model.castShadow = true;
    model.receiveShadow = true;

    const objs = model.children[0].children[0].children[0].children;

    // console.log(objs)

    model.traverse((child) => {
      const modelName = child.name;

      switch (modelName) {
        case 'billboard': {
          // 右侧大广告牌 children[0]是背面 children[1]是正面
          child.children[0]['material'] = new THREE.MeshPhongMaterial({
            color: new THREE.Color(0xcccccc),
            shininess: 100
          })

          const map = child.children[1]['material'].emissiveMap;

          child.children[1]['material'] = new THREE.MeshPhongMaterial({
            map: map,
            emissiveMap: map,
            shininess: 100,
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 0.5
          })

          child.children[1].layers.enable(1);

          break;
        }

        case 'billboard-wireframe': {
          // 右侧大广告牌的黑色框架
          child.children[0].position.y = -0.1
          child.children[0]['material'] = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 100
          })
          break;
        }
        case 'lamp': case 'lamp001': case 'lamp002': {
          // 右侧大广告牌上面的三个灯
          const light = new THREE.PointLight(0xffff00, 1);
          light.castShadow = true;
          light.receiveShadow = true;

          light.position.x = 2;

          child.children[2].add(light);

          child.children[0]['material'] = new THREE.MeshPhongMaterial({
            color: 0x222222,
            emissive: 0x222222,
            shininess: 100
          })

          child.children[1]['material'] = new THREE.MeshPhongMaterial({
            color: 0x222222,
            emissive: 0x222222,
            shininess: 100
          })
          break;
        }
        case 'cube-letter':
        case 'cube-letter001':
        case 'cube-letter002':
        case 'cube-letter003':
        case 'cube-letter004':
        case 'cube-letter005':
        case 'cube-letter007':
          {
            // 七个led广告牌灯

            child.children[1]['material'] = new THREE.MeshPhongMaterial({
              color: 0xffffff,
              emissive: 0xffffff,
              emissiveIntensity: 1
            })

            child.children[1].layers.enable(1);

            break;
          }
        case 'takoyaki-ya': case 'takoyaky-ta': case 'takoyaki-ko': case 'takoyaki-ki': {
          // 大广告牌旁边四个小字灯的字 正面
          child.position.z += 10
          break;
        }
        case '2-takoyaki-ya': case '2-takoyaki-ta': case '2-takoyaki-ko': case '2-takoyaki-ki': {
          // 大广告牌旁边四个小字灯的字 背面
          child.position.z -= 10
          break;
        }
        case 'donkey': case 'jote': {
          // donkey广告牌上的字
          child.position.z += 10;
          child.children[0].layers.enable(1);
          break;
        }
        case 'cube-letter006': {
          // donkey广告牌的边框
          child.children[0].layers.enable(1);
          break;
        }
        case 'text-shibuya':
        case 'text-shibuya001':
        case 'text-shibuya003':
          {
            // 涉谷109的led字
            child.position.x -= 100
            child.children[0].layers.enable(1);

            break;
          }
        case 'text-shibuya002': {
          // TOMA CAFE的led字
          child.children[0].layers.enable(1);
          break;
        }
        default:
          break;
      }
    })

    scene.add(model)
  })
}

const initComposer = () => {
  const params = {
    bloomStrength: 1,
    bloomThreshold: 0,
    bloomRadius: 0
  }

  const renderScene = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
  bloomPass.threshold = params.bloomThreshold;
  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;

  bloomComposer.renderToScreen = false;
  bloomComposer.setSize(window.innerWidth, window.innerHeight);
  bloomComposer.setPixelRatio(window.devicePixelRatio);
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);

  const finalPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: {
          value: null
        },
        bloomTexture: {
          value: bloomComposer.renderTarget2.texture
        }
      },
      vertexShader: shaderData.bloomVertexShader,
      fragmentShader: shaderData.bloomFragmentshader,
      defines: {}
    }),
    'baseTexture'
  )

  finalPass.needsSwap = true;

  finalComposer.setSize(window.innerWidth, window.innerHeight);
  finalComposer.setPixelRatio(window.devicePixelRatio);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(finalPass);
}

const renderBloom = () => {
  scene.traverse(darkenNonBloomed);
  bloomComposer.render();
  scene.traverse(restoreMaterial);
  finalComposer.render();
}

const darkenNonBloomed = (obj: THREE.Object3D<THREE.Event>) => {
  if (obj instanceof THREE.Scene) {
    materialsArr['scene'] = obj.background;
    obj.background = null;
    return;
  }

  if (obj['isMesh'] && bloomLayer.test(obj.layers) === false) {
    materialsArr[obj.uuid] = obj['material'];
    obj['material'] = darkMaterial;
  }
}

const restoreMaterial = (obj: THREE.Object3D<THREE.Event>) => {
  if (obj instanceof THREE.Scene) {
    obj.background = materialsArr['scene'];
    delete materialsArr['scene'];
  }

  if (materialsArr[obj.uuid]) {
    obj['material'] = materialsArr[obj.uuid];
    delete materialsArr[obj.uuid];
  }
}

const initResize = () => {
  window.addEventListener('resize', () => {
    // 重设相机宽高比例
    camera.aspect = window.innerWidth / window.innerHeight;
    // 更新相机投影矩阵
    camera.updateProjectionMatrix();
    // 重设渲染器渲染范围
    renderer.setSize(window.innerWidth, window.innerHeight);
  })
}

const animate = () => {
  requestAnimationFrame(animate);

  renderBloom();

  // renderer.render(scene, camera);
}

onMounted(() => {
  initThree();

  initModel();

  initComposer();

  initResize();

  animate();
})
</script>

<style lang="less" scoped>
// .home {
  // background: #ccc;
// }
</style>
