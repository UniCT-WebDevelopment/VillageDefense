import { io } from 'socket.io-client';
const socket = io(); //Funziona con Vite + proxy

export class AvatarLevel {
    constructor(scene, avatar) {
        this.scene = scene;
        this.avatar = avatar;
        this.level = this.avatar.level;
        this.lifeBonus = 0;
        this.attack = 0;
        this.defence = 0;
        this.savedAttack = 0;
        this.savedDefence = 0;
        this.baseLevelUpSpeed = 0.01;
        this.levelUpSpeed = this.baseLevelUpSpeed;
        this.enemiesKilled = 0;
        this.totalEnemiesKilled = 0;
        this.nextLevelDefenceThreshold = this.baseLevelUpSpeed * 120;
        this.nextLevelAttackThreshold = this.baseLevelUpSpeed * 240 - this.nextLevelDefenceThreshold;
        this.goToNextLevelCalls = 0;
        this.savingsThreshold = 2;
        this.someoneBet = false;
        this.winBet = false;

        this.maxLevel = 70;
        this.maxLevelReached = false;
        this.currentLife = 0;
        this.setAttackDisclaimer = true;
        this.setDefenceDisclaimer = true;
        this.changeLevelUpSpeedConsideringLevel();
    }

    getLevel() {
        return this.level;
    }

    getEnemiesKilled() {
        return this.enemiesKilled;
    }
    getAttack() {
        return this.attack;
    }

    getSavedAttack() {
        return this.savedAttack;
    }

    getDefence() {
        return this.defence;
    }

    getSavedDefence() {
        return this.savedDefence;
    }



    setLifeBonus(life) {
        this.lifeBonus += life;
        console.log(this.avatar.channel + " Settato il lifeBonus: " + this.lifeBonus + " ora il suo valore della vita è " + this.avatar.life);
    }

    setAttack() {
        if (this.maxLevelReached) return;
        if (this.setAttackDisclaimer && this.attack > this.nextLevelAttackThreshold) {
            this.setAttackDisclaimer = false;
            socket.emit("setDisclaimer", `@${this.avatar.channel} start seeding if you want to level up`);

        }
        if (this.attack <= this.nextLevelAttackThreshold) {
            this.attack += this.levelUpSpeed;
            this.savedAttack += this.levelUpSpeed;
            console.log(this.avatar.channel + " Settato attack: " + this.attack);
        }
        else {

            this.goToNextLevel();
        }

    }


    setDefence() {
        if (this.maxLevelReached) return;
        if (this.setDefenceDisclaimer && this.defence > this.nextLevelDefenceThreshold) {
            this.setDefenceDisclaimer = false;
            socket.emit("setDisclaimer", `@${this.avatar.channel} start gathering if you want to level up`);

        }
        if (this.defence <= this.nextLevelDefenceThreshold) {
            this.defence += this.levelUpSpeed;
            this.savedDefence += this.levelUpSpeed;
            console.log(this.avatar.channel + " Settata defence: " + this.defence);
        }
        else {

            this.goToNextLevel();
        }

    }

    setThresholds() {
        this.nextLevelDefenceThreshold = this.baseLevelUpSpeed * Phaser.Math.Between(80, 120);
        this.nextLevelAttackThreshold = this.baseLevelUpSpeed * 240 - this.nextLevelDefenceThreshold;
        console.log(this.avatar.channel + " Nuove soglie per salire di livello attack: " + this.nextLevelAttackThreshold + " defence: " + this.nextLevelDefenceThreshold);
    }


    addAnotherEnemyKilled() {
        this.enemiesKilled++;
        this.totalEnemiesKilled++;
        console.log(this.avatar.channel + " Numero di nemici uccisi: " + this.totalEnemiesKilled);
    }

