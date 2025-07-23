export class Enemy {
  constructor(scene, gameWidth, gameHeight, x, y, damageFort, beDamaged, damage, hitAvatarProbability, spriteKey, animKey, attackFortFrom) {
    this.scene = scene;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.x = x;
    this.y = y;
    this.spriteKey = spriteKey;
    this.animKey = animKey;
    this.damage = damage;
    this.damageFort = damageFort;
    this.beDamaged = beDamaged;
    this.hitAvatarProbability = hitAvatarProbability;
    this.attackFortFrom = attackFortFrom;
    this.isDead = false;
    this.killedBy = null;
    this.isAttackingFort = false; //Implica che il nemico attacca il forte andando verso destra
    this.targetFortPos = null; //Posizione verso cui camminare quando torna al forte
    this.life = 100;
    this.attackingAvatars = [];
    this.maxAttackingAvatars = 5;



    const lifeBarWidth = 58;
    const lifeBarHeight = 5;
    const lifeBarY = -75; // appena sopra la testa

    this.enemy = scene.add.sprite(0, 0, spriteKey.idle).setOrigin(0.5, 1);

    const lifeBarBg = scene.add.graphics().fillStyle(0x444444).fillRect(-lifeBarWidth / 2, lifeBarY, lifeBarWidth, lifeBarHeight);
    this.lifeBar = scene.add.graphics().fillStyle(0xff0000).fillRect(-lifeBarWidth / 2, lifeBarY, lifeBarWidth, lifeBarHeight);

    this.container = scene.add.container(x, y, [
      this.enemy,
      lifeBarBg,
      this.lifeBar
    ]);
  }


  setDamage(waveCount) {
    this.damage += waveCount;
    console.log("Il danno che può impartire il nemico è aumentato di " + waveCount + " rispetto a quello di default");
  }

  getHitAvatarProbability() {
    return this.hitAvatarProbability;
  }

  playIdle() {
    this.enemy.play(this.animKey.idle);
  }

  async walk(targetX, targetY, speed) {
    return new Promise((resolve) => {
      const dx = targetX - this.container.x;
      const dy = targetY - this.container.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = (distance / speed) * 1000;
      console.log("Da walk prima del cambiamento attackFortFrom: " + this.attackFortFrom);
      console.log("Da walk dopo il cambiamento attackFortFrom: " + this.attackFortFrom);
      this.enemy.setFlipX(dx < 0);
      this.enemy.x = dx < 0 ? -2 : 0;

      const limitWidth = 35;
      const limitHeight = 60;

      targetX = Phaser.Math.Clamp(targetX, limitWidth, this.gameWidth - limitWidth);
      targetY = Phaser.Math.Clamp(targetY, limitHeight, this.gameHeight - limitHeight);
      this.targetFortPos = { x: targetX, y: targetY };//Da questo momento in poi, il nemico potrà sempre 
      // accedere a queste coordinate per poter attaccare nuovamente il forte


      console.log("Setta la sprite e l'animazione del cammino")
      this.enemy.setTexture(this.spriteKey.walk);
      this.enemy.play(this.animKey.walk, true);


      if (this.currentTween) {
        console.log("Da Enemy il currentTween era ancora attivo ed è stato rimosso");
        this.currentTween.remove();
        this.currentTween = null;
      }
      this.currentTween = this.scene.tweens.add({
        targets: this.container,
        x: targetX,
        y: targetY,
        duration,
        ease: 'Linear',
        onComplete: async () => {
          if (this.enemy) {
            console.log("Il nemico chiama attackFort");
            await this.attackFort();
            resolve();
          }

        }
      });
    });


  }

  arrivedToFort() {
    console.log("Valutato se il nemico è arrivato al forte targetFortPos.x: " + this.targetFortPos.x + " targetFortPos.y: " + this.targetFortPos.y + " nemico x: " + this.container.x + " nemico y: " + this.container.y);
    return this.targetFortPos.x == this.container.x && this.targetFortPos.y == this.container.y;
  }

  async attackAvatar() {
    return new Promise((resolve) => {
      console.log("Inizio dell'attacco all'avatar");

      if (this.currentTween) {
        this.currentTween.stop();
        this.currentTween = null;
      }

      if (this.attackAvatarEvent) {
        console.log("attackAvatarEvent era ancora attivo ed è stato rimosso");
        this.attackAvatarEvent.remove();
        this.attackAvatarEvent = null;
      }
      this.attackAvatarEvent = this.scene.time.addEvent({
        delay: 1000,
        loop: true,
        callback: async () => {
          if (this.attackAvatarEvent && (this.isDead || !this.attackingAvatars || (this.attackingAvatars && this.attackingAvatars.length === 0))) {
            this.isAttackingFort = true;
            this.attackAvatarEvent.remove();
            this.attackAvatarEvent = null;
            resolve();
            return;
          }

          if (!this.isDead && (this.enemy.anims && (!this.enemy.anims.isPlaying || this.enemy.anims.currentAnim.key !== this.animKey.attack))) {//Se non c'è già un'animazione di attacco attiva
            console.log("attackAvatarEvent il nemico attiva l'animazione dell'attacco, perchè non era attiva");
            this.enemy.play(this.animKey.attack);
            if (this.attackingAvatars && this.attackingAvatars.length > 0) {//L'avatar si volta nella direzione del primo avatar che lo attacca e continua ad attacare da lì
              console.log("attackAvatarEvent il nemico si gira verso il primo avatar che lo attacca");
              const avatar = this.attackingAvatars[0];
              this.enemy.setFlipX(avatar.container.x < this.container.x);
            }




          }




          this.attackingAvatars?.forEach(avatar => {
            console.log("Tra gli avatar che attaccano il nemico c'è " + avatar.channel);
            this.numberOfAvatars = this.attackingAvatars.length;
           

            if (Phaser.Math.Between(1, 100) <= this.hitAvatarProbability) {

              this.dividedDamage = this.damage / this.numberOfAvatars;
              console.log("Divided damage: " + this.dividedDamage + "damage: " + this.damage + " numberOfAvatars: " + this.numberOfAvatars);
              console.log(avatar.channel + " savedDefence: " + avatar.avatarLevel.getSavedDefence());
              avatar.takeDamage(
                this.dividedDamage - avatar.avatarLevel.getSavedDefence() - (avatar.avatarLevel.level / 10)
              );


            }
          });





        }
      });
    });



  }

  async attackFort() {
    if (!this.scene || this.isDead || !this.enemy) return;

    if (this.scene) {
      this.enemy.setTexture(this.spriteKey.attack);
      this.isAttackingFort = true;
    }

    if (this.scene && this.scene.woodenFort) {
      console.log("Il nemico chiama playAttack");
      await this.playAttack();
    }
  }

  async playAttack() {
    if (this.isDead || !this.isAttackingFort || !this.enemy || !this.scene || !this.scene.woodenFort) return;

    if (this.attackingAvatars && this.attackingAvatars.length > 0) {
      this.isAttackingFort = false;
      console.log("Da playAttack il nemico torna ad attacare l'avatar");
      await this.attackAvatar();
      return;
    }

    if (this.arrivedToFort()) {
      console.log("Da playAttack il nemico attiva l'animazione dell'attacco perchè è arrivato davanti al forte");
      this.enemy.play(this.animKey.attack);
    }

    return new Promise((resolve) => {
      this.enemy.once('animationcomplete', async () => {
        if (
          (this.attackingAvatars && this.attackingAvatars.length > 0) ||
          this.isDead ||
          !this.isAttackingFort ||
          !this.scene || (!this.scene && !this.scene.woodenFort)
        ) {
          console.log("Il nemico esce da playAttack");
          resolve();
          return;
        }

        if (this.arrivedToFort()) {
          console.log("Da playAttack il nemico è arrivato al forte e può danneggiarlo attackFortFrom: " + this.attackFortFrom);
          this.enemy.setFlipX(this.attackFortFrom);
          this.scene.woodenFort.takeDamage(this.damageFort);
        }

        if (!this.scene.woodenFort.isDestroyed) {
          //Chiama nuovamente `playAttack` in modo asincrono, se il forte non è distrutto e qualche avatar attacca il nemico
          await this.playAttack();
          resolve();
          return;
        } else {
          this.enemy.play(this.animKey.idle);
          resolve();
          return;
        }


      });
    });
  }




  hide() {
    this.container.setVisible(false);
  }

  show() {
    this.container.setVisible(true);
  }

  checkAttackStatus() {
    if (this.attackingAvatars.length === 0 && !this.isDead) {
      console.log("checkAttackStatus nessun avatar da attaccare, torno al forte");
      if (this.attackAvatarEvent) {
        console.log("checkAttackStatus attackAvatarEvent viene rimosso");
        this.attackAvatarEvent.remove();
        this.attackAvatarEvent = null;
      }


      if (this.enemy.anims) {
        console.log("checkAttackStatus ferma l'animazione di attacco prima di camminare verso il forte");
        this.enemy.anims.stop();
        this.enemy.setFrame(0);
      }


      if (this.enemy.texture.key !== this.spriteKey.walk) {
        console.log("checkAttackStatus cambia la texture del nemico in modalità camminata");
        this.enemy.setTexture(this.spriteKey.walk);
      }

      this.enemy.play(this.animKey.walk, true);
      this.goTo(this.targetFortPos.x, this.targetFortPos.y);
    }
  }

  die() {
    this.isDead = true;

    if (this.scene) {
      this.enemy.setTexture(this.spriteKey.die);
      this.enemy.play(this.animKey.die);

      this.enemy.once('animationcomplete', () => {
        if (this.scene) {
          this.targetFortPos = null;//Il nemico è morto, quindi non ha più bisogno di sapere verso dove andare per attaccare il forte
          if (this.attackingAvatars) {//Rimuovo il nemico da tutti gli avatar che lo hanno considerato da attaccare
            this.attackingAvatars.forEach(avatar => {
              if (avatar.lockedEnemy === this) {
                avatar.lockedEnemy = null;
              }
            });
          }
          this.attackingAvatars = null;//Viene eliminato il suo array degli avatar che lo attaccano


          this.remove();
        }


      });
    }

  }

  remove() {
    if (this.currentTween) {
      this.currentTween.remove();
      this.currentTween = null;
    }

    if (this.attackAvatarEvent) {
      this.attackAvatarEvent.remove();
      this.attackAvatarEvent = null;
    }

    this.scene.removeCharacter("enemies", this);
    this.container.destroy();
    this.scene = null;
  }


  setLife(percent) {
    const width = 58 * Phaser.Math.Clamp(percent, 0, 1);
    this.lifeBar.clear().fillStyle(0xff0000).fillRect(-29, -75, width, 5);
  }

  removeAvatar(avatar) {
    console.log("Da removeAvatar numero di avatar presenti in attackingAvatars " + this.attackingAvatars.length);
    const index = this.attackingAvatars.indexOf(avatar);
    if (index !== -1) {
      console.log("attackingAvatars remove " + avatar.channel);
      this.attackingAvatars.splice(index, 1);
    }

    this.checkAttackStatus();
  }



  takeDamage(avatar) {
    if (this.isDead) return;

    const damageAmount = this.beDamaged + avatar.avatarLevel.getSavedAttack() + (avatar.avatarLevel.level / 10);
    this.life -= damageAmount;

    console.log(`Il nemico ha preso un danno pari a ${damageAmount}, vita rimanente: ${this.life}`);

    const percentage = Phaser.Math.Clamp(this.life / 100, 0, 1);
    this.setLife(percentage);

    // Appena viene colpito, smette di attaccare il forte
    if (this.attackingAvatars && this.attackingAvatars.length > 0) {
      this.attackAvatar(); //Inizia/continua ad attaccare l'avatar
    }

    if (this.life <= 0 && !this.isDead) {
      this.isDead = true;
      this.killedBy = avatar.channel;
      console.log(`${this.killedBy} ha ucciso il nemico e gli viene conteggiato`);
      avatar.avatarLevel.addAnotherEnemyKilled();
      avatar.avatarLevel.goToNextLevel();
      this.die();
    }
  }



}

