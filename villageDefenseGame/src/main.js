import './style.css'
import Phaser from 'phaser'
import { io } from 'socket.io-client';
import { Avatar } from './classes/Avatar.js'
import { EnemyOne, EnemyTwo, EnemyThree, EnemyFour } from './classes/Enemy.js';
import { Seed, JuvenileStage } from './classes/TreeGrowthStage.js';
import { WoodenFort } from './classes/WoodenFort.js';
import { Ranking } from './classes/Ranking.js';

const socket = io(); //Funziona con Vite + proxy




class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");


  }

  cleanupScene() {
    console.log("Pulizia completa della scena GameScene");

    //Avatar
    this.avatars.forEach(avatar => {
      avatar.resetAvatarState?.();

    });




    //Alberi
    this.trees.forEach(tree => {
      tree.hittings = 0;
      tree.isGathered = false;
    });


    //Timer
    this.time.removeAllEvents()


    //Eventi personalizzati
    this.events.removeAllListeners();

    //Tween
    this.tweens.killAll();

    //Time events
    this.time.clearPendingEvents();

    //Distruzione manuale del forte
    this.woodenFort?.destroy();

    //Pulizia ranking 
    this.ranking?.clearRanking();

    this.time.clearPendingEvents(); // annulla tutti i timer
  }


  spawnAvatar(comando, channel) {
    console.log("Da spawnAvatar isEnemyWave: " + this.isEnemyWave);
    //Codice per la creazione dell'avatar
    if ((comando == "!playman" && !this.isEnemyWave) || (comando == "!playwoman" && !this.isEnemyWave)) {

      const maxAvatars = 1000;

      const containerWidth = 80;
      const containerHeight = 120;

      if (this.avatars.length >= maxAvatars) {
        console.log("Limite massimo di avatar raggiunto.");
        return;
      }

      //Se il nome dell'avatar esiste, non lo crea di nuovo
      if (this.avatars.some(a => a.channel === channel)) {
        console.log(`Avatar per ${channel} già esistente.`);
        return;
      }

      let spawnX, spawnY;
      let attempts = 0;
      let foundValidPosition = false;

      while (attempts < 100 && !foundValidPosition) {

        spawnX = Phaser.Math.Between(containerWidth / 2, this.game.config.width - containerWidth / 2);
        spawnY = Phaser.Math.Between(containerHeight / 2, this.game.config.height - containerHeight / 2);


        foundValidPosition = !this.isInsideFort(spawnX, spawnY) &&
          this.avatars.every(({ container }) => {
            if (!container || !container.active) return true; // Ignora avatar distrutti
            const dx = container.x - spawnX;
            const dy = container.y - spawnY;
            return Math.sqrt(dx * dx + dy * dy) >= this.minDistanceBetweenCharacters;
          });

        attempts++;
      }

      if (!foundValidPosition) {
        console.log("Non è stato possibile trovare una posizione libera.");
        return;
      }

      var newAvatar;
      if (this.data && this.data.winningAvatarChannel && channel == this.data.winningAvatarChannel) {//Se il nome del canale è quello dell'avatar che ha vinto la scorsa partita, istanzialo con tutti i progressi della precedente partita
        if (this.winningAvatarSeries.length == 0)//Se nessuno ha mai vinto prima, aggiungi il nome dell'avatar
          this.winningAvatarSeries.push(this.data.winningAvatarChannel);
        else if (this.winningAvatarSeries.some(a => a === channel))//Aumenta la serie di vittorie consecutive dell'avatar
          this.winningAvatarSeries.push(this.data.winningAvatarChannel);
        else {
          this.winningAvatarSeries = [];//Elimina tutta la serie di vittorie consecutive che riguarda l'avatar precedente
          this.winningAvatarSeries.push(this.data.winningAvatarChannel);//Aggiungi il nuovo avatar
        }


        console.log(this.data.winningAvatarChannel + " è il vincitore della scorsa partita e ritorna in gioco");
        newAvatar = new Avatar(this, this.gameWidth,
          this.gameHeight, spawnX, spawnY, this.data.winningAvatarChannel,
          this.data.winningAvatarWoman, this.data.winningAvatarWinner, this.data.winningAvatarLevel + this.winningAvatarSeries.length);
      }
      else {

        if (comando == "!playman") {
          newAvatar = new Avatar(this, this.gameWidth, this.gameHeight, spawnX, spawnY, channel, false, false, 1);
        }

        else {
          newAvatar = new Avatar(this, this.gameWidth, this.gameHeight, spawnX, spawnY, channel, true, false, 1);
        }
      }




      this.avatars.push(newAvatar);
    }
    else
      console.log(channel + " non può creare un avatar in quanto i nemici sono presenti in scena");

  }

  isInsideFort(x, y) {
    return (
      x >= this.woodenFort.x - 30 &&
      x <= this.woodenFort.x + this.woodenFort.displayWidth + 30 &&
      y >= this.woodenFort.y - 80 &&
      y <= this.woodenFort.y + this.woodenFort.displayHeight + 80
    );
  }


  isInsideFortArea(x, y) {
    return (
      x >= this.woodenFort.x &&
      x <= this.woodenFort.x + this.woodenFort.displayWidth &&
      y >= this.woodenFort.y &&
      y <= this.woodenFort.y + this.woodenFort.displayHeight
    );
  }

  isTouchingFortLeft(x, y) {
    return (
      x >= this.woodenFort.x - 10 &&
      x <= this.woodenFort.x + this.woodenFort.displayWidth / 2 &&
      y >= this.woodenFort.y &&
      y <= this.woodenFort.y + this.woodenFort.displayHeight
    );
  }

  isTouchingFortRight(x, y) {
    return (
      x >= this.woodenFort.x + this.woodenFort.displayWidth / 2 &&
      x <= this.woodenFort.x + this.woodenFort.displayWidth + 10 &&

      y >= this.woodenFort.y &&
      y <= this.woodenFort.y + this.woodenFort.displayHeight
    );
  }

  isTouchingFortAbove(x, y) {
    return (
      y >= this.woodenFort.y + 10 &&
      y <= this.woodenFort.y + this.woodenFort.displayHeight / 2 &&
      x >= this.woodenFort.x - 10 &&
      x <= this.woodenFort.x + this.woodenFort.displayWidth + 10
    );
  }

  isTouchingFortBelow(x, y) {
    return (
      y >= this.woodenFort.y + this.woodenFort.displayHeight / 2 &&
      y <= this.woodenFort.y + this.woodenFort.displayHeight &&
      x >= this.woodenFort.x - 10 &&
      x <= this.woodenFort.x + this.woodenFort.displayWidth + 10
    );
  }



  init(data) {
    console.log("Da GameScene init data:" + data.winningAvatarChannel);
    this.data = data;

    console.log(this.data.winningAvatarChannel + " ha vinto la scorsa partita");
  }


  preload() {
    //Oggetti di scena
    this.load.image("field", "/assets/field.png");
    this.load.image("man", "/assets/Man.png");

    this.load.image("woman", "/assets/Woman.png");

    this.load.image("woodenFort", "/assets/Wooden_fort.png");

    this.load.image('seed', 'assets/seed.png');

    this.load.image('juvenileStage', 'assets/Juvenile_stage.png');

    this.load.image('adultStage', 'assets/Adult_stage.png');


    //Sprites degli avatar
    this.load.spritesheet("manWalk", "/assets/Man_walk.png", {
      frameWidth: 48,
      frameHeight: 48
    });

    this.load.spritesheet("womanWalk", "/assets/Woman_walk.png", {
      frameWidth: 48,
      frameHeight: 48
    });

    this.load.spritesheet("manRun", "/assets/Man_run.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("womanRun", "/assets/Woman_run.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("manAttack", "/assets/Man_attack.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("womanAttack", "/assets/Woman_attack.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("manGathering", "/assets/Man_gathering.png", {
      frameWidth: 48,
      frameHeight: 48
    });

    this.load.spritesheet("womanGathering", "/assets/Woman_gathering.png", {
      frameWidth: 48,
      frameHeight: 48
    });

    //Sprites dei nemici
    this.load.spritesheet("enemyOneIdle", "/assets/EnemyOne_idle.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyTwoIdle", "/assets/EnemyTwo_idle.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyThreeIdle", "/assets/EnemyThree_idle.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyFourIdle", "/assets/EnemyFour_idle.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyOneDying", "/assets/EnemyOne_dying.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyTwoDying", "/assets/EnemyTwo_dying.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyThreeDying", "/assets/EnemyThree_dying.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyFourDying", "/assets/EnemyFour_dying.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyOneWalk", "/assets/EnemyOne_walk.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyTwoWalk", "/assets/EnemyTwo_walk.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyThreeWalk", "/assets/EnemyThree_walk.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyFourWalk", "/assets/EnemyFour_walk.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyOneAttack", "/assets/EnemyOne_attack.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyTwoAttack", "/assets/EnemyTwo_attack.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyThreeAttack", "/assets/EnemyThree_attack.png", {
      frameWidth: 80,
      frameHeight: 80
    });

    this.load.spritesheet("enemyFourAttack", "/assets/EnemyFour_attack.png", {
      frameWidth: 80,
      frameHeight: 80
    });


  }

  removeCharacter(arrayName, character) {//Rimuove degli elementi dagli array dei nemici o degli avatar
    if (arrayName === "enemies") {
      const index = this.enemies.indexOf(character);
      if (index > -1) {
        this.enemies.splice(index, 1);
      }
    }
    else {
      const index = this.avatars.indexOf(character);
      if (index > -1) {
        this.avatars.splice(index, 1);
      }
    }

  }

  getEnemyClassForWave() {//Permette di avere una difficoltà incrementale ad ogni ondata
    const enemyClasses = [EnemyOne, EnemyTwo, EnemyThree, EnemyFour];
    return enemyClasses[this.waveCount % enemyClasses.length];
  }

  treeGrowth() {
    console.log("Array degli alberi: " + this.trees);
    if (this.trees.length > 0) {
      console.log("C'è almeno un seme, la crescita può iniziare");
      this.trees.forEach(t => {
        if (t instanceof Seed) {
          t.setGrowthSpeed(this.treeGrowthParameters.juvenileGrowthSpeed);
          t.setJuvenileStageProbability(this.treeGrowthParameters.juvenileGrowthProbability);
          t.goToJuvenileStage();
        } else if (t instanceof JuvenileStage) {
          t.setGrowthSpeed(this.treeGrowthParameters.adultGrowthSpeed);
          t.setAdultStageProbability(this.treeGrowthParameters.adultGrowthProbability);
          t.goToAdultStage();
        }

      });
    }

  }

  changeTreeGrowthParameters(juvenileStageProbability, adultStageProbability) {
    this.treeGrowthParameters.juvenileGrowthProbability = juvenileStageProbability;
    this.treeGrowthParameters.adultGrowthProbability = adultStageProbability;

  }









  create() {
    this.ranking = new Ranking(this);
    this.ranking.clearRanking();
    const podiumBox = document.getElementById("podiumBox");
    const rankingBox = document.getElementById("rankingBox");
    rankingBox.style.visibility = "visible";
    podiumBox.style.visibility = "hidden";
    this.secondsElapsed = 0;
    this.enemyWaveMinTime = 240000;
    this.enemyWaveMaxTime = 360000;
    this.enemyLifeTime = 60000;

    this.avatars = [];
    this.enemies = [];
    this.isEnemyWave = false;
    this.trees = [];
    this.treeGrowthParameters = {
      juvenileGrowthSpeed: 30000,
      adultGrowthSpeed: 30000,
      juvenileGrowthProbability: 60,
      adultGrowthProbability: 100
    };

    this.gameWidth = 0;
    this.gameHeight = 0;
    this.woodenFort = null;
    this.enemiesForAvatar = 1;
    this.waveCount = 0;
    this.minDistanceBetweenCharacters = 40; // distanza minima tra personaggi
    this.maxSeeds = 1000;
    if (!this.winningAvatarSeries) {
      console.log("Da GameScene create winningAvatarSeries non era definito");
      this.winningAvatarSeries = [];//Lista che conta il numero di partite consecutive vinte da un giocatore
    }
    else
      console.log("Da GameScene create winningAvatarSeries era definito");

    const { width, height } = this.scale;
    this.gameWidth = width;
    this.gameHeight = height;

    //Creazione del campo di gioco
    const bg = this.add.image(0, 0, "field").setOrigin(0);
    const scaleX = width / bg.width;
    const scaleY = height / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);

    //Creazione del forte
    this.woodenFort = new WoodenFort(this, width / 3 + 100, height / 4);
    this.add.existing(this.woodenFort);

    //LOGICA DI TERMINAZIONE PARTITA
    //Attesa della distruzione del forte per avviare la scena di fine gioco
    this.woodenFort.on('fortDestroyed', (ranking) => {
      this.enemies.forEach(e => e.die());

      this.trees?.forEach(t => {
        if (t) {
          t.destroy();
          t.destroyObject();
        }

      });
      this.trees = [];


      //Delay per dare tempo alla scena di staccarsi e poi passare alla GameOverScene
      this.time.delayedCall(1000, () => {
        this.scene.start('gameover-scene', { ranking });
      });
    });
    //Attesa della morte di tutti gli avatar per avviare la scena di fine gioco
    this.events.on('allAvatarsDead', (ranking) => {
      console.log("Da GameScene Tutti gli avatar sono morti, il gioco riparte");
      if (this.rankingEvent) {
        console.log("Il ranking event viene rimosso");
        this.rankingEvent.remove();
        this.rankingEvent = null;
      }
      this.enemies.forEach(e => e.die());

      this.trees?.forEach(t => {
        if (t) {
          t.destroy();
          t.destroyObject();
        }

      });
      this.trees = [];
      this.avatars = [];

      this.time.delayedCall(1000, () => {
        this.scene.start('gameover-scene', { ranking });
      });
    });

    //FINE LOGICA DI TERMINAZIONE PARTITA





    this.treeGrowthTimer = this.time.addEvent({
      delay: 10000,
      loop: true,
      callback: () => {
        this.treeGrowth();
      }
    });

    var lessProbability = 0;

    //Stampa della classifica
    this.rankingEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.avatars.length > 0) {
          console.log("CLASSIFICA");
          if (this.avatars.length > 0) {
            this.ranking.updateRanking();
          }
          else {
            this.ranking.clearRanking();
            this.rankingEvent.remove();
            this.rankingEvent = null;
          }

        }

      }
    });

    this.checkEnemiesEvent = this.time.addEvent({
      delay: 10000,
      loop: true,
      callback: () => {
        if (this.enemies.length == 0) {
          console.log("I nemici sono tutti morti isEnemyWave: " + this.isEnemyWave);
          this.isEnemyWave = false;
        }
      }
    });


    //ROUTINE DI ONDATA DEI NEMICI
    this.waveTime = Phaser.Math.Between(this.enemyWaveMinTime, this.enemyWaveMaxTime);
    this.time.delayedCall(this.waveTime, () => {
      const spawnEnemies = () => {
        this.isEnemyWave = true;
        this.waveTime = Phaser.Math.Between(this.enemyWaveMinTime, this.enemyWaveMaxTime);
        console.log("Ondata: " + this.waveCount + " dopo " + this.waveTime + " minuti");
        //Rimuove alcuni alberi dalla scena
        if (this.trees) {
          for (let i = this.trees.length - 1; i >= 0; i--) {
            const t = this.trees[i];
            if (t && Phaser.Math.Between(1, 100) <= 50) {
              t.destroy();
              this.trees.splice(i, 1);
            }
            else {
              if (t)
                t.isGathered = false;
            }

          }
        }

        console.log("Dopo l'arrivo dei nemici trees: " + this.trees);
        //Ogni quattro ondate, la probabilità di crescita degli alberi diminuisce sempre più e il numero di nemici per avatar aumenta
        if (this.waveCount % 5 == 4) {
          this.enemiesForAvatar++;


          if (this.woodenFort.endurance >= Phaser.Math.Between(100, 200) && this.woodenFort.endurance < Phaser.Math.Between(300, 400)) {//Bonus se si è stati in grado di mantenere il forte intatto o carico di legna
            this.enemiesForAvatar--;
            console.log("Ci sono " + this.enemiesForAvatar + " nemici per avatar, meno nemici di quelli previsti nell'ondata");
            if (this.enemiesForAvatar == 0)
              this.avatars.forEach(avatar => avatar.enterFort());
          }
          else {//Altrimenti il numero di nemici per avatar aumenta e diminuisce la probabilità di crescita degli alberi adulti
            lessProbability += 20;
            console.log("Ci sono " + this.enemiesForAvatar + " nemici per avatar");
          }

          if (this.treeGrowthParameters.juvenileGrowthProbability == 0) {
            console.log("La probabilità di crescita degli alberi allo stato giovanile e adulto è tornata quella di default")
            this.treeGrowthParameters.juvenileGrowthProbability = 60;
            this.treeGrowthParameters.adultGrowthProbability = 100;
          }
          else {
            console.log("juvenileGrowthProbability: " + this.juvenileGrowthProbability + " adultGrowthProbability: " + this.adultGrowthProbability);
            this.treeGrowthParameters.juvenileGrowthProbability -= lessProbability;
            //Si impedisce alle probabilità di crescita degli alberi di azzerarsi, facendole ripartire eventualmente dal valore iniziale
            if (this.treeGrowthParameters.juvenileGrowthProbability <= 0)
              this.treeGrowthParameters.juvenileGrowthProbability = 60;
            this.treeGrowthParameters.adultGrowthProbability -= lessProbability;
            if (this.treeGrowthParameters.adultGrowthProbability <= 0)
              this.treeGrowthParameters.adultGrowthProbability = 100;
          }

          this.changeTreeGrowthParameters(this.treeGrowthParameters.juvenileGrowthProbability, this.treeGrowthParameters.adultGrowthProbability);
          console.log("JuvenileStage probability: " + this.treeGrowthParameters.juvenileGrowthProbability +
            "AdultStage probability: " + this.treeGrowthParameters.adultGrowthProbability
          );
        }
        // Rimuove nemici precedenti
        this.enemies.forEach(enemy => enemy.remove());
        this.enemies = [];

        // Crea un nemico per ogni avatar
        let y = 0;
        let x = 0;
        let targetYLeft;
        let targetYRight;
        this.avatars.forEach((_, index) => {//Tutto si basa sulla presenza di avatar in gioco
          console.log("Il numero di nemici è relativo ai " + this.avatars.length + " avatar in gioco");
          let i;


          console.log("Da create isEnemyWave: " + this.isEnemyWave);
          targetYLeft = this.woodenFort.y + 50;
          targetYRight = this.woodenFort.y + 50;
          for (i = 0; i < this.enemiesForAvatar; i++) {
            var arriveToWoodenFort = true; //Il booleano dice se i nemici andanno verso la parte destra o sinistra del forte
            var flipX;
            if (i % 17 < 15) {//Esegue correttamente lo spawn dei nemici dentro la canvas, a prescindere dal loro numero
              if (Phaser.Math.Between(1, 100) <= 50) {

                console.log("I nemici arrivano da sinistra");
                flipX = false;
                x = Phaser.Math.Between(1, 20) - this.minDistanceBetweenCharacters;
                y += this.minDistanceBetweenCharacters;
                console.log("Meno di 15" + " x: " + x + " y: " + y + " i: " + i);
              }
              else {
                console.log("I nemici arrivano da destra");
                flipX = true;
                arriveToWoodenFort = false;
                x = this.gameWidth - Phaser.Math.Between(1, 20) - this.minDistanceBetweenCharacters;
                y += this.minDistanceBetweenCharacters;
                console.log("Meno di 15" + " x: " + x + " y: " + y + " i: " + i);

              }
            }
            else {
              //x = Phaser.Math.Between(1, 20); 
              y = this.minDistanceBetweenCharacters;// Torna alla coordinata y più in alto nella canvas
              console.log("Più di 15 " + " x: " + x + " y: " + y + " i: " + i);

            }
            let targetX;

            console.log(x, y);
            const EnemyClass = this.getEnemyClassForWave();
            console.log(EnemyClass);
            const enemy = new EnemyClass(this, this.gameWidth, this.gameHeight, x, y, flipX);
            if (this.waveCount % 5 == 4)
              enemy.setDamage(this.waveCount);

            if (arriveToWoodenFort) {//Vanno a sinistra del forte
              targetX = this.woodenFort.x - 10;
              targetYLeft += 30;

              if (targetYLeft > this.woodenFort.y + this.woodenFort.displayHeight) {
                targetYLeft = this.woodenFort.y + 50;
              }

              console.log("Cammina verso il punto x:" + targetX + " y:" + targetYLeft);
              enemy.goTo(targetX, targetYLeft);

            }
            else {//vanno a destra del forte
              targetX = this.woodenFort.x + this.woodenFort.displayWidth + 10;
              targetYRight += 30;


              if (targetYRight > this.woodenFort.y + this.woodenFort.displayHeight) {
                targetYRight = this.woodenFort.y + 50;
              }

              console.log("Cammina verso il punto x:" + targetX + " y:" + targetYRight);
              enemy.goTo(targetX, targetYRight);
            }

            this.enemies.push(enemy);

          }

          this.avatars.forEach(av => {

            if (av.seedTimer) {
              console.log(av.channel + " vede l'arrivo dei nemici");
              av.stopSeeding();
            }
            if (av.gatherLoop) {
              console.log(av.channel + " vede l'arrivo dei nemici");
              av.stopGathering();
            }


            av.enterFort(this.woodenFort);

          });//Appena comincia l'ondata, tutti gli avatar entrano nel forte

        });




        // I nemici muoiono tutti dopo 1 minuto
        this.time.delayedCall(this.enemyLifeTime, () => {
          this.avatars.forEach(avatar => avatar.stopAttack());
          this.enemies.forEach(enemy => enemy.die());

        });

        this.waveCount++;
      };

      spawnEnemies();



      this.time.addEvent({
        delay: this.waveTime,
        loop: true,
        callback: spawnEnemies
      });
    }, [], this);

    //FINE ROUTINE DI ONDATA DEI NEMICI


    // Animazioni degli avatar

    // Camminata
    if (!this.anims.exists('man-walk')) {
      this.anims.create({
        key: 'man-walk',
        frames: this.anims.generateFrameNumbers('manWalk', { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1
      });
    }

    if (!this.anims.exists('woman-walk')) {
      this.anims.create({
        key: 'woman-walk',
        frames: this.anims.generateFrameNumbers('womanWalk', { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1
      });
    }

    // Attacco con armatura
    if (!this.anims.exists('man-run')) {
      this.anims.create({
        key: 'man-run',
        frames: this.anims.generateFrameNumbers('manRun', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: -1
      });
    }

    if (!this.anims.exists('woman-run')) {
      this.anims.create({
        key: 'woman-run',
        frames: this.anims.generateFrameNumbers('womanRun', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: -1
      });
    }

    if (!this.anims.exists('man-attack')) {
      this.anims.create({
        key: 'man-attack',
        frames: this.anims.generateFrameNumbers('manAttack', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: 0
      });
    }

    if (!this.anims.exists('woman-attack')) {
      this.anims.create({
        key: 'woman-attack',
        frames: this.anims.generateFrameNumbers('womanAttack', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: 0
      });
    }

    // Semina
    if (!this.anims.exists('man-seeding')) {
      this.anims.create({
        key: 'man-seeding',
        frames: this.anims.generateFrameNumbers('manWalk', { start: 0, end: 5 }),
        frameRate: 3,
        repeat: -1
      });
    }

    if (!this.anims.exists('woman-seeding')) {
      this.anims.create({
        key: 'woman-seeding',
        frames: this.anims.generateFrameNumbers('womanWalk', { start: 0, end: 5 }),
        frameRate: 3,
        repeat: -1
      });
    }

    // Raccolta
    if (!this.anims.exists('man-gathering')) {
      this.anims.create({
        key: 'man-gathering',
        frames: this.anims.generateFrameNumbers('manGathering', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: 0
      });
    }

    if (!this.anims.exists('woman-gathering')) {
      this.anims.create({
        key: 'woman-gathering',
        frames: this.anims.generateFrameNumbers('womanGathering', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: 0
      });
    }

    // Animazioni dei nemici
    const enemies = ['One', 'Two', 'Three', 'Four'];

    enemies.forEach(n => {
      if (!this.anims.exists(`enemy${n}-idle`)) {
        this.anims.create({
          key: `enemy${n}-idle`,
          frames: this.anims.generateFrameNumbers(`enemy${n}Idle`, { start: 0, end: 5 }),
          frameRate: 12,
          repeat: -1
        });
      }

      if (!this.anims.exists(`enemy${n}-dying`)) {
        this.anims.create({
          key: `enemy${n}-dying`,
          frames: this.anims.generateFrameNumbers(`enemy${n}Dying`, { start: 0, end: 5 }),
          frameRate: 10,
          hideOnComplete: true
        });
      }

      if (!this.anims.exists(`enemy${n}-walk`)) {
        this.anims.create({
          key: `enemy${n}-walk`,
          frames: this.anims.generateFrameNumbers(`enemy${n}Walk`, { start: 0, end: 5 }),
          frameRate: 10,
          repeat: -1,
          hideOnComplete: true
        });
      }

      if (!this.anims.exists(`enemy${n}-attack`)) {
        this.anims.create({
          key: `enemy${n}-attack`,
          frames: this.anims.generateFrameNumbers(`enemy${n}Attack`, { start: 0, end: 5 }),
          frameRate: 10
        });
      }
    });



    socket.on('comando', (data) => {
      const channel = data.channel;
      const comando = data.comando;
      console.log("Ricevuto" + channel);
      console.log("Ricevuto " + comando);

      this.spawnAvatar(comando, channel);//Creazione dell'avatar

      //Seleziona l'avatar che deve compiere le azioni
      const avatar = this.avatars.find(a => a.channel === channel);
      if (!avatar) return;

      //Compi le azioni
      if (comando === "!enterfort") {

        avatar.enterFort();
      }

      if (comando === "!attack" && !avatar.isNotInsideFortYet) {
        avatar.attack();
      }
      //Può seminare o raccogliere solo se non sta attaccando e se i nemici non sono presenti in scena
      if (comando === "!seeding" && !this.isEnemyWave && !avatar.isNotInsideFortYet) {
        avatar.seedingLoop();


      }

      if (comando === "!gathering" && !this.isEnemyWave && !avatar.isNotInsideFortYet && !avatar.isInsideWalkToWoodenFortSeeding) {
        if (this.trees.length > 0) {
          console.log("Ci sono alberi per acquisirne la legna");
          avatar.gathering();
        }
        else
          console.log("Non ci sono alberi disponibili per acquisirne la legna");

      }

      if (comando === "!betforlevel" && !this.isEnemyWave && !avatar.avatarLevel.maxLevelReached) {
        avatar.avatarLevel.bet("attack");
      }

      if (comando === "!betforlife" && !this.isEnemyWave && !avatar.avatarLevel.maxLevelReached) {
        avatar.avatarLevel.bet("defence");
      }

      if (comando === "!betagainstavatar" && !this.isEnemyWave) {
        avatar.avatarLevel.betAgainstAvatar();
      }

    });

    socket.on('tempoTrascorso', ({ channel, secondsElapsed }) => {
      if (this.avatars && this.avatars.length > 0) {
        const avatar = this.avatars.find(a => a.channel === channel);
        if (!avatar)
          return;

        avatar.secondsElapsed = secondsElapsed;

      }


    });

    socket.on('utenteDisconnesso', ({ channel }) => {
      if (this.avatars && this.avatars.length > 0) {
        const avatar = this.avatars.find(a => a.channel === channel);
        if (!avatar)
          return;

        avatar.die();

      }
    });







  }

  update() {
    //Disegna nell'ordine corretto gli oggetti di scena
    this.children.list.forEach(child => {
      if (child !== undefined && child.y !== undefined && child.setDepth && child.depth < 90000) {
        const depthY = child.depthY !== undefined ? child.depthY : child.y;
        child.setDepth(depthY);
      }
    });

    this.avatars.forEach(avatar => {
      avatar.updateDepth();
      avatar.updateUIPosition();
    });

  }



}

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'gameover-scene' });
  }

  init(data) {
    this.ranking = data.ranking;
  }

  create() {

    const screenWidth = this.sys.game.config.width;
    const screenHeight = this.sys.game.config.height;


    const backgroundKey = 'full-gradient-bg';
    if (!this.textures.exists(backgroundKey)) {
      const bgTex = this.textures.createCanvas(backgroundKey, screenWidth, screenHeight);
      const bgCtx = bgTex.getContext();

      const bgGradient = bgCtx.createRadialGradient(
        screenWidth / 2, screenHeight / 2, 0,
        screenWidth / 2, screenHeight / 2, Math.max(screenWidth, screenHeight) / 2
      );

      bgGradient.addColorStop(0, '#012b0d');
      bgGradient.addColorStop(0.26, '#000000');
      bgGradient.addColorStop(1, '#9c5d00');

      bgCtx.fillStyle = bgGradient;
      bgCtx.fillRect(0, 0, screenWidth, screenHeight);

      bgTex.refresh();


    }



    const fullBg = this.add.image(screenWidth / 2, screenHeight / 2, backgroundKey);
    fullBg.setOrigin(0.5);

    this.text = this.add.text(400, 300, 'Fine partita!\nAspetta 1 minuto', {
      fontSize: '32px'
    }).setOrigin(0.5);

    this.countdownText = this.add.text(400, 360, '60', {
      fontSize: '48px',
    }).setOrigin(0.5);



    let countdown = 60;

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: 59,
      callback: () => {
        countdown--;
        this.countdownText.setText(countdown.toString());
      }
    });

    console.log("Da GameOverScene create il vincitore è: " + this.ranking.getWinner());
    if (this.ranking.getWinner()) {
      this.ranking.showAvatarsPodium();
      this.winningAvatar = this.ranking.getWinner();
      console.log("Da GameOverScene " + this.winningAvatar.channel);
      this.winningAvatar.setWinner();

      this.time.delayedCall(3000, () => {

        this.scene.remove('scene-game');

      });

      this.time.delayedCall(60000, () => {
        this.cleanup();
        this.scene.stop('gameover-scene');

        this.scene.add('scene-game', GameScene, true, {
          winningAvatarChannel: this.winningAvatar.channel,
          winningAvatarWoman: this.winningAvatar.woman,
          winningAvatarWinner: this.winningAvatar.winner,
          winningAvatarLevel: this.winningAvatar.avatarLevel.level

        });

      });
    }
    else {

      this.time.delayedCall(3000, () => {

        this.scene.stop('scene-game');
        this.scene.remove('scene-game');

      });

      this.time.delayedCall(60000, () => {
        this.cleanup();
        this.scene.stop('gameover-scene');

        this.scene.add('scene-game', GameScene, true, {
          winningAvatarChannel: null

        });

      });


    }

    this.cleanup = () => {
      console.log("Clean Up di GameOverScene")
      this.children.list.forEach(child => child.destroy());
    };





  }
}



const sizes = {
  width: 1149,
  height: 500
}

const config = {
  type: Phaser.WEBGL,
  width: sizes.width,
  height: sizes.height,
  scene: [GameScene, GameOverScene],
  canvas: document.getElementById("gameCanvas")
}

new Phaser.Game(config);