    goToNextLevel() {
        if (this.maxLevelReached) return;

        if (this.level >= this.maxLevel && !this.maxLevelReached) {
            console.log(this.avatar.channel + "ha raggiunto il livello massimo del gioco ");
            this.maxLevelReached = true;
            this.attack = 1.2;
            this.defence = 1.2;
            this.avatar.setLevelProgress(this.attack, this.defence);

            return;
        }

        const reachedThresholds = this.attack >= this.nextLevelAttackThreshold && this.defence >= this.nextLevelDefenceThreshold;
        const killedEnough = this.enemiesKilled % this.avatar.scene.enemies.length === this.avatar.scene.enemies.length / this.avatar.scene.enemiesForAvatar;

        if (reachedThresholds || killedEnough || this.winBet) {
            this.winBet = false;
            this.goToNextLevelCalls++;
            this.level++;

            this.avatar.setLevel(this.level);
            this.setLifeBonus(20 * this.level);
            this.attack = 0;
            this.defence = 0;
            this.enemiesKilled = 0;
            this.setAttackDisclaimer = true;
            this.setDefenceDisclaimer = true;
            this.setThresholds();
            this.changeLevelUpSpeedConsideringLevel();
            console.log(this.avatar.channel + " è salito al livello " + this.level + " reachedTresholds: " + reachedThresholds + " killedEnough: " + killedEnough);
            this.changeLevelUpSpeedConsideringLevel();
            console.log(this.avatar.channel + " goToNextLevelCalls: " + this.goToNextLevelCalls);
            if (this.goToNextLevelCalls > this.savingsThreshold) {//Superata questa soglia, si azzerano i poteri di attacco e difesa salvati durante il gioco
                this.showLevel = this.level + 3;
                socket.emit("recharge", `@${this.avatar.channel} has no more saved attack and defense points; they will be reset again at level ${this.showLevel}`);
                console.log(this.avatar.channel + " non ha più punti di attacco e di difesa salvati");
                this.goToNextLevelCalls = 0;
                this.savedAttack = 0;
                this.savedDefence = 0;
            }
        }


    }

    changeLevelUpSpeedConsideringLevel() {
        if (this.maxLevelReached) return;
        this.levelUpSpeed = this.level * this.baseLevelUpSpeed;
        console.log(this.avatar.channel + " levelUpSpeed aggiornato: " + this.levelUpSpeed);
    }

    bet(points) {

        if (points == "attack") {
            if (this.maxLevelReached) return;

            if (this.level >= this.maxLevel && !this.maxLevelReached) {
                console.log(this.avatar.channel + " è arrivato al livello massimo, non può aumentare ancora");
                this.maxLevelReached = true;
                this.attack = 1.2;
                this.defence = 1.2;
                this.avatar.setLevelProgress(this.attack, this.defence);
                return;
            }
            if (this.attack == 0) {
                console.log(this.avatar.channel + " non può scommettere punti di attacco");
                return;
            }

            this.winBetProbability = Phaser.Math.Clamp(this.attack * 100, 1, 60);
            console.log(this.avatar.channel + " ha una probabilità di vincere la scommessa del " + this.winBetProbability + " %");
            if (Phaser.Math.Between(1, 100) <= this.winBetProbability) {
                this.winBet = true;
                console.log(this.avatar.channel + " ha vinto la scommessa ed è salito al livello " + this.level + " perdendo " + this.attack + " punti di attacco");
                this.goToNextLevel()
                this.attack = 0;
            }
            else {
                this.winBet = false;

                this.avatar.life -= 20;

                if (this.avatar.life <= 0) {
                    if (this.avatar.isGathering)
                        this.avatar.stopGathering();
                    if (this.avatar.isSeeding)
                        this.avatar.stopSeeding();
                    if (this.avatar.isAttacking)
                        this.avatar.stopAttack();
                    this.avatar.die();
                }

                const percentage = Phaser.Math.Clamp(this.avatar.life / 100, 0, 1);
                this.avatar.setLife(percentage);
                console.log(this.avatar.channel + " ha perso la scommessa e rimane al livello " + this.level + " perdendo 20 punti di vita life: " + this.avatar.life + " e " + this.attack + " punti di attacco");
                socket.emit("betForLevelDisclaimer", `@${this.avatar.channel} you lost the bet to level up and lost 20 health points — this will happen every time you lose a level-up bet`);
                this.attack = 0;
                this.avatar.setLevelProgress(this.getDefence(), this.getAttack());//Riduci la larghezza della barra del livello
            }
        }
        else {
            if (this.defence == 0) {
                console.log(this.avatar.channel + " non può scommettere punti di difesa");
                return;
            }

            if (this.avatar.life == 100 || this.avatar.life == this.currentLife) {
                console.log(this.avatar.channel + " non può scommettere per aumentare la vita perchè ha già piena vita o perchè ha già scommesso con lo stesso livello di vita");
                return;
            }

            this.winBetProbability = Phaser.Math.Clamp(this.defence * 100, 1, 60);
            console.log(this.avatar.channel + " ha una probabilità di vincere la scommessa del " + this.winBetProbability + " %");
            if (Phaser.Math.Between(1, 100) <= this.winBetProbability) {
                this.avatar.life = 100;
                const percentage = Phaser.Math.Clamp(this.avatar.life / 100, 0, 1);
                this.avatar.setLife(percentage);
                console.log(this.avatar.channel + " ha vinto la scommessa ed ha settato la vita al massimo " + this.avatar.life + " perdendo " + this.defence + " punti di difesa");
                this.defence = 0;
            }
            else {
                console.log(this.avatar.channel + " ha perso la scommessa e la sua vita rimane la stessa" + this.avatar.life + " perdendo " + this.defence + " punti di difesa");
                socket.emit("betForLifeDisclaimer", `@${this.avatar.channel} you will be able to bet again to regain full health once your health level has changed`);
                this.currentLife = this.avatar.life;//Salva il livello di vita di questa scommessa per impedire di scommettere la prossima volta se il livello di vita rimane questo
                this.defence = 0;
                this.avatar.setLevelProgress(this.getDefence(), this.getAttack());//Riduci la larghezza della barra del livello
            }

        }



    }

