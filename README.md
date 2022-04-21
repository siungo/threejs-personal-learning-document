# threejs常用方法整理

three.js是一个应用于web端，基于webGl的3D可视化开发的js库，本文档整理记录一下threejs的常用方法。

我用threejs是和vue3.0一起使用的，但基本运用到的是threejs的api和js代码，vue3.0的语法相对用的较少，所以跟vue关系不大。

## 基本使用

### 初始化

创建一个场景

引入threejs：

我们可以使用npm安装threejs库，并使用模块重命名引入整个库：

```bash
npm install three

import * as THREE from 'three';
```

因为我大部分项目使用的是ts，所以可能还要安装threejs的types：

```bash
npm install @types/three
```

创建一个基本的场景需要以下变量，请注意他们是必选的

```bash

# 渲染各种物体的场景类，相当于舞台
const scene = new THREE.Scene();

# 相机，用于看到场景内物体的类，这里我们使用的是PerspectiveCamera（透视相机）
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

# 光，没了他场景会一片乌漆嘛黑，看不见场景内的物体，这里我们使用的是AmbientLight（环境光）
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);

# 渲染器，用于渲染场景和相机
const renderer = new THREE.WebGlRenderer({
  antialias: true, # 是否开启抗锯齿
  alpha: true # 是否开启背景透明
})

# 用于显示渲染器中的canvas的父元素，需要把canvas添加到这个父元素中显示在html
const home = ref<HTMLElement | null>(null);

```

> 这里设置threejs的常量不用vue3.0的ref()函数，是因为如果使用ref()的话，常量会变成一个响应式数据对象，变量.value是一个Proxy对象，导致拿不到真正的Scene对象。

```bash
const scene = ref<THREE.Scene | null>(null);

scene.value = new THREE.Scene();

scene.add(camera);

# console TypeError: scene.add is not a function
```

创建好这几个常量后，我们通过一个函数初始化这些常量：

```bash
<template>
  <div class="home" ref="home"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as THREE from 'three';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);

const renderer = new THREE.WebGlRenderer({
  antialias: true,
  alpha: true
})

const home = ref<HTMLElement | null>(null);

# 初始化
const initThree = () => {
  if(!home.value){
    return false;
  }

  # 相机的z轴设置1000
  camera.position.z = 1000;
  
  # 场景添加相机和环境光源
  scene.add(camera);
  scene.add(ambientLight);

  # 设置渲染器的范围，一般是浏览器可视区的宽高
  renderer.setSize(window.innerWidth, window.innerHeight);

  # 设置渲染器的像素密度，不设置可能会出现视图模糊的情况
  renderer.setPixelRatio(window.devicePixelRatio);
  
  # 允许渲染器渲染阴影
  renderer.shadowMap.enabled = true;

  # 把渲染器的canvas添加到要显示的元素中
  home.value.appendChild(renderer.domElement);
}

# 在生命周期内调用该函数
onMounted(() => {
  initThree();
})
</script>
```