export class EnemyOne extends Enemy {
  constructor(scene, gameWidth, gameHeight, x, y, attackFortFrom) {

    super(scene, gameWidth, gameHeight, x, y, 2, 30, 10, 40, {
      idle: "enemyOneIdle",
      walk: "enemyOneWalk",
      attack: "enemyOneAttack",
      die: "enemyOneDying"
    }, {
      idle: "enemyOne-idle",
      walk: "enemyOne-walk",
      attack: "enemyOne-attack",
      die: "enemyOne-dying"
    }, attackFortFrom);
    this.speed = 20;
  }

  goTo(targetX, targetY) {
    this.walk(targetX, targetY, this.speed);
  }

}



export class EnemyTwo extends Enemy {
  constructor(scene, gameWidth, gameHeight, x, y, attackFortFrom) {

    super(scene, gameWidth, gameHeight, x, y, 4, 20, 10, 40, {
      idle: "enemyTwoIdle",
      walk: "enemyTwoWalk",
      attack: "enemyTwoAttack",
      die: "enemyTwoDying"
    }, {
      idle: "enemyTwo-idle",
      walk: "enemyTwo-walk",
      attack: "enemyTwo-attack",
      die: "enemyTwo-dying"
    }, attackFortFrom);
    this.speed = 30;
  }