    betAgainstAvatar() {
        var i;
        var diff;

        if (this.maxLevelReached) return;

        if (this.level <= 2) {
            console.log(this.avatar.channel + " non può scommettere su nessun avatar, perchè non è almeno al livello 3");
            return;
        }
        for (i = 0; i < this.scene.avatars.length; i++) {
            if (this.scene.avatars[i].channel == this.avatar.channel) {
                console.log(this.avatar.channel + " non può scommettere contro se stesso");
                continue;
            }
            if (!this.scene.avatars[i].avatarLevel.someoneBet && !this.scene.avatars[i].avatarLevel.maxLevelReached) {//Se nessuno ha scommesso sull'altro avatar e l'altro avatar non ha raggiunto il livello massimo

                diff = this.scene.avatars[i].avatarLevel.level - this.level;
                console.log("diff: " + diff + " this.scene.avatars[i].avatarLevel.level " + this.scene.avatars[i].avatarLevel.level + " this.level " + this.level);
                this.scene.avatars[i].avatarLevel.someoneBet = true;
                switch (diff) {

                    case 10:
                        if (this.victory(i, 50, 3, 3, 2))
                            return;
                        break;
                    case 9:
                    case 8:
                        if (this.victory(i, 40, 2, 2, 2))
                            return;
                        break;
                    case 7:
                        if (this.victory(i, 30, 2, 2, 2))
                            return;
                        break;
                    case 6:
                        if (this.victory(i, 20, 3, 2, 2))
                            return;
                        break;
                    case 5:
                        if (this.victory(i, 10, 4, 3, 2))
                            return;
                        break;
                    default:
                        console.log(this.avatar.channel + " non può scommettere su " + this.scene.avatars[i].channel + " perchè non è almeno 5 livelli sopra di lui");
                        break;
                }
            }
            else {
                console.log(this.avatar.channel + " qualcuno ha già scommesso su " + this.scene.avatars[i].channel + " o quell'avatar ha raggiunto il livello massimo di gioco, cerca un altro su cui scommettere o attendi circa un minuto per scommettere su di lui");
            }


        }
        console.log(this.avatar.channel + " non ha potuto scommettere su nessun altro avatar, perchè nessuno è almeno 5 livelli sopra di lui");
    }

    victory(i, probability, avatarIncrement, otherAvatarDecrement, avatarDecrement) {

        if (Phaser.Math.Between(1, 100) <= probability) {
            this.level += avatarIncrement;
            this.avatar.setLevel(this.level);
            this.scene.avatars[i].avatarLevel.level -= otherAvatarDecrement;
            this.scene.avatars[i].setLevel(this.scene.avatars[i].avatarLevel.level);
            console.log(this.avatar.channel + " ha vinto la scommessa e sale di " + avatarIncrement + " livelli, mentre " + this.scene.avatars[i].channel + " scende di " + otherAvatarDecrement + " livelli probability: " + probability);
            this.changeLevelUpSpeedConsideringLevel();
            this.scene.avatars[i].avatarLevel.someoneBetTimer();
            return true;
        }
        else {
            this.level -= avatarDecrement;
            this.avatar.setLevel(this.level);
            console.log(this.avatar.channel + " ha perso la scommessa contro " + this.scene.avatars[i].channel + " e scende di " + avatarDecrement + " livelli probability: " + probability);
            this.changeLevelUpSpeedConsideringLevel();
            this.scene.avatars[i].avatarLevel.someoneBetTimer();
            return false;
        }
    }

    someoneBetTimer() {
        this.scene.time.delayedCall(60000, () => {
            console.log("Adesso si può ricominciare a scommettere su " + this.avatar.channel);
            this.someoneBet = false;
        });
    }


}
