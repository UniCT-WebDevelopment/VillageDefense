import { Seed, AdultStage } from "./TreeGrowthStage.js";
import { AvatarLevel } from "./AvatarLevel.js";

export class Avatar {
    constructor(scene, gameWidth, gameHeight, x, y, channel, woman, winner, level) {
        this.scene = scene;
        this.anims = scene.anims;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.x = x;
        this.y = y;
        this.channel = channel;
        this.woman = woman;
        this.winner = winner;
        this.lifeBarWidth = 58;
        this.lifeBarHeight = 5;
        this.levelBarHeight = 4;
        this.speed = {
            walk: 100,
            run: 150
        };
        this.woodenFortAccessPointOneX = this.scene.woodenFort.x - 10;
        this.woodenFortExitPointOneY = this.scene.woodenFort.y + this.scene.woodenFort.displayHeight - 70;
        this.woodenFortAccessPointTwoX = this.scene.woodenFort.x + (this.scene.woodenFort.displayWidth / 2);
        this.woodenFortExitPointTwoY = this.scene.woodenFort.y + this.scene.woodenFort.displayHeight + 100;
        this.woodenFortAccessPointThreeX = this.scene.woodenFort.x + (this.scene.woodenFort.displayWidth / 2) + 10;
        this.woodenFortAccessPointFourX = this.scene.woodenFort.x + this.scene.woodenFort.displayWidth + 10;
        this.woodenFortAccessPointGatheringX = this.gameWidth - 300;
        this.woodenFortAccessPointY = this.scene.woodenFort.y + this.scene.woodenFort.displayHeight;

        this.woodenFortAccessPointAboveLeftX = this.scene.woodenFort.x - 10;
        this.woodenFortAccessPointAboveRightX = this.scene.woodenFort.x + this.scene.woodenFort.displayWidth + 10;
        this.woodenFortAccessPointAboveY = this.scene.woodenFort.y - 10;





        this.defence = null;
        this.life = 100;
        this.isSeeding = false;
        this.isGathering = false;
        this.isAttacking = false;
        this.isEnteringFort = false;
        this.hasEnteredFort = false;
        this.isNotInsideFortYet = false;
        this.isDead = false;
        this.level = level;
        this.currentTree = null;

        this.seedingRestarted = false;
        this.isGoingAway = false;
        this.isInsideWalkToWoodenFortSeeding = false;



        this.pathVariability = Phaser.Math.Between(40, 100);



        let avatar;
        if (woman) {
            this.avatar = scene.add.sprite(0, 0, "womanWalk").setOrigin(0.5, 1);

        } else {
            this.avatar = scene.add.sprite(0, 0, "manWalk").setOrigin(0.5, 1);

        }

        // Dimensioni barre



        // Offsets verticali calcolati "a pila"
        const spriteHeight = 40; //valore del frame in modo che si escluda qualsiasi suo margine
        const lifeBarY = -spriteHeight;
        this.levelBarY = lifeBarY - this.lifeBarHeight;
        const labelY = this.levelBarY - this.levelBarHeight;


        // Etichetta nome
        const channelLabel = scene.add.text(0, labelY, `${channel}`, {
            fontSize: "9px",
            fill: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: { x: 2, y: 1 }
        }).setOrigin(0.5, 1);

        // Barre
        const lifeBarBg = scene.add.graphics().fillStyle(0x444444).fillRect(-this.lifeBarWidth / 2, lifeBarY, this.lifeBarWidth, this.lifeBarHeight);
        this.lifeBar = scene.add.graphics().fillStyle(0x00ff00).fillRect(-this.lifeBarWidth / 2, lifeBarY, this.lifeBarWidth, this.lifeBarHeight);


        const levelBarBg = scene.add.graphics().fillStyle(0x444444).fillRect(-this.lifeBarWidth / 2, this.levelBarY, this.lifeBarWidth, this.levelBarHeight);
        this.levelBar = scene.add.graphics().fillStyle(0x3399ff).fillRect(-this.lifeBarWidth / 2, this.levelBarY, 0, this.levelBarHeight);


        //Etichetta livello
        this.levelLabel = scene.add.text(0, this.levelBarY + this.levelBarHeight / 2, this.level.toString(), {
            fontSize: "8px",
            fill: "#ffffff",
            fontStyle: "bold"
        }).setOrigin(0.5, 0.5);


        // Container finale
        this.spriteContainer = scene.add.container(0, 0, [this.avatar]);
        this.uiContainer = this.scene.add.container(0, 0, [
            channelLabel,
            lifeBarBg,
            this.lifeBar,
            levelBarBg,
            this.levelBar,
            this.levelLabel
        ]);


        this.container = this.scene.add.container(this.x, this.y, [
            this.spriteContainer
        ]);

        this.scene.add.existing(this.container);
        this.uiContainer.setDepth(99999);
        this.container.depthY = this.container.y + this.avatar.y;
        this.scene.add.existing(this.uiContainer);
        this.uiContainer.x = this.x;
        this.uiContainer.y = this.y;

        this.avatarLevel = new AvatarLevel(this.scene, this); //Aggiunge il gestore del livello
        console.log("UIContainer depth:", this.uiContainer.depth);

    }

    pathVariabilityChanger() {
        if (Phaser.Math.Between(1, 100) <= 50) {
            this.pathVariability = -this.pathVariability;
        }
    }

    updateUIPosition() {
        this.uiContainer.x = this.container.x;
        this.uiContainer.y = this.container.y;
    }
    updateDepth() {
        this.container.depthY = this.container.y + this.avatar.y;
    }

    setWinner() {
        this.winner = true;
    }