  goTo(targetX, targetY) {
    this.walk(targetX, targetY, this.speed);
  }

}

export class EnemyThree extends Enemy {
  constructor(scene, gameWidth, gameHeight, x, y, attackFortFrom) {

    super(scene, gameWidth, gameHeight, x, y, 5, 10, 15, 50, {
      idle: "enemyThreeIdle",
      walk: "enemyThreeWalk",
      attack: "enemyThreeAttack",
      die: "enemyThreeDying"
    }, {
      idle: "enemyThree-idle",
      walk: "enemyThree-walk",
      attack: "enemyThree-attack",
      die: "enemyThree-dying"
    }, attackFortFrom);
    this.speed = 40;
  }
  goTo(targetX, targetY) {
    this.walk(targetX, targetY, this.speed);
  }
}

export class EnemyFour extends Enemy {
  constructor(scene, gameWidth, gameHeight, x, y, attackFortFrom) {

    super(scene, gameWidth, gameHeight, x, y, 10, 7, 15, 60, {
      idle: "enemyFourIdle",
      walk: "enemyFourWalk",
      attack: "enemyFourAttack",
      die: "enemyFourDying"
    }, {
      idle: "enemyFour-idle",
      walk: "enemyFour-walk",
      attack: "enemyFour-attack",
      die: "enemyFour-dying"
    }, attackFortFrom);
    this.speed = 45;
  }
  goTo(targetX, targetY) {
    this.walk(targetX, targetY, this.speed);
  }
}
