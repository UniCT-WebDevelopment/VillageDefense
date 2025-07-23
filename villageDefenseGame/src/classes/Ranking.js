export class Ranking {
    constructor(scene) {
        this.scene = scene;
        this.avatarsSorted = [];
        this.timeCicle = 36000;//Il corrispettivo in secondi di 10 ore di gioco
    }

    getWinner() {
       
        if (this.avatarsSortedFinal.length > 0) {
            console.log("Da Ranking getWinner il vincitore è " + this.avatarsSortedFinal[0]);
            return this.avatarsSorted[0];
        }
        else {
            console.log("Da Ranking getWinner tutti gli avatar sono morti, non vi è un vincitore");
            return null;
        }

    }

    sortAvatars() {
        if (this.scene.avatars.length > 0) {
            this.avatarsSorted = [...this.scene.avatars].sort((a, b) => (b.avatarLevel.getLevel() + b.avatarLevel.getEnemiesKilled() / 10 + (b.secondsElapsed / this.timeCicle) + b.avatarLevel.getDefence() + b.avatarLevel.getAttack() + (b.life/100)) - (a.avatarLevel.getLevel() + a.avatarLevel.getEnemiesKilled() / 10 + (a.secondsElapsed / this.timeCicle) + a.avatarLevel.getDefence() + a.avatarLevel.getAttack() + (a.life/100)));
            this.avatarsSortedFinal = [...this.avatarsSorted];

        }
        else {
            console.log("Da Ranking sortAvatars non ci sono avatars da ordinare");
        }
    }



    updateRanking() {
        this.sortAvatars();

        this.list = document.getElementById("rankingList");
        this.list.innerHTML = "";



        this.avatarsSorted.forEach((avatar, index) => {
            const formattedTime = this.formatTime(avatar.secondsElapsed);
            const li = document.createElement("li");
            if (avatar.winner) {
                li.textContent = `${index + 1}. 👑 ${avatar.channel} | Lvl: ${avatar.avatarLevel.level} | Kills: ${avatar.avatarLevel.totalEnemiesKilled} | Time: ${formattedTime}`;
            }
            else
                li.textContent = `${index + 1}. ${avatar.channel} | Lvl: ${avatar.avatarLevel.level} | Kills: ${avatar.avatarLevel.totalEnemiesKilled} | Time: ${formattedTime}`;
            this.list.appendChild(li);
        });
    }

    showAvatarsPodium() {
        console.log("Mostra il podio della classifica");

       
        const podiumBox = document.getElementById("podiumBox");
        const rankingBox = document.getElementById("rankingBox");
        rankingBox.style.visibility = "hidden";
        podiumBox.style.visibility = "visible";
        const podiumList = document.getElementById("podiumList");
        podiumList.innerHTML = "";

        if (this.avatarsSortedFinal.length > 2) {
            this.printPodium(3);
        }

        if (this.avatarsSortedFinal.length == 2) {
            this.printPodium(2);
        }

        if (this.avatarsSortedFinal.length == 1) {
            this.printPodium(1);
        }

        this.list = document.getElementById("rankingList");
        this.list.innerHTML = "";

        this.avatarsSortedFinal.forEach((avatar, index) => {
            const formattedTime = this.formatTime(avatar.secondsElapsed);
            const li = document.createElement("li");
            li.textContent = `${index + 1}. ${avatar.channel} | Lvl: ${avatar.avatarLevel.level} | Kills: ${avatar.avatarLevel.enemiesKilled} | Time: ${formattedTime}`;
            this.list.appendChild(li);
        });

    }

    printPodium(numberOfAvatars) {
        var i;
        for (i = 0; i < numberOfAvatars; i++) {
            const formattedTime = this.formatTime(this.avatarsSortedFinal[i].secondsElapsed);
            const li = document.createElement("li");
            if (i == 0) {
                li.textContent = `${i + 1}. 🥇 ${this.avatarsSortedFinal[i].channel} | Lvl: ${this.avatarsSortedFinal[i].avatarLevel.level} | Kills: ${this.avatarsSortedFinal[i].avatarLevel.totalEnemiesKilled} | Time: ${formattedTime}`;
            }

            else if (i == 1) {
                li.textContent = `${i + 1}. 🥈 ${this.avatarsSortedFinal[i].channel} | Lvl: ${this.avatarsSortedFinal[i].avatarLevel.level} | Kills: ${this.avatarsSortedFinal[i].avatarLevel.totalEnemiesKilled} | Time: ${formattedTime}`;
            }
            else {
                li.textContent = `${i + 1}. 🥉 ${this.avatarsSortedFinal[i].channel} | Lvl: ${this.avatarsSortedFinal[i].avatarLevel.level} | Kills: ${this.avatarsSortedFinal[i].avatarLevel.totalEnemiesKilled} | Time: ${formattedTime}`;
            }

            podiumList.appendChild(li);
        }
    }

    clearRanking() {
        this.list = document.getElementById("rankingList");
        this.list.innerHTML = "";
    }

    formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;


        const pad = (num) => String(num).padStart(2, '0');//Aggiunge lo zero davanti se il numero è inferiore a 10

        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }



}