    async enterFort() {
        if (this.isNotInsideFortYet) return;

        if (this.isEnteringFort) return;

        this.isGoingInsideFort = true;

        if (this.walkToWoodenFortAccessPointTween) {
            this.walkToWoodenFortAccessPointTween.remove();
            this.walkToWoodenFortAccessPointTween = null;
        }

        if (this.isSeeding) {
            await this.stopSeeding();
        }

        if (this.isGathering) {
            await this.stopGathering();
        }

        if (this.seedingTween) {

            this.seedingTween.remove();
            this.seedingTween = null;
        }

        if (this.walkToClosestTreeTween) {
            this.walkToClosestTreeTween.remove();
            this.walkToClosestTreeTween = null;
        }

        if (this.isAttacking) {
            this.stopAttack();
        }







        this.isEnteringFort = true;
        this.isAttacking = false;
        console.log("Da enterfort " + this.channel + " isAttacking: " + this.isAttacking);
        this.isSeeding = false;
        this.isGathering = false;
        this.margin = 70;


        if (!this.hasEnteredFort) {
            const targetX = Phaser.Math.Between(this.scene.woodenFort.x + this.margin, this.scene.woodenFort.x + this.scene.woodenFort.displayWidth - this.margin);
            const targetY = Phaser.Math.Between(this.scene.woodenFort.y + this.margin, this.scene.woodenFort.y + this.scene.woodenFort.displayHeight - this.margin);
            if (this.container.x <= this.woodenFortAccessPointOneX) {
                if (this.container.y <= this.scene.woodenFort.y) {
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX, this.woodenFortAccessPointAboveY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX, this.woodenFortAccessPointY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortAccessPointY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortExitPointOneY, this.speed.run);

                    console.log(this.channel + "si fermerà al punto x: " + targetX + " y: " + targetY + " dentro il forte");
                    await this.walkToWoodenFort(targetX, targetY, this.speed.run);
                    return;
                }
                await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX, this.woodenFortAccessPointY, this.speed.run);
                await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortAccessPointY, this.speed.run);
                await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortExitPointOneY, this.speed.run);


                console.log(this.channel + "si fermerà al punto x: " + targetX + " y: " + targetY + " dentro il forte");
                await this.walkToWoodenFort(targetX, targetY, this.speed.run);
                return;
            }

            if (this.container.x > this.woodenFortAccessPointOneX && this.container.x <= this.woodenFortAccessPointTwoX) {
                if (this.container.y <= this.scene.woodenFort.y) {
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX, this.woodenFortAccessPointAboveY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX, this.woodenFortAccessPointY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortAccessPointY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortExitPointOneY, this.speed.run);

                    console.log(this.channel + "si fermerà al punto x: " + targetX + " y: " + targetY + " dentro il forte");
                    await this.walkToWoodenFort(targetX, targetY, this.speed.run);
                    return;
                }

                await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortAccessPointY, this.speed.run);
                await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortExitPointOneY, this.speed.run);

                console.log(this.channel + "si fermerà al punto x: " + targetX + " y: " + targetY + " dentro il forte");
                await this.walkToWoodenFort(targetX, targetY, this.speed.run);
                return;
            }

            if (this.container.x > this.woodenFortAccessPointTwoX && this.container.x <= this.woodenFortAccessPointThreeX) {
                if (this.container.y <= this.scene.woodenFort.y) {
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX, this.woodenFortAccessPointAboveY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX, this.woodenFortAccessPointY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortAccessPointY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortExitPointOneY, this.speed.run);

                    console.log(this.channel + "si fermerà al punto x: " + targetX + " y: " + targetY + " dentro il forte");
                    await this.walkToWoodenFort(targetX, targetY, this.speed.run);
                    return;
                }

                await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortAccessPointY, this.speed.run);
                await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortExitPointOneY, this.speed.run);

                console.log(this.channel + "si fermerà al punto x: " + targetX + " y: " + targetY + " dentro il forte");
                await this.walkToWoodenFort(targetX, targetY, this.speed.run);
                return;
            }

            if (this.container.x > this.woodenFortAccessPointThreeX && this.container.x <= this.woodenFortAccessPointFourX) {
                if (this.container.y <= this.scene.woodenFort.y) {
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveRightX, this.woodenFortAccessPointAboveY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointFourX, this.woodenFortAccessPointY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointThreeX, this.woodenFortAccessPointY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortAccessPointY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortExitPointOneY, this.speed.run);

                    await this.walkToWoodenFort(targetX, targetY, this.speed.run);
                    return;
                }

                await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointThreeX, this.woodenFortAccessPointY, this.speed.run);
                await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortAccessPointY, this.speed.run);
                await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortExitPointOneY, this.speed.run);

                console.log(this.channel + "si fermerà al punto x: " + targetX + " y: " + targetY + " dentro il forte");
                await this.walkToWoodenFort(targetX, targetY, this.speed.run);
                return;
            }

            if (this.container.x > this.woodenFortAccessPointFourX) {
                if (this.container.y <= this.scene.woodenFort.y) {
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveRightX, this.woodenFortAccessPointAboveY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointFourX, this.woodenFortAccessPointY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointThreeX, this.woodenFortAccessPointY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortAccessPointY, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortExitPointOneY, this.speed.run);

                    console.log(this.channel + "si fermerà al punto x: " + targetX + " y: " + targetY + " dentro il forte");
                    await this.walkToWoodenFort(targetX, targetY, this.speed.run);
                    return;
                }
                await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointFourX, this.woodenFortAccessPointY, this.speed.run);
                await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointThreeX, this.woodenFortAccessPointY, this.speed.run);
                await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortAccessPointY, this.speed.run);
                await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortExitPointOneY, this.speed.run);

                console.log(this.channel + "si fermerà al punto x: " + targetX + " y: " + targetY + " dentro il forte");
                await this.walkToWoodenFort(targetX, targetY, this.speed.run);
                return;
            }
        }

    }


    async exitFort() {
        this.hasEnteredFort = false;
        this.isNotInsideFortYet = true;

        console.log(this.channel + " va verso il punto di uscita dal forte");

        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortExitPointOneY, this.speed.run);
        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointTwoX, this.woodenFortExitPointTwoY, this.speed.run);





        console.log(this.channel + " ha completato l'uscita dal forte");
    }


    walkToWoodenFortAccessPointAsync(targetX, targetY, speed) {
        return new Promise((resolve) => {
            const dx = targetX - this.container.x;
            const dy = targetY - this.container.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const duration = (distance / speed) * 1000;

            this.avatar.setFlipX(dx < 0);
            this.avatar.x = dx < 0 ? -2 : 0;

            const limitWidth = 35;
            const limitHeight = 60;
            targetX = Phaser.Math.Clamp(targetX, limitWidth, this.gameWidth - limitWidth);
            targetY = Phaser.Math.Clamp(targetY, limitHeight, this.gameHeight - limitHeight);


            const walkAnim = this.woman ? 'woman-walk' : 'man-walk';

            this.avatar.anims?.play(walkAnim, true);

            this.walkToWoodenFortAccessPointTween = this.scene.tweens.add({
                targets: this.container,
                x: targetX,
                y: targetY,
                duration: duration,
                ease: 'Linear',
                onComplete: () => {
                    this.isNotInsideFortYet = false;
                    this.avatar.stop();
                    this.avatar.setFrame(0);
                    resolve();
                }
            });
        });
    }



    walkToWoodenFortAccessPointSeedingAsync(targetX, targetY, speed, animKey, direction, up) {
        console.log("Entra in walkToWoodenFortAccessPointSeedingAsync");

        if (this.isEnteringFort || this.isGathering) {
            this.isInsideWalkToWoodenFortSeeding = false;
            this.isGoingAway = false;
            console.log("Esce subito da walkToWoodenFortAccesPoinSeedingAsync isInsideWalkToWoodenFortSeeding: " + this.isInsideWalkToWoodenFortSeeding);
            return;
        }

        this.isGoingAway = true;
        this.isInsideWalkToWoodenFortSeeding = true;

        return new Promise((resolve) => {
            if (this.isEnteringFort || this.isGathering) {
                this.isInsideWalkToWoodenFortSeeding = false;
                this.isGoingAway = false;
                console.log("Esce all'inizio della promise da walkToWoodenFortAccesPoinSeedingAsync isInsideWalkToWoodenFortSeeding: " + this.isInsideWalkToWoodenFortSeeding);
                resolve();
                return;
            }


            if (this.seedTimer) {
                this.seedTimer.remove();
                this.seedTimer = null;
            }

            const dx = targetX - this.container.x;
            const dy = targetY - this.container.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const duration = (distance / speed) * 1000;

            this.avatar.setFlipX(dx < 0);
            this.avatar.x = dx < 0 ? -2 : 0;

            const limitWidth = 35;
            const limitHeight = 60;
            targetX = Phaser.Math.Clamp(targetX, limitWidth, this.gameWidth - limitWidth);
            targetY = Phaser.Math.Clamp(targetY, limitHeight, this.gameHeight - limitHeight);

            const walkAnim = this.woman ? 'woman-walk' : 'man-walk';
            this.avatar.anims?.play(walkAnim, true);

            if (this.walkToWoodenFortAccessPointSeedingTween) {

                console.log("walkToWoodenFortAccessPointSeedingTween era attivo ed è stato rimosso isInsideWalkToWoodenFortSeeding: " + this.isInsideWalkToWoodenFortSeeding);
                this.walkToWoodenFortAccessPointSeedingTween.remove();
                this.walkToWoodenFortAccessPointSeedingTween = null;
            }

            this.walkToWoodenFortAccessPointSeedingTween = this.scene.tweens.add({
                targets: this.container,
                x: targetX,
                y: targetY,
                duration: duration,
                ease: 'Linear',
                onUpdate: () => {
                    if (this.walkToWoodenFortAccessPointSeedingTween && (this.isEnteringFort || this.isGathering)) {
                        this.isGoingAway = false;
                        this.isInsideWalkToWoodenFortSeeding = false;
                        console.log("walkToWoodenFortAccessPointSeedingTween viene interrotto isInsideWalkToWoodenFortSeeding: " + this.isInsideWalkToWoodenFortSeeding);
                        this.walkToWoodenFortAccessPointSeedingTween.remove();
                        this.walkToWoodenFortAccessPointSeedingTween = null;
                        resolve();
                    }

                },
                onComplete: () => {

                    this.isGoingAway = false;

                    const offset = Phaser.Math.Between(90, 100) * (up ? -1 : 1);
                    this.isInsideWalkToWoodenFortSeeding = false;
                    console.log("walkToWoodenFortAccessPointSeedingTween viene portato a termine isInsideWalkToWoodenFortSeeding: " + this.isInsideWalkToWoodenFortSeeding);
                    this.restartSeeding(animKey, direction, offset);

                    resolve();
                }
            });
        });
    }




    async walkToWoodenFort(targetX, targetY, speed) {
        console.log(this.channel + " entra nel forte" + " isSeeding: " + this.isSeeding + " isGathering: " + this.isGathering + " isAttacking: " + this.isAttacking);

        return new Promise((resolve) => {
            const dx = targetX - this.container.x;
            const dy = targetY - this.container.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const duration = (distance / speed) * 1000;

            //Flip sprite se si muove verso sinistra
            this.avatar.setFlipX(dx < 0);

            //Allinea correttamente l'avatar se si muove verso sinistra
            const offsetX = dx < 0 ? -2 : 0;
            this.avatar.x = offsetX;

            //Limita targetX e targetY nei confini della canvas
            const limitWidth = 35;
            const limitHeight = 60;

            targetX = Phaser.Math.Clamp(targetX, limitWidth, this.gameWidth - limitWidth);
            targetY = Phaser.Math.Clamp(targetY, limitHeight, this.gameHeight - limitHeight);
            console.log(this.channel + "si ferma al punto x: " + targetX + " y: " + targetY + " dentro il forte");
            const walkAnim = this.woman ? 'woman-walk' : 'man-walk';
            this.avatar.anims?.play(walkAnim, true);

            this.walkToWoodenFortTween = this.scene.tweens.add({
                targets: this.container,
                x: targetX,
                y: targetY,
                duration: duration,
                ease: 'Linear',
                onUpdate: () => {
                    if (this.scene.isInsideFortArea(this.container.x, this.container.y) && !this.hasEnteredFort) {//Si considera entrato nel forte anche quando ancora non si è fermato al suo interno
                        this.isNotInsideFortYet = true;
                        console.log("Da walkToWoodenFort Update " + this.channel + " isNotInsideFortYet: " + this.isNotInsideFortYet);

                    }

                },
                onComplete: () => {
                    this.avatar.stop();
                    this.avatar.setFrame(0);
                    this.isNotInsideFortYet = false;
                    this.isEnteringFort = false;
                    this.hasEnteredFort = true;
                    this.acquireLife();
                    resolve();
                }
            });
        });
    }

    acquireLife() {
        if (this.life == 100 || this.acquireLifeEvent) return;
        this.acquireLifeEvent = this.scene.time.addEvent({
            delay: 4000,
            loop: true,
            callback: () => {
                if (this.life == 100 || this.isAttacking || this.isSeeding || this.isGathering) {
                    console.log(this.channel + " ha raggiunto piena vita o sta attaccando o seminando o raccogliendo");
                    if (this.acquireLifeEvent) {
                        this.acquireLifeEvent.remove();
                        this.acquireLifeEvent = null;
                    }
                    return;
                }
                else {
                    this.life++;
                    const percentage = Phaser.Math.Clamp(this.life / 100, 0, 1);
                    this.setLife(percentage);
                }
            }
        });
    }


    async attack() {
        const scene = this.scene;
        console.log(this.channel + " attacca ");
        if (this.isAttacking) return; //Evita di chiamarlo due volte

        if (scene.enemies.length == 0) return;

        if (this.walkToWoodenFortAccessPointTween) {
            this.walkToWoodenFortAccessPointTween.remove();
            this.walkToWoodenFortAccessPointTween = null;
        }

        if (this.walkToWoodenFortTween) {
            this.walkToWoodenFortTween.remove();
            this.walkToWoodenFortTween = null;
        }
        if (this.isSeeding) {
            await this.stopSeeding();
        }

        if (this.isGathering) {
            await this.stopGathering();
        }

        if (this.seedingTween) {
            this.seedingTween.remove();
            this.seedingTween = null;
        }

        if (this.walkToClosestTreeTween) {
            this.walkToClosestTreeTween.remove();
            this.walkToClosestTreeTween = null;
        }

        this.isAttacking = true;
        this.isSeeding = false;
        this.isGathering = false;
        this.isEnteringFort = false;
        if (this.hasEnteredFort) {
            await this.exitFort();
        }
        var closestEnemy = this.seekEnemy();
        if (!closestEnemy) return;
        if (closestEnemy.x < this.scene.gameWidth / 2) {
            await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX - 40, this.woodenFortAccessPointY, this.speed.run);
        } else {
            await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointFourX + 40, this.woodenFortAccessPointY, this.speed.run);

        }

        // Imposta la texture corretta per l'attacco
        console.log(this.channel + " cambia la sprite prima di attaccare");
        const attackSpriteKey = this.woman ? 'womanAttack' : 'manAttack';
        if (scene) {
            this.avatar?.setTexture(attackSpriteKey);
            await this.attackLoop();
        }



    }



    seekEnemy() {


        if (this.lockedEnemy && !this.lockedEnemy.isDead) { //Se sto già attaccando un nemico e non è morto, continuo a colpire lui
            return this.lockedEnemy;
        }


        const availableEnemies = this.scene.enemies.filter(e =>  //Altrimenti cerco un nuovo nemico tra quelli attaccabili
            !e.isDead &&
            e.attackingAvatars.length <= e.maxAttackingAvatars
        );

        if (availableEnemies.length === 0) {
            return null;
        }

        //Trova il più vicino
        let closest = availableEnemies[0];
        let minDist = Phaser.Math.Distance.Between(this.container.x, this.container.y, closest.container.x, closest.container.y);

        for (const enemy of availableEnemies) {
            const dist = Phaser.Math.Distance.Between(this.container.x, this.container.y, enemy.container.x, enemy.container.y);
            if (dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }


        this.lockedEnemy = closest; //Blocca questo nuovo nemico per questo avatar
        return closest;
    }





    async restoreSprite() {
        return new Promise((resolve) => {
            if (!this.avatar || !this.avatar.setTexture || !this.avatar.setFrame || !this.scene) return resolve();

            const walkSpriteKey = this.woman ? 'womanWalk' : 'manWalk';



            this.avatar?.setTexture(walkSpriteKey);
            this.avatar.setFrame(0);
            resolve();


        });



    }



    async attackLoop() {
        console.log(this.channel + " Entra nella funzione attackLoop");

        // Evita chiamate multiple a resolve()
        this.attackResolved = false;

        return new Promise((resolve) => {
            if (!this.scene.scene.isActive()) {
                this.stopAttack();
                this.attackResolved = true;
                resolve();
                return;
            }


            if (!this.scene.enemies || (this.scene.enemies.length && this.scene.enemies.length === 0)) {
                console.log("Non ci sono nemici disponibili per attaccare");
                this.isAttacking = false;
                this.attackResolved = true;
                this.stopAttack();
                this.restoreSprite().then(resolve);
                return;
            }

            const runAnim = this.woman ? 'woman-run' : 'man-run';
            const attackAnim = this.woman ? 'woman-attack' : 'man-attack';
            this.avatar.play(runAnim, true);

            const targetEnemy = this.seekEnemy();//Sceglie il nemico più vicino tra tutti quelli attaccabili

            if (!targetEnemy) {
                console.log(this.channel + " non trova nemici da attaccare");
                this.isAttacking = false;
                this.attackResolved = true;
                if (this.moveEvent) {
                    this.moveEvent.remove();
                    this.moveEvent = null;
                }

                if (this.avatar.anims) {
                    this.avatar.anims.stop();
                    this.avatar.setFrame(0);
                }

                this.restoreSprite().then(resolve);
                return;
            }






            const hitDistance = 20;

            if (this.moveEvent) {
                console.log("Il moveEvent era già attivo ed è stato rimosso");
                this.moveEvent.remove();
                this.moveEvent = null;
            }

            this.moveEvent = this.scene.time.addEvent({
                delay: 40,
                loop: true,
                callback: async () => {
                    //Se il target non è più valido o l'avatar ha interrotto l'attacco
                    if (!this.attackResolved && (
                        !this.isAttacking || !targetEnemy
                    )) {
                        console.log(this.channel + " Smette di attaccare se non sta attaccando o il nemico è morto");

                        this.attackResolved = true;
                        this.stopAttack();

                        await this.restoreSprite();
                        resolve();
                        return;
                    }

                    const dx = targetEnemy.container.x - this.container.x;
                    const dy = targetEnemy.container.y - this.container.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);

                    //Movimento verso il nemico

                    const pixelsPerSecond = 90;
                    const stepDistance = (pixelsPerSecond / 1000) * 40;

                    const moveX = Math.cos(angle) * stepDistance;
                    const moveY = Math.sin(angle) * stepDistance;

                    this.container.x += moveX;
                    this.container.y += moveY;
                    if (this.avatar) {
                        this.avatar.setFlipX(moveX < 0);
                    }

                    await this.avoidFortWhileMoving(targetEnemy, "attack", runAnim);


                    console.log("Prima del controllo su hitDistance " + this.channel + " isAttacking: " + this.isAttacking);

                    if (!this.isAttacking) {
                        console.log("Se l'avatar non sta attacando, esce dal moveEvent");
                        if (this.moveEvent) {
                            this.moveEvent.remove();
                            this.moveEvent = null;
                        }

                        if (this.avatar.anims) {
                            this.avatar.anims.stop();
                            this.avatar.setFrame(0);
                        }

                        this.restoreSprite().then(resolve);
                        await this.attackLoop();
                        return;
                    }

                    if (!targetEnemy) {
                        this.restoreSprite().then(resolve);
                        await this.attackLoop();
                        return;
                    }

                    if (distance <= hitDistance && this.moveEvent && this.avatar.anims && !this.avatar.isDead) {//Se l'avatar è effettivamente vicino al nemico, si ferma e lo attacca

                        if (targetEnemy.attackingAvatars && !targetEnemy.attackingAvatars.includes(this)) {
                            console.log("attackingAvatars push " + this.channel);
                            targetEnemy.attackingAvatars.push(this);
                        }//L'avatar viene aggiunto tra quelli che attaccano il nemico

                        this.stopAndAttack(targetEnemy, dx, attackAnim);
                        this.moveEvent.remove();
                        this.moveEvent = null;
                        resolve();
                        return;



                    }
                }
            });
        });
    }

    async stopAndAttack(targetEnemy, dx, attackAnim) {
        return new Promise((resolve) => {


            this.avatar.setFlipX(dx < 0);

            this.avatar.play(attackAnim);

            this.avatar.once('animationcomplete', async () => {
                if (!this.scene || !this.avatar || this.isDead || this.attackResolved) return resolve();

                if (!this.isAttacking) {
                    this.attackResolved = true;
                    await this.restoreSprite();
                    resolve();
                    return;
                }



                if (targetEnemy) {
                    targetEnemy.takeDamage(this);
                    targetEnemy.isAttacked = true;
                    this.avatarLevel.setAttack();
                    this.setLevelProgress(this.avatarLevel.getDefence(), this.avatarLevel.getAttack());
                    this.avatarLevel.goToNextLevel();
                }


                this.scene.time.delayedCall(1000, () => {//Se l'avatar attacca ancora, ricomincia l'attack loop
                    if (!this.isDead && this.isAttacking && !this.attackResolved) {
                        this.attackLoop();
                        resolve();
                        return;
                    }
                });
            });
        });

    }


    async avoidFortWhileMoving(target, activity, runAnim) {

        const fort = this.scene.woodenFort;




        const cancelTween = () => {
            if (this.walkToClosestTreeTween) {
                this.walkToClosestTreeTween.remove();
                this.walkToClosestTreeTween = null;
            }
        };

        const cancelAttackTween = () => {
            if (this.moveEvent) {
                this.moveEvent.remove();
                this.moveEvent = null;
            }
        };


        if (activity == "gathering") {
            //Tocca il lato sinistro del forte
            if (this.scene.isTouchingFortLeft(this.container.x, this.container.y)) {
                this.currentTree.isGathered = false;
                target.isGathered = false;
                cancelTween();
                console.log(this.channel, "tocca lato SINISTRO del forte");

                if (this.currentTree.treeImage.y < fort.y) {

                    this.container.x -= 10;
                    console.log("SINISTRO il nemico è sopra il forte");
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX - 50, this.woodenFortAccessPointAboveY - 50, this.speed.walk);

                    await this.gatheringLoop();
                    return;
                } else if (this.currentTree.treeImage.y > fort.y + fort.displayHeight) {

                    console.log("SINISTRO il nemico è sotto il forte");
                    this.container.x -= 10;
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX - 50, this.woodenFortAccessPointY + 50, this.speed.walk);

                    await this.gatheringLoop();
                    return;
                }
                else {

                    console.log("SINISTRO il nemico è all'altezza del forte");

                    if (this.currentTree.treeImage.x > fort.x + fort.displayWidth) {

                        console.log("SINISTRO Il nemico è accanto al lato DESTRO del forte");
                        if (this.container.y > fort.y + fort.displayHeight / 2 && this.container.y <= fort.y + fort.displayHeight) {

                            console.log("SINISTRO " + this.channel + "tocca il lato SINISTRO del forte nella sua metà in basso");
                            this.container.x -= 10;
                            await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX - 50, this.woodenFortAccessPointY, this.speed.walk);
                            await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointFourX + 50, this.woodenFortAccessPointY, this.speed.walk);
                            await this.gatheringLoop();
                            return;
                        }
                        else if (this.container.y <= fort.y + fort.displayHeight / 2 && this.container.y > fort.y) {

                            console.log("SINISTRO " + this.channel + "tocca il lato SINISTRO del forte nella sua metà in alto");
                            this.container.x -= 10;
                            await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX - 50, this.woodenFortAccessPointAboveY, this.speed.walk);
                            await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveRightX + 50, this.woodenFortAccessPointAboveY, this.speed.walk);
                            await this.gatheringLoop();
                            return;
                        }
                    }
                    else if (this.currentTree.treeImage.x < fort.x) {
                        console.log("SINISTRO Il nemico è accanto al lato SINISTRO del forte");

                        await this.gatheringLoop();
                        return;

                    }


                }



            }

            //Tocca il lato destro del forte
            else if (this.scene.isTouchingFortRight(this.container.x, this.container.y)) {
                this.currentTree.isGathered = false;
                target.isGathered = false;
                cancelTween();
                console.log(this.channel, "tocca lato DESTRO del forte");

                if (this.currentTree.treeImage.y < fort.y) {

                    console.log("DESTRO il nemico si trova sopra il forte");
                    this.container.x += 10;
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveRightX, this.woodenFortAccessPointAboveY - 50, this.speed.walk);

                    await this.gatheringLoop();
                    return;
                } else if (this.currentTree.treeImage.y > fort.y + fort.displayHeight) {

                    console.log("DESTRO il nemico si trova sotto il forte");
                    this.container.x += 10;
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointFourX, this.woodenFortAccessPointY + 50, this.speed.walk);
                    await this.gatheringLoop();
                    return;
                }
                else {

                    console.log("DESTRO il nemico è all'altezza del forte");
                    if (this.currentTree.treeImage.x > fort.x + fort.displayWidth) {

                        console.log("DESTRO Il nemico è accanto al lato DESTRO del forte");
                        await this.gatheringLoop();
                        return;
                    }
                    else if (this.currentTree.treeImage.x < fort.x) {

                        console.log("DESTRO Il nemico è accanto al lato SINISTRO del forte");
                        if (this.container.y > fort.y + fort.displayHeight / 2 && this.container.y <= fort.y + fort.displayHeight) {

                            console.log("DESTRO " + this.channel + "tocca il lato DESTRO del forte nella sua metà in basso");
                            this.container.x -= 10;
                            await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointFourX + 50, this.woodenFortAccessPointY, this.speed.walk);
                            await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX - 50, this.woodenFortAccessPointY, this.speed.walk);
                            await this.gatheringLoop();
                            return;
                        }
                        else if (this.container.y <= fort.y + fort.displayHeight / 2 && this.container.y > fort.y) {

                            console.log("DESTRO " + this.channel + "tocca il lato DESTRO del forte nella sua metà in alto");
                            this.container.x += 10;
                            await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveRightX + 50, this.woodenFortAccessPointAboveY, this.speed.walk);
                            await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX - 50, this.woodenFortAccessPointAboveY, this.speed.walk);
                            await this.gatheringLoop();
                            return;
                        }

                    }


                }


            }

            //Tocca il lato superiore
            else if (this.scene.isTouchingFortAbove(this.container.x, this.container.y + 50)) {
                this.currentTree.isGathered = false;
                target.isGathered = false;
                cancelTween();
                console.log(this.channel, "tocca lato SOPRA del forte");

                if (this.currentTree.treeImage.y <= fort.y && this.container.x >= fort.x + fort.displayWidth / 2) {

                    console.log("SOPRA il nemico è sopra il forte e l'avatar tocca il lato sopra dalla destra");
                    this.container.y -= 11;
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveRightX - 50, this.woodenFortAccessPointAboveY - 90, this.speed.walk);
                    await this.gatheringLoop();
                    return;
                }
                else if (this.currentTree.treeImage.y <= fort.y && this.container.x < fort.x + fort.displayWidth / 2) {

                    console.log("SOPRA il nemico è sopra il forte e l'avatar tocca il lato sopra dalla sinistra");
                    this.container.y -= 11;
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX + 50, this.woodenFortAccessPointAboveY - 90, this.speed.walk);
                    await this.gatheringLoop();
                    return;
                }
                else if (this.currentTree.treeImage.y > fort.y && this.currentTree.treeImage.y <= fort.y + fort.displayHeight && this.currentTree.treeImage.x < fort.x) {

                    console.log("SOPRA il nemico è a sinistra del forte, all'altezza del forte");
                    this.container.y -= 11;
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX - 50, this.woodenFortAccessPointAboveY, this.speed.walk);
                    await this.gatheringLoop();
                    return;
                } else if (this.currentTree.treeImage.y > fort.y && this.currentTree.treeImage.y <= fort.y + fort.displayHeight && this.currentTree.treeImage.x > fort.x + fort.displayWidth) {

                    console.log("SOPRA il nemico è a destra del forte, all'altezza del forte");
                    this.container.y -= 11;
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveRightX + 50, this.woodenFortAccessPointAboveY, this.speed.walk);
                    await this.gatheringLoop();
                    return;
                }
                else if (this.currentTree.y >= fort.y + fort.displayHeight) {

                    console.log("SOPRA il nemico è sotto il forte")
                    if (this.container.x > fort.x + fort.displayWidth / 2) {

                        console.log("SOPRA " + this.channel + " tocca il forte dopo la metà del lato");
                        this.container.y -= 11;
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveRightX + 50, this.woodenFortAccessPointAboveY, this.speed.walk);
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointFourX + 50, this.woodenFortAccessPointY, this.speed.walk);
                        await this.gatheringLoop();
                        return;
                    }
                    else {

                        console.log("SOPRA " + this.channel + " tocca il forte prima della metà del lato");
                        this.container.y -= 11;
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX - 50, this.woodenFortAccessPointAboveY, this.speed.walk);
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX - 50, this.woodenFortAccessPointY, this.speed.walk);
                        await this.gatheringLoop();
                        return;
                    }

                }




            }

            //Tocca il lato inferiore
            else if (this.scene.isTouchingFortBelow(this.container.x, this.container.y - 50)) {
                this.currentTree.isGathered = false;
                target.isGathered = false;
                cancelTween();
                console.log(this.channel, "tocca lato SOTTO del forte");

                if (this.currentTree.treeImage.y >= fort.y + fort.displayHeight && this.container.x >= fort.x + fort.displayWidth / 2) {

                    console.log("SOTTO il nemico è sotto il forte e l'avatar tocca il lato sotto dalla destra");
                    this.container.y += 11;
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointFourX - 50, this.woodenFortAccessPointY + 100, this.speed.walk);
                    await this.gatheringLoop();
                    return;
                }
                else if (this.currentTree.treeImage.y >= fort.y + fort.displayHeight && this.container.x < fort.x + fort.displayWidth / 2) {

                    console.log("SOTTO il nemico è sotto il forte e l'avatar tocca il lato sotto dalla sinistra");
                    this.container.y += 11;
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX + 50, this.woodenFortAccessPointY + 100, this.speed.walk);
                    await this.gatheringLoop();
                    return;
                }
                else if (this.currentTree.treeImage.y < fort.y + fort.displayHeight && this.currentTree.treeImage.y >= fort.y && this.currentTree.treeImage.x < fort.x) {

                    console.log("SOTTO il nemico è all'altezza del forte, a sinistra del forte");
                    this.container.y += 11;
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX - 50, this.woodenFortAccessPointY, this.speed.walk);
                    await this.gatheringLoop();
                    return;
                } else if (this.currentTree.treeImage.y < fort.y + fort.displayHeight && this.currentTree.treeImage.y >= fort.y && this.currentTree.treeImage.x > fort.x + fort.displayWidth) {

                    console.log("SOTTO il nemico è all'altezza del forte, a destra del forte");
                    this.container.y += 11;
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointFourX + 50, this.woodenFortAccessPointY, this.speed.walk);
                    await this.gatheringLoop();
                    return;
                }
                else if (this.currentTree.treeImage.y < fort.y) {

                    console.log("SOTTO il nemico è sopra il forte");
                    this.container.y += 11;
                    if (this.container.x > fort.x + fort.displayWidth / 2) {
                        this.currentTree.isGathered = false;
                        target.isGathered = false;
                        console.log("SOTTO " + this.channel + " tocca il forte dopo la metà del lato");
                        this.container.y -= 11;
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointFourX + 50, this.woodenFortAccessPointY, this.speed.walk);
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveRightX + 50, this.woodenFortAccessPointAboveY, this.speed.walk);
                        await this.gatheringLoop();
                        return;
                    }
                    else {

                        console.log("SOTTO " + this.channel + " tocca il forte prima della metà del lato");
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX - 50, this.woodenFortAccessPointY, this.speed.walk);
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX - 50, this.woodenFortAccessPointAboveY, this.speed.walk);
                        await this.gatheringLoop();
                        return;
                    }

                }
            }
        }
        else {//Evita il forte durante l'attacco
            //Tocca il lato sinistro del forte
            this.avatar.play(runAnim, true);
            if (this.scene.isTouchingFortLeft(this.container.x, this.container.y)) {

                cancelAttackTween();
                console.log(this.channel, "tocca lato SINISTRO del forte target: " + target.container.y);

                if (target.container.y < fort.y + 20) {
                    this.container.x -= 10;
                    console.log("SINISTRO Il nemico è sopra il forte");
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX - 50, this.woodenFortAccessPointAboveY - 40, this.speed.run);

                    await this.attackLoop();
                    return;
                } else if (target.container.y > fort.y + fort.displayHeight) {
                    this.container.x -= 10;
                    console.log("SINISTRO Il nemico è sotto il forte");
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX - 50, this.woodenFortAccessPointY + 40, this.speed.run);

                    await this.attackLoop();
                    return;
                }
                else {
                    console.log("Il nemico è all'altezza del forte");
                    if (target.container.x > fort.x + fort.displayWidth) {
                        this.container.x -= 10;
                        console.log("SINISTRO Il nemico è all'altezza del forte ma dal lato opposto");
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX - 50, this.woodenFortAccessPointAboveY - 40, this.speed.run);
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveRightX + 50, this.woodenFortAccessPointAboveY - 40, this.speed.run);
                        await this.attackLoop();
                        return;
                    } else if (target.container.x < fort.x) {
                        console.log("SINISTRO Il nemico è all'altezza del forte ma dal lato sinistro");
                        await this.attackLoop();
                        return;
                    }
                }



            }

            //Tocca il lato destro del forte
            if (this.scene.isTouchingFortRight(this.container.x, this.container.y)) {

                cancelAttackTween();
                console.log(this.channel, "tocca lato DESTRO del forte target: " + target.container.y);

                if (target.container.y < fort.y + 20) {
                    this.container.x += 10;
                    console.log("DESTRO Il nemico è sopra il forte");
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveRightX + 50, this.woodenFortAccessPointAboveY - 40, this.speed.run);

                    await this.attackLoop();
                    return;
                } else if (target.container.y > fort.y + fort.displayHeight) {
                    this.container.x += 10;
                    console.log("DESTRO Il nemico è sotto il forte");
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointFourX + 50, this.woodenFortAccessPointY + 40, this.speed.run);
                    await this.attackLoop();
                    return;
                }
                else {
                    console.log("Il nemico è all'altezza del forte");
                    if (target.container.x < fort.x) {
                        this.container.x += 10;
                        console.log("DESTRO Il nemico è all'altezza del forte ma dal lato opposto");
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveRightX + 50, this.woodenFortAccessPointAboveY - 40, this.speed.run);
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX - 50, this.woodenFortAccessPointAboveY - 40, this.speed.run);
                        await this.attackLoop();
                        return;
                    }
                    else if (target.container.x > fort.x + fort.displayWidth) {
                        console.log("DESTRO Il nemico è all'altezza del forte ma dal lato destro");
                        await this.attackLoop();
                        return;
                    }
                }



            }

            //Tocca il lato superiore
            if (this.scene.isTouchingFortAbove(this.container.x, this.container.y + 100)) {

                cancelAttackTween();
                console.log(this.channel, "tocca lato SOPRA del forte target: " + target.container.y);

                if (target.container.y <= fort.y) {
                    console.log("SOPRA Il nemico è sopra il forte");
                    await this.attackLoop();
                    return;
                }
                else if (target.container.y > fort.y + fort.displayHeight) {
                    this.container.y -= 11;
                    console.log("SOPRA Il nemico è sotto il forte");
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX - 50, this.woodenFortAccessPointAboveY - 40, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX - 50, this.woodenFortAccessPointY + 40, this.speed.run);
                    await this.attackLoop();
                    return;
                }
                else {
                    console.log("Il nemico è all'altezza del forte");
                    if (target.container.y > fort.y && target.container.y < fort.y + fort.displayHeight && target.container.x < fort.x) {
                        this.container.y -= 11;
                        console.log("SOPRA Il nemico è all'altezza del lato sinistro del forte");
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX - 50, this.woodenFortAccessPointAboveY - 40, this.speed.run);
                        await this.attackLoop();
                        return;
                    } else if (target.container.y > fort.y && target.container.x > fort.x + fort.displayWidth && target.container.x > fort.x + fort.displayWidth) {
                        this.container.y -= 11;
                        console.log("SOPRA Il nemico è all'altezza del lato destro del forte");
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveRightX + 50, this.woodenFortAccessPointAboveY - 40, this.speed.run);
                        await this.attackLoop();
                        return;
                    }

                }



            }

            //Tocca il lato inferiore
            if (this.scene.isTouchingFortBelow(this.container.x, this.container.y - 100)) {

                cancelAttackTween();
                console.log(this.channel, "tocca lato SOTTO del forte target: " + target.container.y);

                if (target.container.y >= fort.y + fort.displayHeight) {
                    await this.attackLoop();
                    return;
                }
                else if (target.container.y < fort.y) {
                    this.container.y += 11;
                    console.log("SOTTO Il nemico è sopra il forte");
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX - 50, this.woodenFortAccessPointY + 40, this.speed.run);
                    await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointAboveLeftX - 50, this.woodenFortAccessPointAboveY + 40, this.speed.run);
                    await this.attackLoop();
                    return;
                }
                else {
                    console.log("Il nemico è all'altezza del forte");
                    if (target.container.y > fort.y && target.container.y < fort.y + fort.displayHeight && target.container.x < fort.x) {
                        this.container.y += 11;
                        console.log("SOTTO Il nemico è all'altezza del lato sinistro del forte");
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointOneX - 50, this.woodenFortAccessPointY + 40, this.speed.run);
                        await this.attackLoop();
                        return;
                    } else if (target.container.y > fort.y && target.container.y < fort.y + fort.displayHeight && target.container.x > fort.x + fort.displayWidth) {
                        this.container.y += 11;
                        console.log("SOTTO Il nemico è all'altezza del lato destro del forte");
                        await this.walkToWoodenFortAccessPointAsync(this.woodenFortAccessPointFourX + 50, this.woodenFortAccessPointY + 40, this.speed.run);
                        await this.attackLoop();
                        return;
                    }
                }

            }
        }

    }





    stopAttack() {
        console.log("stopAttack " + this.channel + " interrompe l'attacco");

        if (this.moveEvent) {
            console.log("stopAttack rimuove il moveEvent");
            this.moveEvent.remove();
            this.moveEvent = null;
        }

        if (this.avatar.anims) {
            this.avatar.anims.stop();
            this.avatar.setFrame(0);
        }


        if (this.isGathering) {
            console.log("Interrompe stopAttack, perchè l'avatar è impegnato nella raccolta");
            return;
        }

        if (this.seedingTween) {
            const animKey = this.woman ? "woman-seeding" : "man-seeding";
            if (Phaser.Math.Between(1, 100) <= 50) {
                this.restartSeeding(animKey, "left", Phaser.Math.Between(40, 100));
            } else {
                this.restartSeeding(animKey, "right", Phaser.Math.Between(40, 100));
            }

        }








        //Rimuovi l'avatar da qualsiasi nemico che lo stava attaccando
        if (this.scene?.enemies?.length > 0) {
            for (const enemy of this.scene.enemies) {
                if (enemy.attackingAvatars) {
                    if (enemy.attackingAvatars.includes(this)) {
                        enemy.removeAvatar(this);
                        console.log("stopAttack Enemy attackingAvatars.length: " + enemy.attackingAvatars.length);

                        if (
                            enemy.enemy.anims &&
                            enemy.attackingAvatars.length > 0 &&
                            (!enemy.enemy.anims.isPlaying || enemy.enemy.anims.currentAnim.key !== enemy.animKey.attack)
                        ) {
                            console.log("stopAttack Il nemico viene attaccato da altri avatar e può eseguire l'animazione dell'attacco");
                            enemy.enemy.play(enemy.animKey.attack);
                        }

                        else if (!enemy.attackingAvatars || (enemy.attackingAvatars &&
                            enemy.attackingAvatars.length === 0 &&
                            enemy.targetFortPos &&
                            enemy.attackAvatarEvent &&
                            !enemy.isDead &&
                            !this.scene.woodenFort.isDestroyed
                        )) {
                            console.log("stopAttack il nemico torna ad attaccare il forte");


                            enemy.attackAvatarEvent.remove();
                            enemy.attackAvatarEvent = null;

                            if (enemy.enemy.anims) {
                                console.log("stopAttack ferma animazione attacco prima di camminare verso il forte");
                                enemy.enemy.anims.stop();
                                enemy.enemy.setFrame(0);
                            }


                            if (enemy.enemy.texture.key !== enemy.spriteKey.walk) {
                                console.log("stopAttack cambia la texture del nemico in modalità camminata");
                                enemy.enemy.setTexture(enemy.spriteKey.walk);
                            }

                            enemy.enemy.play(enemy.animKey.walk, true);
                            enemy.goTo(enemy.targetFortPos.x, enemy.targetFortPos.y);
                        }
                    }


                } else {
                    console.log("stopAttack " + this.channel + " non era tra gli avatars che attaccavano il nemico");
                }
            }



        } else {
            console.log("stopAttack non sono riuscito ad accedere a enemies");
        }

        this.lockedEnemy = null;
    }



    async seedingLoop() {
        if (this.isSeeding) return;
        console.log(this.channel + " entra nel seeding loop");
        this.isEnteringFort = false;
        this.isGoingInsideFort = false;
        if (this.isGathering) {
            await this.stopGathering();
        }



        if (this.walkToClosestTreeTween) {
            this.walkToClosestTreeTween.remove();
            this.walkToClosestTreeTween = null;
        }

        if (this.walkToWoodenFortAccessPointTween) {
            this.walkToWoodenFortAccessPointTween.remove();
            this.walkToWoodenFortAccessPointTween = null;
        }

        if (this.walkToWoodenFortTween) {
            this.walkToWoodenFortTween.remove();
            this.walkToWoodenFortTween = null;
        }






        this.isSeeding = true;
        this.isGathering = false;
        this.isAttacking = false;
        //this.isEnteringFort = false;


        const animKey = this.woman ? "woman-seeding" : "man-seeding";
        if (this.hasEnteredFort) {
            console.log(this.channel + "era ancora nel forte ed esce");
            await this.exitFort();

            if (!this.isSeeding || this.isDead) return;

            if (Phaser.Math.Between(1, 100) <= 50) {//Impartisce la direzione iniziale verso cui l'avatar semina

                console.log(this.channel + "comincia la camminata della semina, uscendo dal forte e andando verso destra");
                this.startSeedingWalk(animKey, "right", this.pathVariability);
            }
            else {

                console.log(this.channel + "comincia la camminata della semina, uscendo dal forte e andando verso sinistra");
                this.startSeedingWalk(animKey, "left", this.pathVariability);
            }
            return;
        }



        if (!this.isSeeding || this.isDead) return;

        if (this.container.x < this.gameWidth / 2) {//Impartisce la direzione iniziale verso cui l'avatar semina
            this.pathVariabilityChanger();
            this.startSeedingWalk(animKey, "right", this.pathVariability);
        }
        else {
            this.pathVariabilityChanger();
            this.startSeedingWalk(animKey, "left", this.pathVariability);
        }

    }

    startSeedingWalk(animKey, direction = "right", newPathVariability) {
        if (this.isDead) return;

        console.log(this.channel + " inizia la camminata della semina ");


        //Calcolo target X
        let targetX = this.container.x + (direction === "right" ? Phaser.Math.Between(800, this.scene.gameWidth) : -Phaser.Math.Between(800, this.scene.gameWidth));
        targetX = Phaser.Math.Clamp(targetX, 0, this.scene.gameWidth - 50);
        const distance = Math.abs(targetX - this.container.x);
        const speed = 10;
        const duration = (distance / speed) * 1000;
        this.avatar.setFlipX(direction === "left");

        this.avatar.play(animKey, true);
        this.seedingRestarted = false;


        if (this.seedTimer) this.seedTimer.remove();
        this.seedTimer = this.scene.time.addEvent({
            delay: 4000,
            loop: true,
            callback: async () => {
                if (this.isAttacking || this.isEnteringFort || this.isGathering) {
                    console.log(this.channel + " interrompe la semina ");
                    await this.stopSeeding();
                } else {
                    console.log(this.channel + " continua la semina");
                    this.dropSeed();
                }
            }
        });

        if (this.seedingTween) {
            this.seedingTween.remove();
            this.seedingTween = null
        }

        this.pathVariability = newPathVariability;
        this.seedingTween = this.scene.tweens.add({
            targets: this.container,
            x: targetX,
            y: this.container.y + this.pathVariability,
            duration: duration,
            ease: 'Linear',
            onUpdate: async () => {
                this.adjustYPosition(animKey, direction);

                if (!this.seedingRestarted && this.scene.woodenFort) {
                    if (this.container.x > this.gameWidth / 2) {
                        this.aboveBelowMargin = -35;
                    } else {
                        this.aboveBelowMargin = 35;
                    }

                    if (this.scene.isTouchingFortLeft(this.container.x + 40, this.container.y)) {
                        this.container.x -= 5;
                        console.log(this.channel + " tocca il forte a sinistra e torna verso sinistra");
                        this.restartSeeding(animKey, "left", this.pathVariability);
                    }

                    else if (this.scene.isTouchingFortRight(this.container.x - 40, this.container.y)) {
                        this.container.x += 5;
                        console.log(this.channel + " tocca il forte a destra e torna verso destra");
                        this.restartSeeding(animKey, "right", this.pathVariability);
                    }

                    else if (!this.isGoingAway && this.scene.isTouchingFortAbove(this.container.x + this.aboveBelowMargin, this.container.y + 60)) {
                        console.log(this.channel + " tocca il forte da sopra e torna su");

                        if (this.container.x >= this.scene.woodenFort.x + this.scene.woodenFort.displayWidth) {
                            await this.walkToWoodenFortAccessPointSeedingAsync(this.woodenFortAccessPointAboveLeftX, this.woodenFortAccessPointAboveY - 50, this.speed.walk - 70, animKey, direction, true);
                        }
                        else if (this.container.x <= this.scene.woodenFort.x) {
                            await this.walkToWoodenFortAccessPointSeedingAsync(this.woodenFortAccessPointAboveRightX, this.woodenFortAccessPointAboveY - 50, this.speed.walk - 70, animKey, direction, true);
                        }
                        else {
                            if (Phaser.Math.Between(1, 100) <= 50) {
                                await this.walkToWoodenFortAccessPointSeedingAsync(this.woodenFortAccessPointAboveLeftX, this.woodenFortAccessPointAboveY - 50, this.speed.walk - 70, animKey, direction, true);
                            }
                            else {
                                await this.walkToWoodenFortAccessPointSeedingAsync(this.woodenFortAccessPointAboveRightX, this.woodenFortAccessPointAboveY - 50, this.speed.walk - 70, animKey, direction, true);
                            }
                        }
                    }

                    else if (!this.isGoingInsideFort && !this.isGoingAway && this.scene.isTouchingFortBelow(this.container.x + this.aboveBelowMargin, this.container.y - 60)) {
                        console.log(this.channel + " tocca il forte da sotto e torna giù");
                        if (this.container.x >= this.scene.woodenFort.x + this.scene.woodenFort.displayWidth) {
                            await this.walkToWoodenFortAccessPointSeedingAsync(this.woodenFortAccessPointOneX, this.woodenFortAccessPointY + 80, this.speed.walk - 70, animKey, direction, false);
                        }
                        else if (this.container.x <= this.scene.woodenFort.x) {
                            await this.walkToWoodenFortAccessPointSeedingAsync(this.woodenFortAccessPointFourX, this.woodenFortAccessPointY + 80, this.speed.walk - 70, animKey, direction, false);
                        }
                        else {
                            if (Phaser.Math.Between(1, 100) <= 50) {
                                await this.walkToWoodenFortAccessPointSeedingAsync(this.woodenFortAccessPointOneX, this.woodenFortAccessPointY + 80, this.speed.walk - 70, animKey, direction, false);
                            }
                            else {
                                await this.walkToWoodenFortAccessPointSeedingAsync(this.woodenFortAccessPointFourX, this.woodenFortAccessPointY + 80, this.speed.walk - 70, animKey, direction, false);
                            }
                        }
                    }

                }

            },

            onComplete: () => {
                if (!this.seedingRestarted) {
                    const newDir = direction === "right" ? "left" : "right";
                    this.startSeedingWalk(animKey, newDir, this.pathVariability);
                }
            }
        });
    }

    restartSeeding(animKey, newDir, newVariability) {
        this.seedingRestarted = true;
        if (this.seedingTween) {
            this.seedingTween.remove();
            this.seedingTween = null;
        }

        if (this.seedTimer) {
            this.seedTimer.remove();
            this.seedTimer = null;
        }

        this.newDir = newDir;
        this.pathVariability = newVariability;

        if (this.pathVariability > 0)
            this.pathVariability = Phaser.Math.Between(40, 100);
        else
            this.pathVariability = -Phaser.Math.Between(40, 100);

        this.scene.time.delayedCall(50, () => {
            this.startSeedingWalk(animKey, this.newDir, this.pathVariability);
        });
    }

    adjustYPosition(animKey, direction) {

        if (this.container.y >= this.gameHeight) {
            this.container.y--;
            this.restartSeeding(animKey, direction, -Phaser.Math.Between(10, 40));
        } else if (this.container.y < 45) {
            this.container.y++;
            this.restartSeeding(animKey, direction, Phaser.Math.Between(5, 10));
        }
    }


    dropSeed() {

        if (this.scene.trees.length >= this.scene.maxSeeds) {//Evito che ci siano troppi possibili alberi adulti in scena
            console.log(this.channel + " ha finito i semi a disposizione, attendere");
            return;
        }

        const offsetX = this.avatar.flipX ? -Phaser.Math.FloatBetween(1, 5) : Phaser.Math.FloatBetween(1, 5);
        const seedX = this.container.x + offsetX;
        const seedY = this.container.y - 20; //Inizia più in alto

        //Aumenta la difesa dell'avatar in base al suo livello
        this.avatarLevel.setDefence();
        this.setLevelProgress(this.avatarLevel.getDefence(), this.avatarLevel.getAttack());//Aggiorna la barra del livello
        this.avatarLevel.goToNextLevel();//Prova a vedere se si può passare al livello successivo e, se sì passa al livello successivo

        const seed = new Seed(this.scene, this.gameWidth, this.gameHeight, seedX, seedY);
        this.scene.trees.push(seed); //Aggiungi all’array degli alberi nella scena
        seed.show();

        this.scene.tweens.add({
            targets: seed.treeImage,
            y: this.container.y + Phaser.Math.FloatBetween(1, 5), // fino ai piedi
            duration: 250,
            ease: "Bounce.Out"
        });



    }

    async stopSeeding() {
        console.log(this.channel + " interrompe la semina");
        if (this.seedTimer) {
            this.seedTimer.remove();
            this.seedTimer = null;
        }

        if (this.avatar.anims) {
            await this.avatar.anims.stop(); //Ferma l'animazione della semina
            this.avatar.setFrame(0);
        }

        if (this.seedingTween) {
            this.seedingTween.remove();  //Ferma il tween che fa spostare l'avatar
            this.seedingTween = null;
        }

        await this.restoreSprite();
        this.isSeeding = false;
    }




    async gathering() {
        if (this.isGathering) return;
        this.adultTrees = this.scene.trees.filter(tree => tree instanceof AdultStage && !tree.isGathered);

        if (!this.adultTrees || (this.adultTrees && this.adultTrees.length == 0)) {
            console.log("Da gathering " + this.channel + " non può iniziare la raccolta perchè non ci sono alberi adulti disponibili");
            return;
        }

        if (this.isSeeding) {
            await this.stopSeeding();
        }

        if (this.seedingTween) {
            this.seedingTween.remove();
            this.seedingTween = null;
        }

        if (this.walkToWoodenFortAccessPointTween) {
            this.walkToWoodenFortAccessPointTween.remove();
            this.walkToWoodenFortAccessPointTween = null;
        }

        if (this.walkToWoodenFortTween) {
            this.walkToWoodenFortTween.remove();
            this.walkToWoodenFortTween = null;
        }

        if (this.gatherLoop) {
            this.gatherLoop.remove();
            this.gatherLoop = null;
        }



        this.isGathering = true;
        this.isAttacking = false;
        this.isSeeding = false;
        this.isEnteringFort = false;

        if (this.hasEnteredFort)
            await this.exitFort();
        await this.gatheringLoop();
    }

    async gatheringLoop() {

        if (!this.currentTree || (this.currentTree && this.currentTree.isGathered)) {
            if (this.currentTree)
                this.currentTree.isGathered = false;

            this.adultTrees = this.scene.trees.filter(tree => tree instanceof AdultStage && !tree.isGathered);
            if (this.adultTrees.length === 0) {
                this.isGathering = false;
                console.log(this.channel + " prima della ricerca del più vicino non trova alberi adulti disponibili");
                return;
            }


            const closestTree = this.adultTrees.reduce((closest, tree) => {
                console.log(this.channel + " sta cercando l'albero adulto più vicino a lui");
                const dist = Phaser.Math.Distance.Between(this.x, this.y, tree.x, tree.y);
                const closestDist = Phaser.Math.Distance.Between(this.x, this.y, closest.x, closest.y);
                return dist < closestDist ? tree : closest;
            });
            if (closestTree) {
                this.currentTree = closestTree;
                this.currentTree.isGathered = true;
                await this.walkToClosestTree(this.speed.walk);
                await this.startGatheringAnimation();
            } else {
                this.isGathering = false;
                console.log(this.channel + " dopo la ricerca del più vicino non trova alberi adulti disponibili");
                return;
            }
        } else if (this.currentTree && !this.currentTree.isGathered) {
            this.currentTree.isGathered = true;
            await this.walkToClosestTree(this.speed.walk);
            await this.startGatheringAnimation();
        }



    }

    async walkToClosestTree(speed) {
        const dx = this.currentTree.x - this.container.x;
        const dy = this.currentTree.y - this.container.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const duration = (distance / speed) * 1000;

        this.avatar.setFlipX(dx < 0);
        const offsetX = dx < 0 ? -2 : 0;
        this.avatar.x = offsetX;

        const walkAnim = this.woman ? 'woman-walk' : 'man-walk';

        console.log("Da walkToClosestTree closestTree x: " + this.currentTree.x + " y: " + this.currentTree.y);



        this.avatar.play(walkAnim, true);
        //Una volta fuori, crea un tween per andare verso l’albero

        return new Promise(resolve => {
            if (this.walkToClosestTreeTween) {
                console.log("Il tween walkToClosestTreeTween era rimasto attivo ed è stato rimosso");
                this.walkToClosestTreeTween.remove();
                this.walkToClosestTreeTween = null;
            }
            if (this.currentTree) {
                this.walkToClosestTreeTween = this.scene.tweens.add({
                    targets: this.container,
                    x: Phaser.Math.Clamp(this.currentTree.x, 20, this.gameWidth - 20),
                    y: Phaser.Math.Clamp(this.currentTree.y + 30, 40, this.gameHeight - 20),
                    duration: duration,
                    ease: 'Linear',
                    onUpdate: async () => {
                        await this.avoidFortWhileMoving(this.currentTree, "gathering", null);


                        if (this.walkToClosestTreeTween && (this.isEnteringFort || this.isSeeding)) {
                            console.log("Da walkToClosestTreeTween onUpdate " + this.channel + " rende l'albero disponibile, in quanto ha terminato la raccolta");
                            if (this.currentTree) this.currentTree.isGathered = false;
                            this.walkToClosestTreeTween.remove();
                            this.walkToClosestTreeTween = null;
                            resolve();
                        }

                    },
                    onComplete: async () => {
                        if (this.walkToClosestTreeTween && (this.isEnteringFort || this.isSeeding)) {
                            console.log("Da walkToClosestTree onComplete " + this.channel + " rende l'albero disponibile, perchè sta seminando o sta entrando nel forte");
                            if (this.currentTree) this.currentTree.isGathered = false;

                            this.walkToClosestTreeTween.remove();
                            this.walkToClosestTreeTween = null;
                            resolve();

                        }
                        this.avatar.stop();
                        this.avatar.setFrame(0);
                        console.log(this.channel + " è arrivato davanti all'albero");
                        resolve();
                    }
                });
            }

        });
    }



    async startGatheringAnimation() {

        return new Promise((resolve) => {
            console.log(this.channel + " inizia a tagliare l'albero");

            this.maxGatherCount = 8;
            const animationKey = this.woman ? "woman-gathering" : "man-gathering";

            if (this.gatherLoop) {
                console.log("Il gatherLoop era attivo ed è stato rimosso");
                this.gatherLoop.remove();
                this.gatherLoop = null;
            }
            this.gatherLoop = this.scene.time.addEvent({
                delay: 2000,
                loop: true,
                callback: async () => {

                    if (!this.avatar) {
                        this.currentTree.isGathered = false;
                        return;
                    }
                    if (!this.scene.scene.isActive()) {
                        this.currentTree.isGathered = false;
                        await this.stopGathering();
                        return;
                    }

                    if (!this.currentTree || !this.scene.trees.includes(this.currentTree)) {
                        console.log("L'albero non esiste più o è stato rimosso");
                        await this.stopGathering();
                        resolve();
                        return;
                    }

                    if (this.isDead) return resolve();

                    this.avatar?.play(animationKey, true);

                    this.currentTree.hit();
                    console.log(this.channel + "colpisce " + this.currentTree.hittings + " volte l'albero");
                    this.avatarLevel.setAttack();
                    this.setLevelProgress(this.avatarLevel.getDefence(), this.avatarLevel.getAttack());//Aggiorna la barra del livello
                    this.avatarLevel.goToNextLevel();
                    if (!this.adultTrees || (this.adultTrees && (this.adultTrees.length == 0 || this.isSeeding || this.isEnteringFort))) {//Se non ci sono più alberi adulti in scena o vengono inviati altri comandi, termina la raccolta
                        if (this.currentTree) this.currentTree.isGathered = false;
                        await this.stopGathering();

                        resolve();
                        return;
                    }

                    if (this.currentTree.hittings >= this.maxGatherCount) {
                        console.log(this.channel + " smette di colpire l'albero");
                        if (this.gatherLoop) {
                            this.gatherLoop.remove();
                            this.gatherLoop = null;
                        }

                        try {
                            await this.finishGathering();
                        } finally {
                            resolve();
                        }
                    }

                }
            });
        });

    }

    async finishGathering() {
        console.log(this.channel + " aggiunge la legna dell'albero appena tagliato alla legna del forte");
        if (this.currentTree && this.currentTree instanceof AdultStage) {
            this.currentTree.gatherWood(this.currentTree.woodVolume);
        }

        if (this.isGathering && !this.isSeeding && !this.isAttacking && !this.isEnteringFort) {
            await this.gatheringLoop();
        } else {
            await this.stopGathering();
        }
    }


    async stopGathering() {
        console.log(this.channel + " interrompe la raccolta");

        if (this.gatherLoop) {
            this.gatherLoop.remove();
            this.gatherLoop = null;
        }

        if (this.walkToClosestTreeTween) {
            this.walkToClosestTreeTween.remove();
            this.walkToClosestTreeTween = null;
        }

        if (this.avatar.anims) {
            this.avatar.anims.stop();
            this.avatar.setFrame(0);
        }

        if (this.currentTree) {
            console.log(this.channel + " rende l'albero disponibile per le prossime raccolte");
            this.currentTree.isGathered = false;
            this.currentTree = null;
        }



        await this.restoreSprite();
        this.isGathering = false;
    }


    async die() {
        if (this.isDead) return;
        console.log("L'avatar è morto");
        this.isDead = true;
        this.isAttacking = false;

        if (this.avatar && this.avatar.anims) {
            this.avatar.anims.stop(); //Ferma animazione in corso
        }

        await this.restoreSprite();

        //Rimuove questo avatar dall’elenco degli avatar che attaccano ogni nemico
        for (const enemy of this.scene.enemies) {
            enemy.removeAvatar(this);
        }

        this.scene.removeCharacter("avatars", this);

        if (this.moveEvent) {
            this.moveEvent.remove();
            this.moveEvent = null;
            console.log("Il moveEvent dell'avatar non esiste più");
        }

        if (this.avatar) {
            console.log("Rimuovo tutti i listener dell'avatar che è appena morto");
            this.avatar.removeAllListeners(); //Elimina tutti i listener
        }

        if (!this.scene.avatars.length) {
            console.log("Da die L'array degli avatar non è raggiungibile");
        }

        if (this.scene.avatars.length == 0) {
            console.log("Da die Tutti gli avatar sono morti, il gioco riparte");
            this.scene.events.emit('allAvatarsDead', this.scene.ranking);
        }


        if (this.container) {
            this.container.destroy(true);
        }

        if (this.uiContainer) {
            this.uiContainer.destroy(true);
        }
    }



    takeDamage(damage) {
        if (damage <= 0) return;
        if (this.isDead || !this.isAttacking) return;//Se è morto o non sta attaccando, non riceve danni
        if (!this.avatar) return;

        this.life -= damage;
        console.log(this.channel + " ha preso un danno pari a " + damage);
        const percentage = Phaser.Math.Clamp(this.life / 100, 0, 1);
        this.setLife(percentage);

        if (this.life < 0) {
            this.die();
        }
    }

    setLife(percent) {
        const width = this.lifeBarWidth * Phaser.Math.Clamp(percent, 0, 1);
        this.lifeBar.clear().fillStyle(0x00ff00).fillRect(-this.lifeBarWidth / 2, -40, width, 5);
    }

    // Metodo per aggiornare livello
    setLevelProgress(attack, defence) {
        const total = Math.min(attack + defence, 2.4);
        const width = (total * this.lifeBarWidth) / 2.4;
        this.levelBar.clear().fillStyle(0x3399ff).fillRect(-this.lifeBarWidth / 2, this.levelBarY, width, this.levelBarHeight);
    }

    setLevel(level) {
        this.levelLabel.setText(level.toString());
        this.levelBar.clear().fillStyle(0x3399ff).fillRect(-this.lifeBarWidth / 2, -22, 0, this.levelBarHeight);
    }

    async resetAvatarState() {
        console.log("Le animazioni di " + this.channel + " vengono resettate al termine della partita");


        this.isGathering = false;
        this.isSeeding = false;
        this.isAttacking = false;
        this.isEnteringFort = false;
        this.isDead = false;

        if (this.attackEvent) {
            this.attackEvent.remove();
            this.attackEvent = null;
        }

        if (this.gatherLoop) {
            this.gatherLoop.remove();
            this.gatherLoop = null;
        }


        if (this.walkToClosestTreeTween) {
            this.walkToClosestTreeTween.remove();
            this.walkToClosestTreeTween = null;
        }


        if (this.moveEvent) {
            this.moveEvent.remove();
            this.moveEvent = null;
        }


        if (this.seedingTween) {
            this.seedingTween.remove();
            this.seedingTween = null;
        }


        if (this.avatar?.anims) {
            this.avatar.anims.stop();
            this.avatar.setFrame(0);
        }


        if (this.avatar) {
            await this.die();
            this.avatar = null;
        }


        if (this.container) {
            this.container.destroy();
            this.container = null;
        }

        if (this.uiContainer) {
            this.uiContainer.destroy();
            this.uiContainer = null;
        }
    }





}