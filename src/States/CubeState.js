import * as THREE from 'three';

import State from './State';
import Population from '../Population';
import Genotype from '../Genotype';
import GenotypeBlueprint from '../GenotypeBlueprint';

class CubeState extends State
{
    constructor(sceneWrapper) {
        super(sceneWrapper);

        this.delay = 150;
        this.nbPerRow = 6;
        this.cellsize = 1000;
        this.basePopulationCount = 36;
    }

    init() {
        this.layers = new THREE.Group();
        this.layers.shouldBeDeletedOnCleanUp = true;
        this.scene.add(this.layers);

        // init scene
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        this.scene.add(directionalLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const x = this.nbPerRow / 2 * this.cellsize;
        const z = this.nbPerRow / 2 * this.cellsize;
        const y = 0;
        this.wrapper.controls.getObject().position.set(x, y, z);

        /* init algo 

        1 byte => 8 bit

        * Box => Cube
        * -- Couleur (8 bits par couleurs : 0 - 255) 24 bits
        * -- Width (8 bits : 0 - 255)
        * -- Height (8 bits : 0 - 255)
        * -- Depth (8 bits : 0 - 255)
        * 1111 1111|1111 1111|1111 1111|0000 1000|0000 1000|0000 1000
        */

        this.cubeBlueprint = new GenotypeBlueprint();
        this.cubeBlueprint.addTrait('r', 8, GenotypeBlueprint.INTEGER, 255, value => value / 255);
        this.cubeBlueprint.addTrait('g', 8, GenotypeBlueprint.INTEGER, 128, value => value / 255);
        this.cubeBlueprint.addTrait('b', 8, GenotypeBlueprint.INTEGER, 0, value => value / 255);
        this.cubeBlueprint.addTrait('width', 8, GenotypeBlueprint.INTEGER, 16);
        this.cubeBlueprint.addTrait('height', 8, GenotypeBlueprint.INTEGER, 16);
        this.cubeBlueprint.addTrait('depth', 8, GenotypeBlueprint.INTEGER, 16);

        this.population = new Population(this.basePopulationCount, this.cubeBlueprint.size, 0.0075);
        this.population.evaluate(this.cubeBlueprint);

        this.show();
        this.loop();
    }

    loop() {
        setTimeout(() => {
            const target = this.population.select(this.cubeBlueprint);
            this.show();

            // stop loop if we found the target specimen
            if (target === null) {
                this.loop();
            }
        }, this.delay);
    }

    /**
     * Place current population on a grid in 3d
     */
    show() {
        const group = new THREE.Group();
        group.shouldBeDeletedOnCleanUp = true;

        this.population.genotypes.forEach((genotype, i) => {
            const data = this.cubeBlueprint.decode(genotype);
            
            const geometry = new THREE.BoxGeometry(data.width, data.height, data.depth);
            const material = new THREE.MeshLambertMaterial({
                color: new THREE.Color(data.r, data.g, data.b), 
                transparent: true, 
                opacity: 1.0
            });

            const cube = new THREE.Mesh(geometry, material);
            cube.shouldBeDeletedOnCleanUp = true;
            cube.castShadow = true;
            cube.receiveShadow = true;

            const row = Math.floor(i / this.nbPerRow);
            const col = i % this.nbPerRow;

            const x = col * this.cellsize;
            const y = 0;
            const z = row * this.cellsize;

            cube.position.set(x, y, z);
           
            group.add(cube);
        });

        // y position based on generation
        group.position.y = this.population.generation * 750;

        this.layers.add(group);
    }

    update(delta) {
        
    }
}

export default CubeState;