一个基本的渲染初始化就完成了，但我们需要让场景实时渲染，所以需要使用 [requestAnimationFrame](https:#developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame) 函数来循环调用渲染函数，更新帧动画。

```bash
const animate = () => {
  # 更新帧动画
  requestAnimationFrame(animate);

  # 使用渲染器渲染场景和相机
  renderer.render(scene, camera);
}

onMounted(() => {
  animate();
})
```

> 这里使用requestAnimationFrame而不使用setInterval的原因是，虽然这两个函数都是实现循环触发事件，但setInterval是基于时间的，requestAnimationFrame是基于帧数的，requestAnimationFrame的自适应能力强，并且在切到后台的时候会自动停止函数，详情可以了解以下两个api的文档介绍:
[requestAnimationFrame api文档](https:#developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame)
[setInterval api文档](https:#developer.mozilla.org/zh-CN/docs/Web/API/setInterval)

### 监听窗口，更新视图

我们可以使用window事件监听器，监听窗口变化并重置视图

```bash
const initResize = () => {
  # 监听窗口变化
  window.addEventListener('resize', () => {
    # 重设相机宽高比例
    camera.aspect = window.innerWidth / window.innerHeight;
    # 更新相机投影矩阵
    camera.updateProjectionMatrix();
    # 重设渲染器渲染范围
    renderer.setSize(window.innerWidth, window.innerHeight);
  })
}

# 在生命周期里调用
onMounted(() => {
  initResize();
})
```

### 添加几何体

场景创建好了，怎么在场景里添加物体呢？

threejs内置了许多几何类，我们可以通过创建不同类来实现创建几何体

一个完整的几何体包括“结构（Geometry）”、“材质（Material）”，创建这两个变量后，通过new THREE.Mesh()合并成几何体实例。

```bash
# 定义一个全局变量 用来存储物体实例
let boxMesh;

# 创建一个正方体
const initBox = () => {
  # 创建结构，这里使用的是立方体类，创建一个长宽高为1的立方体
  const boxGeo = new THREE.boxGeometry(1, 1, 1);

  # 创建材质，这里使用金属类材质，颜色为白色
  const boxMate = new THREE.MeshPhongMaterial({
    color: 0xffffff
  });

  # 将结构和材质合并生成实例
  boxMesh = new THREE.Mesh(boxGeo, boxMate);

  # 将实例添加到场景中
  scene.add(boxMesh);
}

# 在生命周期里调用
onMounted(() => {
  initBox();
})
```

### 添加模型

threejs提供了主流3D模型文件的加载器，当我们需要导入一个模型时，我们只需要引入不同的模型加载器就能加载模型文件。

> 考虑到需要在程序上运行的3D模型，threejs推荐的模型格式为glTF，当然如果是其他的文件格式，只需要引入不同的加载器就可以了。

```bash
# 在pubilc里新建一个model文件夹，将模型文件放在public/model/文件夹里面，这里是静态文件夹

# public/model/shibuya 这里是本项目存放模型的地方，是一个广告牌模型

# 所有的模型加载器都在'three/examples/jsm/loaders/'里，按照文件类型的不同来引入不同的loader，每个loader的语法上可能不同，这里引入的是GLTF文件加载器。
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

# 定义一个全局变量 用来存储模型的实例
let model;

# 初始化模型
const initModel = () => {
  # 实例化加载器
  const loader = new GLTFLoader();

  # 加载模型文件
  # 模型文件加载成功会返回一个模型文件对象resource，resource.scene为模型实例
  loader.load('/model/shibuya/scene.gltf', (gltf) => {
    # 将实例赋值在全局变量
    model = gltf.scene;

    # 缩小模型至相对于模型自身的40%
    model.scale.multiplyScalar(0.4);

    # 微调一下模型的位置
    model.position.y = -200;
    model.position.x = -400;

    # 让模型能产生阴影和接收阴影
    model.castShadow = true;
    model.receiveShadow = true;

    # 在场景里添加模型实例
    scene.add(model)
  })
}
```

> [本项目的模型文件地址（越过长城，走向世界！）](https:#sketchfab.com/3d-models/neon-signs-billboard-japanese-vaporwave-shibuya-f4fb7741b2a94ae3938355c1c34554a8)

![模型](./mdImg/img-1.png)

### 调整模型细节

直接加载进去的模型可能不太尽人意，比如本来是钢板的地方，加载进去却像塑料，有灯的地方没有灯光照射出来等等，于是我们需要遍历并逐个调整模型中的细节。

> [Object3D.traverse：获取外部模型所有子节点](https:#threejs.org/docs/index.html#api/zh/core/Object3D.traverse)

```bash
# 获取模型内所有子节点
model.traverse((child) => {
  # 获取子节点的name，通过name区分操作
  const modelName = child.name;

  switch (modelName) {
    case 'billboard': {
      # 右侧大广告牌 children[0]是背面 children[1]是正面

      # 背面换成金属材质
      child.children[0]['material'] = new THREE.MeshPhongMaterial({
        color: new THREE.Color(0xcccccc), # 材质色改为灰色
        shininess: 100 # 金属材质的高亮程度，这里设置100%
      })

      # 因为正面材质中存在贴图，所以需要定义一个变量保存这个贴图
      const map = child.children[1]['material'].emissiveMap;

      # 正面换成金属材质
      child.children[1]['material'] = new THREE.MeshPhongMaterial({
        map: map, # 将贴图重新赋予材质中
        emissiveMap: map, # 设置放射的贴图
        shininess: 100,
        emissive: new THREE.Color(0xffffff), # 自发光的颜色，设置为白色
        emissiveIntensity: 0.5 # 自发光的程度，设置为0.5
      })

      # 将该实例分至第1层
      child.children[1].layers.enable(1);

      break;
    }

    case 'billboard-wireframe': {
      # 右侧大广告牌的黑色框架
      
      # 微调y轴，使框架突出，不然跟广告牌重叠会导致广告牌花屏
      child.children[0].position.y = -0.1

      #将框架替换为金属材质
      child.children[0]['material'] = new THREE.MeshPhongMaterial({
        color: 0x000000,
        shininess: 100
      })
      break;
    }
    case 'lamp': case 'lamp001': case 'lamp002': {
      # 右侧大广告牌上面的三个灯

      # 创建聚光灯实例，这里使用的是THREE.PointLight
      const light = new THREE.PointLight(0xffff00, 1);
      
      # 使聚光灯能够产生阴影和接受阴影
      light.castShadow = true;
      light.receiveShadow = true;

      # 微调灯的位置
      light.position.x = 2;

      # 灯泡实例，把聚光灯添加到灯泡里
      child.children[2].add(light);

      # 将灯杆和灯罩替换为金属材质
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
        # 七个led广告牌灯

        #　将灯面替换为金属材质
        child.children[1]['material'] = new THREE.MeshPhongMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 1
        })

        # 将该实例分至第1层
        child.children[1].layers.enable(1);

        break;
      }
    case 'takoyaki-ya': case 'takoyaky-ta': case 'takoyaki-ko': case 'takoyaki-ki': {
      # 大广告牌旁边四个小字灯的字 正面

      # 微调字的位置
      child.position.z += 10
      break;
    }
    case '2-takoyaki-ya': case '2-takoyaki-ta': case '2-takoyaki-ko': case '2-takoyaki-ki': {
      # 大广告牌旁边四个小字灯的字 背面

      # 微调字的位置
      child.position.z -= 10
      break;
    }
    case 'donkey': case 'jote': {
      # donkey广告牌上的字

      # 微调字的位置
      child.position.z += 10;

      # 将该实例分至第1层
      child.children[0].layers.enable(1);
      break;
    }
    case 'cube-letter006': {
      # donkey广告牌的边框

      # 将该实例分至第1层
      child.children[0].layers.enable(1);
      break;
    }
    case 'text-shibuya':
    case 'text-shibuya001':
    case 'text-shibuya003':
      {
        # 涉谷109的led字
        
        # 微调字的位置
        child.position.x -= 100;

        # 将该实例分至第1层
        child.children[0].layers.enable(1);

        break;
      }
    case 'text-shibuya002': {
      # TOMA CAFE的led字

      # 将该实例分至第1层
      child.children[0].layers.enable(1);
      break;
    }
    default:
      break;
  }
})
```

这是经过微调后的模型，是不是感觉好多了，发光的发光，反光的反光。

![微调后的模型](./mdImg/img-2.png)

在座细心的各位会发现我把某些实例分层在第一层，这是为什么呢？

### 添加辉光后期处理

> 既然这是个广告牌，还那么多霓虹灯，就该有灯的样子，我印象中的霓虹灯。。。灯红酒绿。。。有种雾里的感觉，特别梦幻，现在的模型没有一种特别梦幻的感觉，反而像玩具。。。

所以滤镜加起来！

threejs封装了很多后期处理的工具库，我们可以按需引入

```bash
# libs/shaderData.ts
# 创建一个存放顶点着色器和片段着色器内容的ts文件，并暴露出去
# 官方例子是把顶点着色器和片段着色器存放在两个script标签里，在vue项目中我们可以使用es6的模板语法来存放，效果一样的
# 顶点着色器和片段着色器用GLSL着色器语言编写，这个暂且先了解一下就行

# 顶点着色器
const bloomVertexShader = `varying vec2 vUv;

void main() {

  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}`

# 片段着色器
const bloomFragmentshader = `uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;

varying vec2 vUv;

void main() {

  gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 0.5 ) * texture2D( bloomTexture, vUv ) );

}`

export default {
  bloomVertexShader,
  bloomFragmentshader,
}

# ---------------------------------

# home.vue
# 引入效果组合器
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'

# 引入渲染通道
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'

# 引入自定义着色器
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'

# 引入辉光通道
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'

# 定义两个效果组合器，一个作为渲染不需要发光的材质的组合器，一个作为渲染发光的材质的组合器
let bloomComposer = new EffectComposer(renderer);
let finalComposer = new EffectComposer(renderer);

# 初始化
const initComposer = () => {
  # 辉光通道的相关参数
  const params = {
    bloomStrength: 1, # 辉光的强度，值越大明亮的区域越亮
    bloomThreshold: 0, # 光照的强度阈值，如果照在物体上的光照强度大于该值就会产生辉光
    bloomRadius: 0 # 发光散光的范围半径
  }

  # 定义渲染通道实例
  const renderScene = new RenderPass(scene, camera);

  # 定义一个辉光效果通道实例
  # 设置通道的辉光覆盖范围（一般取可视屏幕的可视范围），强度，强度阈值，范围，这个靠自己目测看着来调就行了
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
  bloomPass.threshold = params.bloomThreshold;
  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;

  # 最终过程是否被渲染到屏幕
  # bloomComposer中不需要渲染到屏幕
  bloomComposer.renderToScreen = false;
  # 设置效果组合器的范围和像素密度
  bloomComposer.setSize(window.innerWidth, window.innerHeight);
  bloomComposer.setPixelRatio(window.devicePixelRatio);

  # 将渲染通道和辉光通道添加到通道组合器内
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);

  # 定义一个着色器，用于后期效果渲染
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
      vertexShader: shaderData.bloomVertexShader, # 顶点着色器
      fragmentShader: shaderData.bloomFragmentshader, # 片段着色器
      defines: {}
    }),
    'baseTexture'
  )

  # 官方文档中找不到这个属性的解释
  # 打开源码搜索了一下终于找到了一句注释
  # if set to true, the pass indicates to swap read and write buffer after rendering
  # 意思是如果这个属性设置为true，则过程指示在渲染后交换读写缓冲区
  # 我寻思可能是对于一些大型的效果又很炫酷的项目开启这个属性，在渲染的时候会把效果存储在缓冲区，后面用到时再重复调用，在显示效果的性能上会好一点，这个先了解一下就行
  # 反正在这个项目中我搁这不管设置为true或者false，最终显示效果都没啥区别-_-||
  finalPass.needsSwap = true;

  # 设置效果组合器的范围和像素密度
  finalComposer.setSize(window.innerWidth, window.innerHeight);
  finalComposer.setPixelRatio(window.devicePixelRatio);
  
  # 将渲染通道和辉光通道添加到通道组合器内
  finalComposer.addPass(renderScene);
  finalComposer.addPass(finalPass);
}

# 在生命周期内调用
onMounted(() => {
  initComposer();
})
```

这里我们定义了一组辉光通道处理效果，我们接下来需要调用并渲染它

先定义一些需要用到的全局变量
```bash
# 定义一个层阶为1的视图层，用来后续做判断渲染
const bloomLayer = new THREE.Layers();
bloomLayer.set(1);

# 定义一个黑色普通材质实例，用于后续辉光渲染使用
const darkMaterial = new THREE.MeshBasicMaterial({
  color: 0x000000
})

# 临时存放材质实例对象合集
let materialsArr = {};
```

添加了后期效果通道后，我们需要修改之前的渲染方式，不能依靠`renderer.render()`来渲染了

```bash
# 定义一个将所有子节点转为黑色材质的回调函数
const darkenNonBloomed = (obj: THREE.Object3D<THREE.Event>) => {

  # 我们不需要渲染场景的背景色后期效果，所以scene需要做特殊判断处理
  if (obj instanceof THREE.Scene) {
    materialsArr['scene'] = obj.background;
    obj.background = null;
    return;
  }

  # 将不属于第1层的节点材质改为黑色
  # 改材质是为了渲染辉光的时候原本材质不受污染
  if (obj['isMesh'] && bloomLayer.test(obj.layers) === false) {
    # 把材质储存在对象中做统一管理
    materialsArr[obj.uuid] = obj['material'];
    obj['material'] = darkMaterial;
  }
}

# 定义一个将所有子节点还原材质的回调函数
const restoreMaterial = (obj: THREE.Object3D<THREE.Event>) => {
  # 场景做特殊处理，还原scene并删除对象中的scene
  if (obj instanceof THREE.Scene) {
    obj.background = materialsArr['scene'];
    delete materialsArr['scene'];
  }

  # 将之前的节点材质从黑色材质改为原来的材质
  if (materialsArr[obj.uuid]) {
    obj['material'] = materialsArr[obj.uuid];
    # 删除对象中对应的材质
    delete materialsArr[obj.uuid];
  }
}

# 通道渲染函数
const renderBloom = () => {
  # 先把不需要的材质赋黑色材质
  scene.traverse(darkenNonBloomed);
  # bloomComposer组合器渲染
  bloomComposer.render();
  # 还原材质
  scene.traverse(restoreMaterial);
  # finalComposer组合器渲染
  finalComposer.render();
}

const animate = () => {
  # 更新帧动画
  requestAnimationFrame(animate);

  # 以前的渲染方式就不要了，改为通道渲染
  renderBloom();

  # renderer.render(scene, camera);
}
```

最终效果是这样的，是不是有一种霓虹灯该有的梦幻的感觉？

![模型](./mdImg/img-3.png)

这个辉光效果的代码借鉴于[这里](https://www.cnblogs.com/sugartang/p/14790292.html)

官方也有现成的[例子](https://threejs.org/examples/#webgl_postprocessing_unreal_bloom_selective)可以参考（白嫖）


## 常用api

以下是我通过开发demo用到的一些比较常用的api用法

### **场景（Scene）**
创建一个用于放置物体、模型、通道的[场景](https://threejs.org/docs/index.html#api/zh/scenes/Scene)，是构成整个threejs实例必要的类

用法：
```bash
const scene = new THREE.Scene()
```

修改scene的背景颜色

```bash
# scene.background可以接受THREE.Color()类和THREE.Texture类，根据自身需求进行选择

# 使用THREE.Color进行纯色背景填充
scene.background = new THREE.Color(0xffffff);

# 使用THREE.Texture进行图片背景填充
const loader = new THREE.TextureLoader();
loader.load('./xxx.png', (texture) => {
  scene.background = texture
})
```

### **相机（Camera）**

相机类，用于查看场景的元素，可以理解为你的浏览器窗口就是相机的摄像头，是组成threejs实例必要的类。

相机大致分为 **透视相机（PerspectiveCamera）** 和 **正交相机（OrthographicCamera）**

- [透视相机（PerspectiveCamera）](https://threejs.org/docs/index.html#api/zh/cameras/PerspectiveCamera)，在threejs比较常用且普遍的相机，用来模拟人的眼球所看到的景象。
```bash
# 初始化一个透视相机
# 透视相机接收四个参数
# fov — 摄像机视锥体垂直视野角度，该值数字越小，场景里的物体离相机的距离越近，反之越远
# aspect — 摄像机视锥体长宽比，一般使用 窗口文档显示区宽度 / 窗口文档显示区高度 的值
# near — 摄像机视锥体近端面，该值越大，场景里的物体能靠近相机的距离越短，反之越长
# far — 摄像机视锥体远端面，该值越大，场景里的物体能远离相机的距离越长，反之越短
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
```

- [正交相机](https://threejs.org/docs/index.html#api/zh/cameras/OrthographicCamera)，在正交相机里不管物体距离相机的距离是远还是近，他们的大小都不变，该相机类常用于2D场景较多的项目中。
```bash
# 初始化一个正交相机
# 正交相机接受六个参数
# left — 摄像机视锥体左侧面，一般为窗口文档显示区宽度 / -2。
# right — 摄像机视锥体右侧面，一般为窗口文档显示区宽度 / 2。
# top — 摄像机视锥体上侧面，一般为窗口文档显示区高度 / 2。
# bottom — 摄像机视锥体下侧面，一般为窗口文档显示区高度 / -2。
# near — 摄像机视锥体近端面，该值越大，场景里的物体能靠近相机的距离越短，反之越长
# far — 摄像机视锥体远端面，该值越大，场景里的物体能远离相机的距离越长，反之越短

const camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 0.1, 10000)
```

```bash
# 相机是一个THREE.object3D类，我们可以让相机做该类能做的事情，比如移动位置：
camera.position.set(100, 100, 100);

# 比如我们可以让相机一直“盯着”某个位置，或某个物体，即使我们改变了相机本身的位置
camera.lookAt(new THREE.Vector3(100, 100, 100));

const position = scene.position;
camera.lookAt(position);

# 应该还有其他比较骚的操作，但可惜我自己不是那么骚，想不出来。。。
```

### **光（Light）**

灯光类，用于给场景加载灯光，提供光源，是组成threejs实例必要的类。

> 如果你初始化了一个场景，但是窗口一片乌漆嘛黑，请检查是否在场景内添加了光源。

> 除了环境光，其他光源均可以产生阴影，环境光无法产生阴影是因为这货没有方向。

常用的灯光类包括**环境光（AmbientLight）**、**平行光（DirectionalLight）**、**点光源（PointLight）**、**聚光灯（SpotLight）**

- [环境光](https://threejs.org/docs/index.html#api/zh/lights/AmbientLight)，该光源会均匀照亮场景中的所有物体（雨露均沾。。。）。

```bash
# 初始化一个环境光
# 环境光类可接受两个参数
# color - （可选参）光的颜色，使用rgb色值，默认值为0xffffff
# intersity - （可选参）光的强度，该值越大，光线越强，默认为1
const light = new THREE.AmbientLight(0xffffff, 1)
```

- [平行光](https://threejs.org/docs/index.html#api/zh/lights/DirectionalLight)，是沿着特定方向发射的光，这种光理论可以无限远，在现实中，太阳光就是一种平行光。

```bash
# 初始化一个平行光
# 平行光类可接受两个参数
# color - （可选参）光的颜色，使用rgb色值，默认值为0xffffff
# intersity - （可选参）光的强度，该值越大，光线越强，默认为1
const light = new THREE.DirectionalLight(0xffffff, 1);
```

- [点光源](https://threejs.org/docs/index.html#api/zh/lights/PointLight)，是一个在固定点位放射的光源，类似于夜空中的萤火虫。

```bash
# 初始化一个点光源
# 点光源类可接受三个参数
# color - （可选参）光的颜色，使用rgb色值，默认值为0xffffff
# intersity - （可选参）光的强度，该值越大，光线越强，默认为1
# distance - （可选参）光的衰退值，如果该值不为0，光就会从当前值衰减到0，默认为0
const light = new THREE.PointLight(0xffffff, 1, 0);
```

- [聚光灯](https://threejs.org/docs/index.html#api/zh/lights/SpotLight)，是一个在固定点沿着圆锥体照射的光源，可以想象在黑暗中打开一个手电筒。

```bash
# 初始化一个聚光灯源
# 聚光灯类可接受六个参数
# color - （可选参）光的颜色，使用rgb色值，默认值为0xffffff
# intersity - （可选参）光的强度，该值越大，光线越强，默认为1
# distance - （可选参）光的衰退值，如果该值不为0，光就会从当前值衰减到0，默认为0
# angle - （可选参）光的散射角度，最大为Math.PI / 2，默认为Math.PI / 3
# penumbra - （可选参）光锥的半影衰减百分比，可选值为0到1，默认为0
# decay - （可选参）光照距离的衰减值
const light = new THREE.SpotLight(0xffffff);
```

同样我们能够对光源做一些骚操作，比如：

```bash
# 放一个小球在点光源中，让光源具有实体

let light;

# 实例化一个小球
const ballGeo = new THREE.SphereGeometry(0.5, 16, 8);
const ballMate = new THREE.MeshBasicMaterial({
  color: 0xffffff
})
const ballMesh = new THREE.Mesh(ballGeo, ballMate);

# 实例化一个点光源
light = new THREE.pointLight(0xffffff, 1, 50);

# 将小球添加到光源中，这样我们可以得到一个看起来会发光的球
light.add(ballMesh);


# 让小球动起来
const animate = () => {
  requestAnimationFrame(animate);

  # 让光源x轴随帧率刷新而向x轴右方移动
  light.position.x += 0.0001;
}
```

要让光源能够产生阴影，需要将光源的 `castShadow = true`。

```bash
# 实例化一个平行光
const light = new THREE.DirectionalLight(0xffffff, 1);

# 让这个光源发射的光能够产生阴影
light.castShadow = true;

# 光源产生的阴影像素密度，值越大，像素密度越高，阴影越清晰
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;

# 调整光源产生的阴影贴图的属性
# 如果发现物体的阴影有缺失或者不正常，请尝试调整这些属性值
light.shadow.camera.near = 500;
light.shadow.camera.far = 4000;
light.shadow.camera.fov = 30;
```

### **渲染器（Renderer）**

渲染器，负责渲染场景及相机，并且生成一个canvas元素，该canvas是显示整个场景交互的元素，一般使用的是[WebGlRenderer](https://threejs.org/docs/index.html#api/zh/renderers/WebGLRenderer)渲染器。

```bash
# 初始化一个渲染器
const renderer = new THREE.WebGlRenderer({
  antialias: true, # 是否开启抗锯齿
  alpha: true # 是否开启背景透明
});

# 设置渲染器的宽高
renderer.setSize(window.innerWidth, window.innerHeight);
# 设置渲染器的像素密度
renderer.setPixelRatio(window.devicePixelRatio);

# 设置渲染帧缓冲区，如果遇到画布像素叠加的问题，可以试着将该属性设置为false
renderer.autoClear = false;

# 允许渲染阴影
# ***如果想让场景内的物体产生阴影，则必须设置该属性为true***
renderer.shadowMap.enabled = true;

# 可以替换阴影材质包，自己看哪种阴影更符合自身的需求
# - THREE.BasicShadowMap
# - THREE.PCFShadowMap (默认)
# - THREE.PCFSoftShadowMap
# - THREE.VSMShadowMap
renderer.shadowMap.type = THREE.basicShadowMap;
```

### 几何体实例

场景中的物体离不开几何体，像我们日常生活中的高楼大厦，车水马龙，映射在threejs的场景世界中，就是由一个个几何体组合而成。

threejs给开发者提供了很多常见的几何体类，供我们便捷高效的开发项目。

threejs中一个完整的几何体包括“结构（Geometry）”、“材质（Material）”，创建这两个变量后，通过new THREE.Mesh()合并成几何体实例。

#### **结构（Geometry）**

结构类是定义几何体形状的基本类，threejs已经封装了许多常见的几何体类供我们开箱即用，不过本质都是[BufferGeometry](https://threejs.org/docs/index.html#api/zh/core/BufferGeometry);

这里以一个盒体类作为例子：

```bash
# 创建一个长宽高为1的正方体
const geo = new THREE.boxGeometry(1, 1, 1);
```

##### **形状缓冲几何体结构（ShapeGeometry）**

假如threejs自带封装的几何体类无法满足自己的开发需求，我们可以使用[构造器（ShapeGeometry）](https://threejs.org/docs/index.html#api/zh/geometries/ShapeGeometry)以及[形状（Shape）](https://threejs.org/docs/index.html#api/zh/extras/core/Shape)来进行自定义几何体。

```bash
# 封装一个创建圆角矩形函数
# - shape 需要进行创建的shape
# - opts 圆角矩形的相关配置，x：矩形的x轴坐标点，y：矩形的y轴坐标点，width：矩形的宽度，height：矩形的高度，radius：矩形的圆角度数
# - returns shape 创建好的矩形
const roundedRect = (shape: THREE.Shape, opts: {
  x: number, 
  y: number, 
  width: number, 
  height: number,
  radius: number
}) => {
  shape.moveTo(opts.x, opts.y + opts.radius);
  shape.lineTo(opts.x, opts.y + opts.height - opts.radius);
  shape.quadraticCurveTo(opts.x, opts.y + opts.height, opts.x + opts.radius, opts.y + opts.height);
  shape.lineTo(opts.x + opts.width - opts.radius, opts.y + opts.height);
  shape.quadraticCurveTo(opts.x + opts.width, opts.y + opts.height, opts.x + opts.width, opts.y + opts.height - opts.radius);
  shape.lineTo(opts.x + opts.width, opts.y + opts.radius);
  shape.quadraticCurveTo(opts.x + opts.width, opts.y, opts.x + opts.width - opts.radius, opts.y);
  shape.lineTo(opts.x + opts.radius, opts.y);
  shape.quadraticCurveTo(opts.x, opts.y, opts.x, opts.y + opts.radius);

  return shape;
}

# 创建一个形状类
const shape = new THREE.shape();

# 将形状类和属性参传入封装函数中
const roundedRectShape = roundedRect(shape, { 0, 0, 1, 1, 0.2 });

# 使用构造器进行构造
const geo = new THREE.ShapeGeometry(roundedRectShape);
```

#### **材质（Material）**

材质是决定几何体表面外观的基本类，常用的材质分别为：
- [基础网格材质（MeshBasicMaterial）](https://threejs.org/docs/index.html#api/zh/materials/MeshBasicMaterial)，一种只有简单着色的几何体材质，存在该材质的物体无法产生阴影。

- [高光网格材质（MeshPhongMaterial）](https://threejs.org/docs/index.html#api/zh/materials/MeshPhongMaterial)，一种具有金属高光的几何体材质，多用于金属类，陶瓷类具有反光性质的几何体材质。

- [非高光网格材质（MeshLambertMaterial）](https://threejs.org/docs/index.html#api/zh/materials/MeshLambertMaterial)，一种不具备光泽度的几何体材质，没有高光，可以相当于磨砂材质，一般用于

> 差不多就用过这么几种，在日常开发中其实已经够用了，threejs官网还提供了很多其他特殊的材质，可以移步到这 —> [文档地址](https://threejs.org/docs/index.html#api/zh/materials/Material)

这里以一个高光材质作为例子：

```bash
# 创建一个颜色为白色的高光网格材质
const mate = new THREE.MeshPhongMaterial({
  color: 0xffffff,
});
```

#### **网格（Mesh）**

用于将结构和材质结合，生成物体实例的类，同时也作为其他类的[基类](https://threejs.org/docs/index.html#api/zh/objects/Mesh)。

```bash
# 将结构和材质结合，生成物体实例
# 该类可接收两个参数
# - geometry（可选参） 接收一个BufferGeometry的结构实例，默认值是一个新的BufferGeometry。
# - material（可选参） 接收一个Material的材质实例，默认是一个新的MeshBasicMaterial。
const mesh = new THREE.Mesh(geo, mate);

# 将物体添加到场景内
scene.add(mesh);
```

#### **纹理（Texture）**

用于在材质上使用贴图，自定义材质外观的类，使用[loader](https://threejs.org/docs/index.html#api/zh/loaders/Loader)加载。

```bash
# 创建一个纹理，使用TextureLoader()加载器
# 先定义一个加载器
const loader = new THREE.TextureLoader();

# 使用加载器加载贴图，加载器允许接收一个图片url，返回一个texture纹理
# 可以有两种加载写法
# 1.不带回调的写法
const texture = loader.load('xxx.png');

# 将纹理添加到材质中
mate.map = texture;

# 2.带有回调的写法
loader.load('xxx.png', (texture) => {
  # 将纹理添加到材质中
  mate.map = texture;
}, (progress) => {
  # 纹理加载中的回调，返回当前纹理加载的进度和字节
  console.log(progress)
}, (err) => {
  # 纹理加载错误的回调
  console.log(err)
})
```

#### **组（Group）**

用于将多个Object3D对象合并的类，如果你想将场景中的多个物体进行统一管理，可以使用该类。

```bash
# 创建一个组
const group = new THREE.Group();

# 将需要统一管理的物体添加到组内
# 添加两个几何体，一个灯光和一个模型
group.add(mesh1);
group.add(mesh2)
group.add(light);
group.add(model);

# 将组添加到场景中
scene.add(group);

# *** 渲染函数中 ***
const animate = () => {
  requestAnimationFrame(animate);

  # 使组进行x轴的旋转运动
  # 那么组内的物体都会相对于组的中心点进行x轴的旋转运动
  group.rotation.x += 0.001;
}
```

#### **点构造器（Points）**

一个用于显示点的类，一般用于制作粒子特效，用法跟`new THREE.Mesh()`大致相同。

```bash
# 实例化一个点类
# 该类可接收两个参数
# - geometry （可选参）接收一个BufferGeometry的结构实例，默认值是一个新的BufferGeometry。
# - material （可选参）接收一个对象，默认是一个新的pointMaterial。
const point = new THREE.Points();

# 将点添加到场景中
scene.add(point)
```

#### **点材质（PointsMaterial）**

一个适用于点类的材质。

```bash
# 实例化一个点材质
const pointMate = new THREE.pointsMaterial({
  color: 0xffffff
});

# 将点材质添加到点类中
point.material = pointMate;
```

### 后期效果

#### 效果组合器（EffectComposer）

[效果组合器](https://threejs.org/docs/index.html#examples/zh/postprocessing/EffectComposer)用于在threejs中实现各种后期特效效果，该类管理了最终后期特效效果的过程出历链，我们可将各种通道渲染添加至效果组合器中，统一管理并且渲染他。

**你必须额外在官方npm包中引入它才能够正常使用效果组合器**

```bash
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

# 实例化一个效果组合器
# 该类允许接收两个参数
# - renderer 用于渲染场景的渲染器
# - renderTarget （可选参）一个预先配置的渲染目标，内部由EffectComposer使用（这个参数暂且没用过，先了解一下）
const effectComposer = new EffectComposer(renderer);
```

#### 渲染通道

##### RenderPass

renderPass通常位于EffectComposer过程链的最上层，这个通道会渲染场景，但不会将渲染结果输出到屏幕上。

**你必须额外在官方npm包中引入它才能够正常使用RenderPass**

```bash
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'

# 实例化一个renderPass通道
# 该类允许接收六个参数
# - scene 将要渲染的场景实例
# - camera 将要渲染的相机实例
# - overrideMaterial （可选参）等同于scene.overrideMaterial, 强制将场景里的物体使用该参数作为材质
# - clearColor （可选参）等同于renderer.setClearColor()，设置renderer的颜色，合法参数是一个THREE.Color()函数
# - clearAlpha （可选参）等同于renderer.setClearAlpha()，设置renderer的透明度，合法参数是一个0.0到1.0之间的浮点数
# - clearDepth （可选参）等同于renderer.clearDepth，清除深度缓存
const renderPass = new RenderPass(scene, camera);
```

##### 其他动效通道

