import { TextureLoader, PlaneGeometry, MeshPhongMaterial, Mesh } from 'three'

const createPic = (img: string) => {
    const texture = new TextureLoader().load(img);

    const picGeo = new PlaneGeometry(1, 1.5);

    const picMate = new MeshPhongMaterial({
        map: texture,
        color: 0xffffff,
        emissiveMap: texture,

    })

    const picMesh = new Mesh(picGeo, picMate);

    return picMesh
}

export default createPic