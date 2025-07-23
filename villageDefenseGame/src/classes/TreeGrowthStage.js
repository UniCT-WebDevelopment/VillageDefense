export class TreeGrowthStage {
    constructor(scene, gameWidth, gameHeight, x, y, growthStage) {
        this.scene = scene;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.x = x;
        this.y = y;
        this.maxTreeNumber = 2000;

        this.treeImage = this.scene.add.image(this.x, this.y, growthStage).setOrigin(0.5, 0.5);
        this.scene.add.existing(this.treeImage);
        if (growthStage == "seed") {//Se si tratta di un seme, lo nasconde in attesa dell'animazione del lancio del seme
            this.hide();
        }

        this.treeImage.depthY = this.treeImage.y + (this.treeImage.displayHeight / 2) - 5;


    }

    hide() {
        this.treeImage.setVisible(false);
    }

    show() {
        console.log("Mostra il seme");
        this.treeImage.setVisible(true);
    }

    createNewStageTree(probability, nextStageClass) {


        const index = this.scene.trees.indexOf(this);
        if (index !== -1) {
            if (Phaser.Math.Between(1, 100) <= probability && this.scene.trees.length < this.maxTreeNumber) {//Se ricade nella probabilità e si rispetta il numero massimo di possibili alberi adulti in scena, crea l'oggetto
                console.log("Si passa allo stato successivo");
                const nextStage = new nextStageClass(this.scene, this.gameWidth, this.gameHeight, this.x, this.y);
                this.scene.trees[index] = nextStage;
            }
            else {
                this.scene.trees[index] = null;
                console.log("Numero di possibili nuovi alberi adulti: " + this.scene.trees.length)
            }


            this.destroy(); //distrugge l'immagine attuale
        }
    }



    destroy() {
        if (this.treeImage && this.treeImage.destroy) {
            this.treeImage.destroy();
        }
    }

    destroyObject() {
        if (this)
            this.destroy();
    }



}

export class Seed extends TreeGrowthStage {
    constructor(scene, gameWidth, gameHeight, x, y) {
        super(scene, gameWidth, gameHeight, x, y, "seed");

        this.juvenileStageProbability = null;
        this.growthSpeed = null; //velocità di crescita del seme per passare alla fase giovanile


    }

    throwSeed(avatar) {
        console.log("Lancio del seme");
        this.show(); //Mostra il seme prima dell'animazione
        this.treeImage.y = avatar.y - 50;

        this.scene.tweens.add({
            targets: this.treeImage,
            y: avatar.y, // Destinazione: ai piedi
            duration: 2000,
            ease: "Bounce.Out"
        });
    }


    setGrowthSpeed(growthSpeed) {
        this.growthSpeed = growthSpeed;
    }

    setJuvenileStageProbability(probability) {
        this.juvenileStageProbability = probability;
    }

    goToJuvenileStage() {
        if (this.growthSpeed) {
            this.scene.time.delayedCall(this.growthSpeed, () => {
                this.createNewStageTree(this.juvenileStageProbability, JuvenileStage); //Il seme diventa alberello con una certa probabilità
            });
        }
    }






}

export class JuvenileStage extends TreeGrowthStage {
    constructor(scene, gameWidth, gameHeight, x, y) {
        super(scene, gameWidth, gameHeight, x, y + 15, "juvenileStage");

        this.growthSpeed = null //Velocità di crescita del seme per passare alla fase adulta

        this.adultStageProbability = null;

    }



    setGrowthSpeed(speed) {
        this.growthSpeed = speed;
    }



    setAdultStageProbability(probability) {
        this.adultStageProbability = probability;
    }

    goToAdultStage() {
        if (this.growthSpeed) {
            this.scene.time.delayedCall(this.growthSpeed, () => {
                this.createNewStageTree(this.adultStageProbability, AdultStage);//L'alberello diventa albero con una certa probabilità
            });
        }
    }







}

export class AdultStage extends TreeGrowthStage {
    constructor(scene, gameWidth, gameHeight, x, y) {
        super(scene, gameWidth, gameHeight, x, y - 22, "adultStage");

        this.gatherTime = 30000;//in millisecondi
        this.woodVolume = 30;
        this.isGathered = false;
        this.hittings = 0;

    }

    hit() {
        this.hittings++;
    }

    addToWoodVolume(bonus) {
        this.woodVolume += bonus;
    }

    setGatherTime(time) {
        this.gatherTime = time;
    }

    gatherWood(woodVolume) {//Il forte acquista legna
        if (this.scene.woodenFort) {

            if (this.scene.woodenFort) {
                console.log("Il forte è presente in scena e pronto a ricevere legna");
                this.scene.woodenFort.acquireWood(woodVolume);

            }
            else
                console.log("Il forte non è presente in scena e quindi non può ricevere legna");

            this.scene.trees = this.scene.trees.filter(t => t !== this); //Rimuove l'albero dall'array degli alberi
            this.destroy(); //Rimuove l'oggetto


        }
    }




}