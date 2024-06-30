/*jshint browser: true */
/*jshint -W097 */
/*jshint -W117 */
/*jshint -W061 */
"use strict";
/////////////////////////////////////////////////
/*
 to do:
 
 known bugs: 
    
 */

const PRG = {
  VERSION: "1.01.00",
  NAME: "CastleHaunt",
  INIT: function () {
    //console.clear();
    console.log(
      PRG.NAME +
      " " +
      PRG.VERSION +
      " by Lovro Selic, (c) LaughingSkull 2018 on " +
      navigator.userAgent
    );
    $("#title").html(PRG.NAME);
    $("#version").html(
      PRG.NAME +
      " V" +
      PRG.VERSION +
      " by Lovro Selič <span style='font-size:14px'>&copy</span> LaughingSkull 2018"
    );
    $("input#toggleAbout").val("About " + PRG.NAME);
    $("#about fieldset legend").append(" " + PRG.NAME + " ");
    $("#load").append(
      "<canvas id ='preload_canvas' width='" +
      ENGINE.LOAD_W +
      "' height='" +
      ENGINE.LOAD_H +
      "'></canvas>"
    );
    ENGINE.ctx = $("#preload_canvas")[0].getContext("2d");
    ENGINE.init();
    ENGINE.checkIntersection = false;
    ENGINE.checkProximity = true;
    $(ENGINE.gameWindowId).width(ENGINE.gameWIDTH + 4);
    ENGINE.addBOX(
      "ROOM",
      ENGINE.mapWIDTH,
      INI.GAME_HEIGHT,
      12,
      [
        "background",
        "door",
        "floor",
        "container",
        "players",
        "items",
        "hero",
        "enemy",
        "bullets",
        "explosion",
        "text",
        "alert"
      ],
      "side"
    );
    ENGINE.addBOX(
      "STATUS",
      ENGINE.statusWIDTH,
      INI.GAME_HEIGHT,
      7,
      ["title", "status", "score", "inventory", "cursor", "health", "lives"],
      "side"
    );
  },
  setup: function () {
    $("#toggleHelp").click(function () {
      $("#help").toggle(400);
    });
    $("#toggleAbout").click(function () {
      $("#about").toggle(400);
    });
  },
  start: function () {
    console.log(PRG.NAME + " started.");
    $("#startGame").addClass("hidden");

    $(document).keypress(function (event) {
      if (event.which === 32 || event.which === 13) {
        event.preventDefault();
      }
    });

    PATTERN.create("wood1", Wood1);
    PATTERN.create("wood2", Wood2);
    PATTERN.create("pink1", Pink1);
    PATTERN.create("pink2", Pink2);
    PATTERN.create("orange1", Orange1);
    PATTERN.create("orange2", Orange2);
    PATTERN.create("blue1", Blue1);
    PATTERN.create("blue2", Blue2);
    PATTERN.create("yellow1", Yellow1);
    PATTERN.create("yellow2", Yellow2);
    PATTERN.create("silver1", Silver1);
    PATTERN.create("silver2", Silver2);
    PATTERN.create("green1", Green1);
    PATTERN.create("green2", Green2);
    PATTERN.create("gold1", Gold1);
    PATTERN.create("gold2", Gold2);
    PATTERN.create("red1", Red1);
    PATTERN.create("red2", Red2);

    for (var z in MATERIAL.material) {
      MATERIAL.create(z);
      PATTERN.create(z, MATERIAL.material[z].img);
    }

    GAME.start();
  }
};

var ENEMY = {
  pool: [],
  bulletPool: [],
  manipulate: function () {
    ENEMY.move();
    ENEMY.selfHit();
    ENEMY.bulletHit();
    ENEMY.collisionHero();
    ENEMY.draw();
  },
  drawEnemyBullets: function () {
    ENGINE.drawPool("bullets", ENEMY.bulletPool, SPRITE.bulletOrbRed);
  },
  bulletsMove: function () {
    ENGINE.bounceMove(ENEMY.bulletPool, ENGINE.roomData(HERO.room, HERO.actor));
  },
  bulletHit: function () {
    if (HERO.bulletPool.length === 0 || ENEMY.pool.length === 0) return;
    var hit;
    var HBP = HERO.bulletPool.length;
    for (var i = HBP - 1; i >= 0; i--) {
      var EP = ENEMY.pool.length;
      HERO.bulletPool[i].actorize();
      for (var j = EP - 1; j >= 0; j--) {
        hit = ENGINE.collision(HERO.bulletPool[i].actor, ENEMY.pool[j].actor);
        if (hit) {
          if (MAP["room" + HERO.room].items === undefined) {
            MAP["room" + HERO.room].items = [];
          }
          let waste = ENEMY.pool.splice(j, 1)[0]; //enemy removed
          GAME.score += waste.score;
          GAME.kills++;
          //drop item
          if (waste.inventory) {
            waste.inventory.x = waste.actor.x;
            waste.inventory.y = waste.actor.y;
            MAP["room" + HERO.room].items.push(waste.inventory);
            //delete inv in enemy class
            var EL = MAP["room" + HERO.room].enemy.length;
            for (var z = 0; z < EL; z++) {
              if (MAP["room" + HERO.room].enemy[z].inventory !== null)
                MAP["room" + HERO.room].enemy[z].inventory = null;
              //change boss to shooter ... single bullet
              if (MAP["room" + HERO.room].enemy[z].bullets > 1)
                MAP["room" + HERO.room].enemy[z].bullets = 1;
            }
          }

          EXPLOSIONS.pool.push(
            new AnimationSPRITE(waste.actor.x, waste.actor.y, "AlienExp", 6)
          );
          let wasteBullet = HERO.bulletPool.splice(i, 1)[0]; //bullet removed
          wasteBullet.type = "bullet";
          wasteBullet.subType = "yellow";
          MAP["room" + HERO.room].items.push(wasteBullet);
          HERO.repaintScene();
          HBP = HERO.bulletPool.length;
          break;
        }
      }
    }
    if (ENEMY.pool.length === 0) ENGINE.clearLayer("enemy");
  },
  selfHit: function () {
    var EP = ENEMY.pool.length;
    if (EP === 0) return;
    var hit;
    for (var i = 0; i < EP; i++) {
      for (var q = i + 1; q < EP; q++) {
        hit = ENGINE.collision(ENEMY.pool[i].actor, ENEMY.pool[q].actor);
        if (hit) {
          ENEMY.changeDir(i);
          ENEMY.pool[q].dir = ENEMY.pool[i].dir.mirror();
        }
      }
    }
  },
  shoot: function (i) {
    var dx = HERO.actor.x - ENEMY.pool[i].actor.x;
    var dy = HERO.actor.y - ENEMY.pool[i].actor.y;
    var fx = Math.round(dx / Math.abs(dy));
    var fy = Math.round(dy / Math.abs(dx));
    if (fx > 4) fx = 4;
    if (fx < -4) fx = -4;
    if (fy > 4) fy = 4;
    if (fy < -4) fy = -4;
    var speed = INI.BULLET_SPEED / Math.max(Math.abs(fx), Math.abs(fy));
    var dir = new Vector(fx, fy);
    var relDir = new Vector(fx / Math.abs(fx) || 0, fy / Math.abs(fy) || 0);
    const delta = 5;
    var x =
      ENEMY.pool[i].actor.x +
      relDir.x * Math.floor(ENEMY.pool[i].actor.width / 2) +
      delta;
    var y =
      ENEMY.pool[i].actor.y +
      relDir.y * Math.floor(ENEMY.pool[i].actor.height / 2) +
      delta;
    ENEMY.bulletPool.push(new Bullet(x, y, dir, BulletOrbRed, speed));
  },
  move: function () {
    var EP = ENEMY.pool.length;
    if (EP === 0) return;
    var stage;
    const OP = 0.05;
    for (var i = EP - 1; i >= 0; i--) {
      stage = ENEMY.pool[i].stage;
      switch (stage) {
        case "birth":
          ENEMY.pool[i].opacity += OP;
          if (ENEMY.pool[i].opacity >= 1) {
            ENEMY.pool[i].opacity = 1;
            ENEMY.pool[i].stage = "live";
          }
          break;
        case "live":
          var type = ENEMY.pool[i].type;
          switch (type) {
            case "rambler":
              move();
              checkPosition("changeDir");
              break;
            case "hunter":
              move();
              checkPosition("changeDirHunter");
              break;
            case "shooter":
              move();
              checkPosition("changeDirHunter");
              shoot();
              break;
            default:
              console.log("ENEMY.move() type  ERROR");
              break;
          }

          //continue
          ENEMY.pool[i].actor.orientation = ENEMY.pool[i].actor.getOrientation(
            ENEMY.pool[i].dir
          );
          ENEMY.pool[i].actor.animateMove(ENEMY.pool[i].actor.orientation);
          break;
        default:
          console.log("ENEMY.move() stage ERROR");
      }
    }

    function shoot() {
      if (!ENEMY.pool[i].canShoot) return;
      if (ENEMY.pool[i].trigger >= ENEMY.pool[i].trigPath) {
        ENEMY.shoot(i);
        ENEMY.pool[i].trigger = 0;
        ENEMY.pool[i].bullets--;
        if (ENEMY.pool[i].bullets <= 0) {
          ENEMY.pool[i].canShoot = false;
          //console.log("stops shooting");
        }
      }
    }

    function move() {
      ENEMY.pool[i].actor.x += ENEMY.pool[i].dir.x * ENEMY.pool[i].speed;
      ENEMY.pool[i].actor.y += ENEMY.pool[i].dir.y * ENEMY.pool[i].speed;
      ENEMY.pool[i].path +=
        Math.abs(ENEMY.pool[i].dir.x * ENEMY.pool[i].speed) +
        Math.abs(ENEMY.pool[i].dir.y * ENEMY.pool[i].speed);
      ENEMY.pool[i].trigger +=
        Math.abs(ENEMY.pool[i].dir.x * ENEMY.pool[i].speed) +
        Math.abs(ENEMY.pool[i].dir.y * ENEMY.pool[i].speed);
    }

    function checkPosition(func) {
      var data = ENGINE.roomData(HERO.room, HERO.actor);
      if (ENEMY.pool[i].actor.x < data.x0) {
        ENEMY.pool[i].actor.x = data.x0;
        ENEMY[func](i);
      } else if (ENEMY.pool[i].actor.x > data.x1) {
        ENEMY.pool[i].actor.x = data.x1;
        ENEMY[func](i);
      } else if (ENEMY.pool[i].actor.y > data.y1) {
        ENEMY.pool[i].actor.y = data.y1;
        ENEMY[func](i);
      } else if (ENEMY.pool[i].actor.y < data.y0) {
        ENEMY.pool[i].actor.y = data.y0;
        ENEMY[func](i);
      }
      if (ENEMY.pool[i].path > ENEMY.pool[i].maxpath) {
        ENEMY[func](i);
      }
    }
  },
  changeDirHunter: function (i) {
    ENEMY.pool[i].path = 0;
    var dx = HERO.actor.x - ENEMY.pool[i].actor.x;
    var dy = HERO.actor.y - ENEMY.pool[i].actor.y;
    var dir = new Vector(0, 0);
    if (Math.abs(dx) > Math.abs(dy)) {
      dir.x = dx / Math.abs(dx) || 0;
    } else {
      dir.y = dy / Math.abs(dy) || 0;
    }
    ENEMY.pool[i].dir = dir;
  },
  changeDir: function (i) {
    ENEMY.pool[i].path = 0;
    var dirPool = [UP, DOWN, LEFT, RIGHT];
    dirPool.remove(ENEMY.pool[i].dir);
    ENEMY.pool[i].dir = dirPool.chooseRandom();
  },
  draw: function () {
    var EP = ENEMY.pool.length;
    if (EP === 0) return;
    var CTX = LAYER.enemy;
    ENGINE.clearLayer("enemy");
    for (var i = 0; i < EP; i++) {
      CTX.save();
      CTX.globalAlpha = ENEMY.pool[i].opacity;
      ENGINE.spriteDraw(
        "enemy",
        ENEMY.pool[i].actor.x,
        ENEMY.pool[i].actor.y,
        ENEMY.pool[i].actor.sprite()
      );
      CTX.restore();
    }
  },
  collisionHero: function () {
    if (HERO.dead) return;
    var EP = ENEMY.pool.length;
    if (EP === 0) return;
    var hit;
    for (var i = 0; i < EP; i++) {
      hit = ENGINE.collision(ENEMY.pool[i].actor, HERO.actor);
      if (hit) {
        HERO.health--;
        TITLE.health();
        if (HERO.health <= 0) {
          HERO.death();
        }
      }
    }
  },
  pacify: function () {
    var EP = ENEMY.pool.length;
    if (EP === 0) return;
    for (var i = 0; i < EP; i++) {
      ENEMY.pool[i].type = "rambler";
    }
  }
};
var HERO = {
  bulletPool: [],
  death: function () {
    if (HERO.dead) return;
    //console.log("HERO death");
    GAME.lives--;
    TITLE.lives();
    HERO.dead = true;
    ENGINE.clearLayer("hero");
    EXPLOSIONS.pool.push(
      new AnimationSPRITE(HERO.actor.x, HERO.actor.y, "ShipExp", 8)
    );
    if (MAP["room" + HERO.room].furniture === undefined) {
      MAP["room" + HERO.room].furniture = [];
    }
    MAP["room" + HERO.room].furniture.push(
      new Furniture(
        Grave,
        HERO.actor.x - HERO.actor.width / 2,
        HERO.actor.y - HERO.actor.height / 2,
        "grave"
      )
    );
    HERO.repaintScene();
    ENEMY.bulletPool.clear();
    ENEMY.pacify();

    if (GAME.lives <= 0) {
      setTimeout(GAME.stop, INI.GAME_OVER);
    } else {
      setTimeout(HERO.revive, INI.HERO_REVIVE);
    }
  },
  revive: function () {
    //console.log("HERO revived");
    HERO.appearing = true;
    HERO.opacity = 0;
  },
  fadeIn: function () {
    if (HERO.appearing) {
      const delta = 0.05;
      var CTX = LAYER.hero;
      HERO.opacity += delta;
      ENGINE.clearLayer("hero");
      CTX.save();
      CTX.globalAlpha = HERO.opacity;
      ENGINE.spriteDraw(
        "hero",
        HERO.actor.x,
        HERO.actor.y,
        HERO.actor.sprite()
      );
      CTX.restore();
      if (HERO.opacity >= 1) {
        HERO.opacity = 1;
        HERO.appear();
      }
    }
  },
  appear: function () {
    //console.log("HERO appearing");
    HERO.dead = false;
    HERO.appearing = false;
    if (!ENGINE.alertMode) {
      $(document).keydown(GAME.checkKey);
      $(document).keyup(GAME.clearKey);
    }
    HERO.health = INI.HERO_HEALTH;
    TITLE.health();
    HERO.draw();
  },
  startInit: function () {
    HERO.spriteClass = "ghost1";
    HERO.inventory = []; //DEFAULT
    //HERO.inventory = [ITEMS.blueKey]; //DEBUG
    HERO.maxINV = 4;
    HERO.cursor = 0;
    HERO.asset = ASSET[HERO.spriteClass];
    HERO.speed = 10; //DEFAULT
    HERO.BULLET_SPEED = INI.BULLET_SPEED; //DEFAULT

    //DEBUG
    /*HERO.speed += 4;
    HERO.BULLET_SPEED += 4;
    MAP.room12.items.push(ITEMS.Crown);
    console.log("crown dropped in 12 for debug");*/
    //

    HERO.health = INI.HERO_HEALTH; //DEFAULT
    HERO.dead = true;
    HERO.appearing = true;
    HERO.bullets = 0; //DEFAULT
    HERO.maxBullets = 0; //DEFAULT
    //HERO.bullets = 5; //DEBUG
    //HERO.maxBullets = 5; //DEBUG

    HERO.room = 48; //START
    //HERO.room = 12; //DEBUG
    //HERO.room = 98; //DEBUG

    HERO.actor = new ACTOR(
      HERO.spriteClass,
      HERO.x,
      HERO.y,
      "front",
      HERO.asset
    );
    var data = ENGINE.roomData(HERO.room, HERO.actor);
    HERO.x = Math.floor((data.x1 + data.x0) / 2);
    HERO.y = data.y0;
    HERO.actor.x = HERO.x;
    HERO.actor.y = HERO.y;
    HERO.opacity = 0;
  },
  draw: function () {
    ENGINE.clearLayer("hero");
    if (HERO.dead) return;
    ENGINE.spriteDraw("hero", HERO.actor.x, HERO.actor.y, HERO.actor.sprite());
  },
  move: function (dir) {
    HERO.actor.x += dir.x * HERO.speed;
    HERO.actor.y += dir.y * HERO.speed;
    HERO.actor.orientation = HERO.actor.getOrientation(dir);
    HERO.actor.animateMove(HERO.actor.orientation);
    var data = ENGINE.roomData(HERO.room, HERO.actor);

    if (
      HERO.actor.x < data.x0 ||
      HERO.actor.x > data.x1 ||
      HERO.actor.y < data.y0 ||
      HERO.actor.y > data.y1
    ) {
      if (MAP["room" + HERO.room].type === "stair") {
        if (HERO.actor.x < data.x0) {
          HERO.actor.x = data.x0;
          return;
        } else if (HERO.actor.x > data.x1) {
          HERO.actor.x = data.x1;
          return;
        }
      }
      var collision = ENGINE.collisionToBackground(
        HERO.actor,
        LAYER.background
      );
      if (collision) {
        if (HERO.actor.x < data.x0) {
          HERO.actor.x = data.x0;
        } else if (HERO.actor.x > data.x1) {
          HERO.actor.x = data.x1;
        } else if (HERO.actor.y < data.y0) {
          HERO.actor.y = data.y0;
        } else if (HERO.actor.y > data.y1) {
          HERO.actor.y = data.y1;
        }
      } else {
        HERO.cleanUpRoom();
        var door = getDoor(data);
        HERO.room = MAP["room" + HERO.room][door + "Con"];
        //debug
        console.log("entered room", HERO.room, MAP["room" + HERO.room]);
        console.log("kill stat: ", GAME.kills);
        //debug end
        ENGINE.drawRoom(HERO.room);
        var newData = ENGINE.roomData(HERO.room, HERO.actor);
        newSpot(newData, door);
        ENGINE.birthEnemies(HERO.room);
      }
    }

    HERO.draw();

    function newSpot(data, door) {
      switch (door) {
        case "n":
          HERO.actor.x = Math.floor((data.x1 + data.x0) / 2);
          HERO.actor.y = data.y1;
          break;
        case "s":
          HERO.actor.x = Math.floor((data.x1 + data.x0) / 2);
          HERO.actor.y = data.y0;
          break;
        case "e":
          HERO.actor.y = Math.floor((data.y1 + data.y0) / 2);
          HERO.actor.x = data.x0;
          break;
        case "w":
          HERO.actor.y = Math.floor((data.y1 + data.y0) / 2);
          HERO.actor.x = data.x1;
          break;
      }
    }

    function getDoor(data) {
      var door;
      if (HERO.actor.x < data.x0) {
        door = "w";
      } else if (HERO.actor.x > data.x1) {
        door = "e";
      } else if (HERO.actor.y < data.y0) {
        door = "n";
      } else if (HERO.actor.y > data.y1) {
        door = "s";
      }
      return door;
    }
  },
  cleanUpRoom: function () {
    var BL = HERO.bulletPool.length;
    if (BL > 0) {
      if (MAP["room" + HERO.room].items === undefined) {
        MAP["room" + HERO.room].items = [];
      }
      for (var i = 0; i < BL; i++) {
        MAP["room" + HERO.room].items.push(
          new Item(
            HERO.bulletPool[i].x,
            HERO.bulletPool[i].y,
            "bullet",
            "yellow",
            BulletOrb
          )
        );
      }
      HERO.bulletPool.clear();
    }

    ENGINE.clearLayer("enemy");
    ENEMY.pool.clear();
    ENEMY.bulletPool.clear();
  },
  doorLocation: function () {
    var door = null;
    if (HERO.actor.x < ENGINE.mapWIDTH * 0.45) {
      door = "w";
    } else if (HERO.actor.x > ENGINE.mapWIDTH * 0.55) {
      door = "e";
    } else if (HERO.actor.y < INI.GAME_HEIGHT * 0.45) {
      door = "n";
    } else if (HERO.actor.y > INI.GAME_HEIGHT * 0.55) {
      door = "s";
    }
    return door;
  },
  openDoor: function () {
    var door = HERO.collisionClosedDoor();
    if (door !== null) {
      var doorType = MAP["room" + HERO.room][door + "door"];
      if (doorType === null) return; //
      doorType = doorType.replace(/\d+/g, "");
      console.log("door in question is", doorType);
      if (doorType === "open") return;
      if (doorType === "wood") {
        ENGINE.openDoor(door, HERO.room);
        HERO.repaintScene();
      } else {
        var key = HERO.inventory[HERO.cursor];
        if (key === undefined) return;
        if (key.type === "key") {
          if (key.subType === doorType) {
            GAME.score++;
            ENGINE.openDoor(door, HERO.room);
            HERO.repaintScene();
          }
        }
      }
    } else return;
  },
  useHealth: function (selected) {
    var health = 0;
    switch (selected.subType) {
      case "apple":
        health = INI.APPLE_HEALTH;
        break;
      case "pineapple":
        health = INI.PINEAPPLE_HEALTH;
        break;
      case "cake":
        health = INI.CAKE_HEALTH;
        break;
    }
    HERO.health += health;
    if (HERO.health > INI.HERO_HEALTH) HERO.health = INI.HERO_HEALTH;
    TITLE.health();
  },
  removeInv: function () {
    let remove = HERO.inventory.splice(HERO.cursor, 1);
    TITLE.inventory();
    HERO.cursor -= 1;
    if (HERO.cursor < 0) HERO.cursor = 0;
    TITLE.cursor();
  },
  dropItem: function () {
    if (HERO.inventory.length === 0) return;
    //use item
    var selected = HERO.inventory[HERO.cursor];
    //console.log("dropItem(): selected item", selected);
    if (selected.type === "health") {
      HERO.useHealth(selected);
      HERO.removeInv();
      return;
    } else if (selected.type === "weapon") {
      HERO.maxBullets++;
      if (HERO.maxBullets > INI.MAX_BULLETS) HERO.maxBullets = INI.MAX_BULLETS;
      HERO.removeInv();
      return;
    } else if (selected.type === "life") {
      GAME.lives++;
      TITLE.lives();
      HERO.removeInv();
      return;
    } else if (selected.type === "speed") {
      HERO.speed += 2;
      HERO.BULLET_SPEED += 2;
      console.log("BUFF speed", HERO.speed, INI.BULLET_SPEED);
      HERO.removeInv();
      return;
    } else if (selected.type === "bomb") {
      let EPL = ENEMY.pool.length;
      for (var p = EPL - 1; p >= 0; p--) {
        //kill all except boss
        if (ENEMY.pool[p].boss != "boss") {
          let waste = ENEMY.pool.splice(p, 1)[0]; //enemy removed
          GAME.score += waste.score;
          GAME.kills++;
          EXPLOSIONS.pool.push(
            new AnimationSPRITE(waste.actor.x, waste.actor.y, "AlienExp", 6)
          );
        }
      }
      //console.log("BOMB exploded");
      HERO.removeInv();
      ENGINE.clearLayer("enemy");
      return;
    } else if (selected.type === "time") {
      //console.log("slowing time");
      //enemies
      let EPL = ENEMY.pool.length;
      for (let e = 0; e < EPL; e++) {
        ENEMY.pool[e].speed = 1;
      }
      //bullets
      let EBP = ENEMY.bulletPool.length;
      for (let f = 0; f < EBP; f++) {
        console.log(ENEMY.bulletPool[f]);
        ENEMY.bulletPool[f].speed = 2;
      }
      HERO.removeInv();
      return;
    }

    // else interact
    if (MAP["room" + HERO.room].player) {
      let player = MAP["room" + HERO.room].player;
      player.actorize();
      let interaction = ENGINE.collision(HERO.actor, player.actor);
      if (interaction) {
        if (player.wishlist.includes(selected)) {
          let idx = player.wishlist.indexOf(selected);
          HERO.removeInv();
          player.wishlist.splice(idx, 1);
          GAME.score += 500;
          if (player.wishlist.length === 0) {
            if (selected.subType === "crown") {
              console.log("GAME WON. Shutting down ...");
              //END GAME
              GAME.end();
            } else {
              player.gift.actorize();
              HERO.inventory.push(player.gift);
              TITLE.inventory();
              MAP["room" + HERO.room].player = null;
              HERO.repaintScene();
            }
          }
        }
        return; //can not drop
      }
    }

    //continue dropping
    var isSpace = null;
    var items = MAP["room" + HERO.room].items;
    HERO.inventory[HERO.cursor].x = HERO.actor.x;
    HERO.inventory[HERO.cursor].y = HERO.actor.y;
    HERO.inventory[HERO.cursor].actorize();

    if (items === undefined || items.length === 0) {
      isSpace = true;
    } else {
      var hit;
      isSpace = true;
      for (var i = 0; i < items.length; i++) {
        items[i].actorize();
        hit = ENGINE.collision(
          HERO.inventory[HERO.cursor].actor,
          items[i].actor
        );
        if (hit) {
          isSpace = false;
          break;
        }
      }
    }

    if (!isSpace) {
      return;
    } else {
      if (items === undefined) {
        MAP["room" + HERO.room].items = [];
      }
      MAP["room" + HERO.room].items.push(
        HERO.inventory.splice(HERO.cursor, 1)[0]
      );
      HERO.repaintScene();
      TITLE.inventory();
      HERO.cursor -= 1;
      if (HERO.cursor < 0) HERO.cursor = 0;
      TITLE.cursor();
    }
  },
  openGate: function () {
    //console.log("GATE open");
    var furniture = MAP.room12.furniture;
    let idx = furniture.indexOf(FURNITURE.gate);
    let waste = furniture.splice(idx, 1);
    furniture.push(FURNITURE.openGate);
    ENGINE.openDoor("n", 12);
    MAP.room12.nCon = 48;
  },
  pickItem: function () {
    var items = MAP["room" + HERO.room].items;
    if (items === undefined) return;
    var IL = items.length;
    var hit;
    if (IL) {
      for (var i = 0; i < IL; i++) {
        items[i].actorize();
        hit = ENGINE.collision(HERO.actor, items[i].actor);
        if (hit) {
          //crown
          if (items[i].subType === "crown") {
            //console.log("crown picked, opening the gate");
            HERO.openGate();
            GAME.score += 1000;
            HERO.fuck();
          }
          //bullet?
          if (items[i].type === "bullet") {
            if (HERO.bullets < HERO.maxBullets) {
              //can pick up bullet
              let waste = items.splice(i, 1)[0];
              HERO.bullets++;
              break;
            } else return; //do nothing
          }
          //pick any other item
          if (HERO.inventory.length >= HERO.maxINV) return; //full inventory
          HERO.inventory.push(items.splice(i, 1)[0]);
          break;
        }
      }
    }

    HERO.repaintScene();
    TITLE.inventory();
    TITLE.cursor();
  },
  fuck: function () {
    //console.log("fucking up hero's return ,...");
    var RMS = [68, 47, 0, 1, 2, 9, 11, 12, 14, 21, 22, 23, 24];
    var candidates1 = [
      ENEMIES.Death1,
      ENEMIES.Death2,
      ENEMIES.Ugly,
      ENEMIES.Shooter
    ];
    var candidates2 = [
      ENEMIES.SkeletonHunter2,
      ENEMIES.SkeletonHunter3,
      ENEMIES.SkeletonHunter,
      ENEMIES.Zombiehunter,
      ENEMIES.DragonHunter2,
      ENEMIES.Skeleton5
    ];
    var RL = RMS.length;
    for (var x = 0; x < RL; x++) {
      if (MAP["room" + RMS[x]].enemy === undefined)
        MAP["room" + RMS[x]].enemy = [];
      MAP["room" + RMS[x]].enemy.push(candidates1.chooseRandom());
      MAP["room" + RMS[x]].enemy.push(candidates2.chooseRandom());
    }
  },
  search: function () {
    if (MAP["room" + HERO.room].container) {
      var cont = MAP["room" + HERO.room].container;
      cont.furniture.actorize();
      var hit = ENGINE.collision(HERO.actor, cont.furniture.actor);
      if (hit) {
        if (cont.item) {
          cont.item.actorize();
          if (HERO.inventory.length >= HERO.maxINV) {
            cont.item.x = HERO.actor.x;
            cont.item.y = HERO.actor.y;
            if (!MAP["room" + HERO.room].items)
              MAP["room" + HERO.room].items = [];
            MAP["room" + HERO.room].items.push(cont.item);
            cont.item = null;
            HERO.repaintScene();
          } else {
            HERO.inventory.push(cont.item);
            cont.item = null;
            TITLE.inventory();
            TITLE.cursor();
          }
        }
      }
    }
  },
  repaintScene: function () {
    ENGINE.drawRoom(HERO.room);
  },
  collisionClosedDoor: function () {
    var HCD = ENGINE.collisionToBackground(HERO.actor, LAYER.door);
    var door;
    if (HCD) {
      door = HERO.doorLocation();
    } else door = null;
    return door;
  },
  moveCursor: function (dir) {
    var IL = HERO.inventory.length;
    if (IL === 0) return;
    HERO.cursor += dir.x;
    if (HERO.cursor > IL - 1) {
      HERO.cursor = IL - 1;
    } else if (HERO.cursor < 0) {
      HERO.cursor = 0;
    }
    TITLE.cursor();
  },
  shoot: function () {
    if (HERO.bullets === 0) return;
    var dir = new Vector(0, 0);
    if (GAME.keymap[37]) dir.x = -1;
    if (GAME.keymap[38]) dir.y = -1;
    if (GAME.keymap[39]) dir.x = 1;
    if (GAME.keymap[40]) dir.y = 1;
    if (
      !GAME.keymap[37] &&
      !GAME.keymap[38] &&
      !GAME.keymap[39] &&
      !GAME.keymap[40]
    ) {
      switch (HERO.actor.orientation) {
        case "front":
          dir.y = 1;
          break;
        case "back":
          dir.y = -1;
          break;
        case "left":
          dir.x = -1;
          break;
        case "right":
          dir.x = 1;
          break;
      }
    }

    const delta = SPRITE.bulletOrb.width / 2 + 1;
    var bx = Math.round(
      HERO.actor.x + dir.x * HERO.actor.width / 2 + delta * dir.x
    );
    var by = Math.round(
      HERO.actor.y + dir.y * HERO.actor.height / 2 + delta * dir.y
    );
    HERO.bulletPool.push(new Bullet(bx, by, dir, BulletOrb, HERO.BULLET_SPEED));
    HERO.bullets--;
    TITLE.inventory();
  },
  drawHeroBullets: function () {
    ENGINE.drawPool("bullets", HERO.bulletPool, SPRITE.bulletOrb);
  },
  bulletsMove: function () {
    ENGINE.bounceMove(HERO.bulletPool, ENGINE.roomData(HERO.room, HERO.actor));
  },
  selfHit: function () {
    var PL = HERO.bulletPool.length;
    if (PL === 0) return;
    var hit;
    for (var i = PL - 1; i >= 0; i--) {
      HERO.bulletPool[i].actorize();
      hit = ENGINE.collision(HERO.actor, HERO.bulletPool[i].actor);
      if (hit) {
        let waste = HERO.bulletPool.splice(i, 1)[0];
        if (HERO.bullets < HERO.maxBullets) {
          //pick the bullet
          HERO.bullets++;
          TITLE.inventory();
        } else {
          //just drop the bullet
          if (MAP["room" + HERO.room].items === undefined) {
            MAP["room" + HERO.room].items = [];
          }
          MAP["room" + HERO.room].items.push(
            new Item(waste.x, waste.y, "bullet", "yellow", BulletOrb)
          );
          HERO.repaintScene();
        }
      }
    }
  },
  EBHit: function () {
    var BL = ENEMY.bulletPool.length;
    if (BL === 0) return;
    var hit;
    for (var i = BL - 1; i >= 0; i--) {
      ENEMY.bulletPool[i].actorize();
      hit = ENGINE.collision(HERO.actor, ENEMY.bulletPool[i].actor);
      if (hit) {
        HERO.health -= INI.BULLET_HEALTH_DECREASE;
        TITLE.health();
        if (HERO.health <= 0) {
          HERO.death();
          break;
        }
      }
    }
  }
};
var Bullet = function (x, y, dir, tile, speed) {
  this.x = x;
  this.y = y;
  this.dir = dir;
  this.tile = tile;
  this.speed = speed;

  this.actorize = function () {
    this.actor = new ACTOR(this.tile.name, this.x, this.y, null, null);
  };
};
var GAME = {
  keymap: {
    17: false, //CTRL
    37: false, //LEFT
    38: false, //UP
    39: false, //RIGHT
    40: false, //Down
    32: false, //SPACE
    13: false, //ENTER
    120: false, //F9
    65: false, //A
    68: false //D
  },
  continue: function () {
    //returns from alert
    ENGINE.birthEnemies(HERO.room);
    return;
  },
  start: function () {
    $("#bottom")[0].scrollIntoView();
    GAME.stopAnimation = false;
    GAME.score = 0;
    GAME.lives = 5; //DEFAULT
    //GAME.lives = 1; //DEBUG
    GAME.kills = 0; //STAT
    GAME.started = Date.now();
    GAME.frame = {};
    GAME.frame.start = null;
    ENGINE.INI.ANIMATION_INTERVAL = 50; //OVERRIDING default!
    //
    ENEMY.pool.clear();
    ENGINE.clearLayer("text");
    ENGINE.clearLayer("enemy");
    //
    HERO.startInit();
    GAME.firstFrameDraw();
    GAME.run();
  },
  firstFrameDraw: function () {
    ENGINE.drawRoom(HERO.room);
    TITLE.title();
    HERO.draw();
    TITLE.inventory();
    TITLE.lives();
  },
  frameDraw: function () { },
  stop: function () {
    console.log("GAME stopping ...");
    GAME.stopAnimation = true;
    $(document).off("keyup", GAME.clearKey);
    $(document).off("keydown", GAME.checkKey);
    GAME.over();
  },
  checkScore: function () {
    setTimeout(function () {
      SCORE.checkScore(GAME.score);
      SCORE.hiScore();
    }, 100);
  },
  over: function () {
    console.log("GAME OVER");
    ENGINE.clearLayer("text");
    GAME.ended = true;
    TITLE.gameOver();
    GAME.checkScore();
    GAME.prepareForRestart();
  },
  end: function () {
    console.log("GAME stopping ...");
    GAME.stopAnimation = true;
    $(document).off("keyup", GAME.clearKey);
    $(document).off("keydown", GAME.checkKey);
    ENGINE.clearLayer("text");
    GAME.ended = true;
    TITLE.end();
    GAME.checkScore();
    GAME.prepareForRestart();
  },
  prepareForRestart: function () {
    MAP = $.extend(true, {}, BACKUP_MAP);
    $("#startGame").removeClass("hidden");
  },
  bulletManipulation: function () {
    ENGINE.clearLayer("bullets");
    HERO.bulletsMove();
    HERO.selfHit();
    HERO.drawHeroBullets();
    ENEMY.bulletsMove();
    ENEMY.drawEnemyBullets();
    HERO.EBHit();
  },
  run: function () {
    if (!GAME.frame.start) GAME.frame.start = Date.now();
    var current = Date.now();
    GAME.frame.delta = current - GAME.frame.start;
    if (GAME.frame.delta > ENGINE.INI.ANIMATION_INTERVAL) {
      //do stuff
      HERO.fadeIn();
      GAME.respond();
      ENEMY.manipulate();
      GAME.bulletManipulation();
      EXPLOSIONS.draw();
      TITLE.score();
      //
      GAME.frame.start = null;
    }
    if (GAME.stopAnimation) {
      return;
    } else requestAnimationFrame(GAME.run);
  },
  respond: function () {
    if (HERO.dead) return;
    var map = GAME.keymap;
    if (map[17]) {
      HERO.shoot();
      GAME.keymap[17] = false;
    }
    if (map[32]) {
      HERO.openDoor();
      HERO.pickItem();
      HERO.search();
    }
    if (map[13]) {
      HERO.dropItem();
      GAME.keymap[13] = false;
    }
    if (map[37]) {
      HERO.move(LEFT);
      return;
    }
    if (map[39]) {
      HERO.move(RIGHT);
      return;
    }
    if (map[38]) {
      HERO.move(UP);
      return;
    }
    if (map[40]) {
      HERO.move(DOWN);
      return;
    }
    if (map[65]) {
      HERO.moveCursor(LEFT);
      GAME.keymap[65] = false;
      return;
    }
    if (map[68]) {
      HERO.moveCursor(RIGHT);
      GAME.keymap[68] = false;
      return;
    }
    return;
  },
  clearAllKeys: function () {
    for (var key in GAME.keymap) {
      GAME.keymap[key] = false;
    }
  },
  clearKey: function (e) {
    e = e || window.event;
    if (e.keyCode in GAME.keymap) {
      GAME.keymap[e.keyCode] = false;
    }
  },
  checkKey: function (e) {
    e = e || window.event;
    if (e.keyCode in GAME.keymap) {
      GAME.keymap[e.keyCode] = true;
      e.preventDefault();
    }
  }
};
var TITLE = {
  const: {},
  cursor: function () {
    var IL = HERO.inventory.length;
    var CTX = LAYER.cursor;
    ENGINE.clearLayer("cursor");
    if (IL === 0) return;
    const x = 11;
    const y = 201;
    const dx = 78;
    CTX.strokeStyle = "#ffd700";
    CTX.shadowColor = "yellow";
    CTX.shadowOffsetX = 1;
    CTX.shadowOffsetY = 1;
    CTX.shadowBlur = 1;
    CTX.beginPath();
    CTX.rect(x + HERO.cursor * dx, y, 54, 54);
    CTX.closePath();
    CTX.stroke();
  },
  health: function () {
    var CTX = LAYER.health;
    var TPX = LAYER.temp;
    ENGINE.clearLayer("health");
    const y = 330;
    const x = (ENGINE.statusWIDTH - SPRITE.GhostBig.width) / 2;
    TPX.canvas.width = SPRITE.GhostBig.width;
    TPX.canvas.height = SPRITE.GhostBig.height;
    ENGINE.clearLayer("temp");
    ENGINE.drawTile("temp", 0, 0, GhostBig);
    var data = TPX.getImageData(
      0,
      0,
      SPRITE.GhostBig.width,
      SPRITE.GhostBig.height
    );
    var DL = data.data.length;
    if (HERO.health < 0) HERO.health = 0;
    if (INI.HERO_HEALTH - HERO.health > 0) {
      for (var j = 3; j < DL; j += 4 * INI.HERO_HEALTH) {
        var idx = [];
        for (var i = j; i < j + 4 * INI.HERO_HEALTH; i += 4) {
          idx.push(i);
        }
        var remove = HERO.health;
        while (remove > 0) {
          let IL = idx.length - 1;
          let waste = idx.splice(RND(0, IL), 1);
          remove--;
        }
        var LEN = idx.length;
        for (var q = 0; q < LEN; q++) {
          data.data[idx[q]] = 0;
        }
      }
    }
    CTX.putImageData(data, x, y);
  },
  lives: function () {
    var CTX = LAYER.lives;
    ENGINE.clearLayer("lives");
    const y = 445;
    const pad = 4;
    const w = SPRITE.ghostLives.width;
    const width =
      SPRITE.ghostLives.width * (GAME.lives - 1) + pad * (GAME.lives - 2);
    var x = (ENGINE.statusWIDTH - width) / 2;

    for (var i = 0; i < GAME.lives - 1; i++) {
      ENGINE.drawTile("lives", x, y, GhostLives);
      x += w + pad;
    }
  },
  inventory: function () {
    var CTX = LAYER.inventory;
    ENGINE.clearLayer("inventory");
    var IL = HERO.inventory.length;
    const x = 39;
    const y = 230;
    const dx = 78;
    if (IL > 0) {
      for (var i = 0; i < IL; i++) {
        HERO.inventory[i].actorize(); //
        ENGINE.spriteDraw(
          "inventory",
          x + i * dx,
          y,
          SPRITE[HERO.inventory[i].actor.name]
        );
      }
    }

    const x2 = ENGINE.statusWIDTH / 2;
    const y2 = 276;
    const delta = 32;
    var toDo = HERO.maxBullets;
    var xS = [];
    var odd = toDo % 2;
    var n = 2;
    if (odd) {
      xS.push(x2);
      toDo--;
      while (toDo > 0) {
        xS.push(x2 + (n - 1) * delta / 2);
        xS.push(x2 - (n - 1) * delta / 2);
        toDo -= 2;
        n++;
      }
    } else {
      while (toDo > 0) {
        xS.push(x2 + (n - 1) * delta / 4);
        xS.push(x2 - (n - 1) * delta / 4);
        toDo -= 2;
        n += 2;
      }
    }
    xS.sort((a, b) => a - b);
    for (var q = 0; q < HERO.bullets; q++) {
      ENGINE.spriteDraw("inventory", xS[q], y2, SPRITE.bulletOrb);
    }
    for (var w = HERO.bullets; w < HERO.maxBullets; w++) {
      ENGINE.spriteDraw("inventory", xS[w], y2, SPRITE.bulletOrbEmpty);
    }
  },
  gameOver: function () {
    var CTX = LAYER.text;
    CTX.textAlign = "center";
    var x = ENGINE.mapWIDTH / 2;
    var y = INI.GAME_HEIGHT / 2;
    var fs = 64;
    CTX.font = fs + "px Garamond";
    var txt = CTX.measureText("GAME OVER");
    var gx = x - txt.width / 2;
    var gy = y - fs;
    var grad = CTX.createLinearGradient(gx, gy + 10, gx, gy + fs);
    grad.addColorStop("0", "#DDD");
    grad.addColorStop("0.1", "#EEE");
    grad.addColorStop("0.2", "#DDD");
    grad.addColorStop("0.3", "#CCC");
    grad.addColorStop("0.4", "#BBB");
    grad.addColorStop("0.5", "#AAA");
    grad.addColorStop("0.6", "#BBB");
    grad.addColorStop("0.7", "#CCC");
    grad.addColorStop("0.8", "#DDD");
    grad.addColorStop("0.9", "#EEE");
    grad.addColorStop("1", "#DDD");
    CTX.fillStyle = grad;
    CTX.shadowColor = "#FFF";
    CTX.shadowOffsetX = 2;
    CTX.shadowOffsetY = 2;
    CTX.shadowBlur = 3;
    CTX.fillText("GAME OVER", x, y);
  },
  end: function () {
    //console.log("Ending credits ...");
    var top = 80;
    var left = 150;
    var width = 350;
    var height = 200;
    var CTX = LAYER.alert;
    CTX.fillStyle = "#000";
    CTX.globalAlpha = 0.8;

    CTX.roundRect(
      top,
      left,
      width,
      height,
      {
        upperLeft: 15,
        upperRight: 15,
        lowerLeft: 15,
        lowerRight: 15
      },
      true,
      true
    );

    CTX.textAlign = "center";
    var fs = 20;
    CTX.font = fs + "px Garamond";
    var y = top + 100;
    var x = ENGINE.mapWIDTH / 2;
    CTX.fillStyle = "#CCC";
    CTX.shadowColor = "yellow";
    CTX.shadowOffsetX = 1;
    CTX.shadowOffsetY = 1;
    CTX.shadowBlur = 0;
    CTX.fillText("You have completed the CastleHaunt!", x, y);
    y += 2 * fs + 2;
    x = left - 16;
    fs = 18;
    CTX.font = fs + "px Garamond";
    CTX.textAlign = "left";
    var time = Math.round((Date.now() - GAME.started) / 1000);
    CTX.fillText("Time taken: " + TITLE.time(time), x, y);
    y += fs + 2;
    CTX.fillText("Creatures vanquished: " + GAME.kills, x, y);
    y += fs + 2;
    CTX.fillText("Base score: " + GAME.score, x, y);
    var rawTime = TITLE.timeRaw(time);
    var bonus = 100000;
    if (rawTime.h > 1) {
      bonus = 20000;
    } else if (rawTime.h === 1) {
      bonus -= rawTime.m * 1000;
    } else if (rawTime.h < 1) {
      bonus += (60 - rawTime.m) * 1000;
    }
    y += fs + 2;
    CTX.fillText("Completion bonus: " + bonus, x, y);
    y += fs + 2;
    CTX.fillText("------------------------------------", x, y);
    fs = 20;
    CTX.font = fs + "px Garamond";
    y += fs + 4;
    GAME.score += bonus;
    CTX.fillText("FINAL SCORE: " + GAME.score, x, y);
  },
  title: function () {
    var CTX = LAYER.title;
    CTX.fillStyle = "#000";
    CTX.roundRect(
      0,
      2,
      ENGINE.statusWIDTH,
      INI.GAME_HEIGHT - 4,
      {
        upperLeft: 15,
        upperRight: 15,
        lowerLeft: 15,
        lowerRight: 15
      },
      true,
      true
    );

    CTX.lineWidth = 1;
    CTX.textAlign = "center";
    var x = ENGINE.statusWIDTH / 2;
    CTX.fillStyle = "#DDD";
    var y = 57;
    CTX.font = "10px Consolas";
    CTX.fillText("Version " + PRG.VERSION, x, y);
    y = 70;
    CTX.fillText("by Lovro Selič", x, y);
    y = 40;
    var fs = 36;
    CTX.font = fs + "px Garamond";
    var txt = CTX.measureText(PRG.NAME);
    var gx = x - txt.width / 2;
    var gy = y - fs;
    var grad = CTX.createLinearGradient(gx, gy + 10, gx, gy + fs);
    grad.addColorStop("0", "#DDD");
    grad.addColorStop("0.1", "#EEE");
    grad.addColorStop("0.2", "#DDD");
    grad.addColorStop("0.3", "#CCC");
    grad.addColorStop("0.4", "#BBB");
    grad.addColorStop("0.5", "#AAA");
    grad.addColorStop("0.6", "#BBB");
    grad.addColorStop("0.7", "#CCC");
    grad.addColorStop("0.8", "#DDD");
    grad.addColorStop("0.9", "#EEE");
    grad.addColorStop("1", "#DDD");
    CTX.fillStyle = grad;
    CTX.shadowColor = "yellow";
    CTX.shadowOffsetX = 2;
    CTX.shadowOffsetY = 2;
    CTX.shadowBlur = 3;
    CTX.fillText(PRG.NAME, x, y);
    //
    y = 80;
    TITLE.drawDivider(y, divLineT);
    y = INI.GAME_HEIGHT - 32;
    TITLE.drawDivider(y, divLineT);
    //
    y = 146;
    TITLE.const.inv = y;
    x = ENGINE.statusWIDTH / 2 - Bag.x / 2;
    ENGINE.drawTile("title", x, y, Bag);
    TITLE.drawWaves(y + Bag.y / 3);
    TITLE.drawDivider(INI.GAME_HEIGHT / 2 + 36, divLineB);
  },
  drawWaves: function (y) {
    const x1 = Math.floor((ENGINE.statusWIDTH / 2 - wavyL.x) / 2);
    ENGINE.drawTile("title", x1, y, wavyL);
    const x2 = ENGINE.statusWIDTH - x1 - wavyR.x;
    ENGINE.drawTile("title", x2, y, wavyR);
  },
  drawDivider: function (y, whichTile) {
    var x = Math.round((ENGINE.statusWIDTH - whichTile.x) / 2);
    TITLE.const.left = x;
    ENGINE.drawTile("title", x, y, whichTile);
  },
  score: function () {
    var CTX = LAYER.score;
    const y = 130;
    const x = TITLE.const.left || 0;
    var fs = 16;
    CTX.clearRect(0, y - fs, ENGINE.statusWIDTH, fs + 2);
    CTX.font = fs + "px Garamond";
    var score = "SCORE: " + GAME.score.toString().padLeft(6, "0");
    var txt = CTX.measureText(score);
    var gx = x - txt.width / 2;
    var gy = y - fs;
    var grad = CTX.createLinearGradient(gx, gy + 10, gx, gy + fs);
    grad.addColorStop("0", "#DDD");
    grad.addColorStop("0.1", "#EEE");
    grad.addColorStop("0.2", "#DDD");
    grad.addColorStop("0.3", "#CCC");
    grad.addColorStop("0.4", "#BBB");
    grad.addColorStop("0.5", "#AAA");
    grad.addColorStop("0.6", "#BBB");
    grad.addColorStop("0.7", "#CCC");
    grad.addColorStop("0.8", "#DDD");
    grad.addColorStop("0.9", "#EEE");
    grad.addColorStop("1", "#DDD");
    CTX.fillStyle = grad;
    CTX.shadowColor = "yellow";
    CTX.shadowOffsetX = 1;
    CTX.shadowOffsetY = 1;
    CTX.shadowBlur = 1;
    CTX.fillText(score, x, y);
    const x2 = 176;
    var time = Math.round((Date.now() - GAME.started) / 1000);
    const displayTime = "TIME: " + TITLE.time(time);
    CTX.fillText(displayTime, x2, y);
  },
  time: function (time) {
    var hours = Math.floor(time / 3600)
      .toString()
      .padLeft(2, "0");
    var min = Math.floor((time % 3600) / 60)
      .toString()
      .padLeft(2, "0");
    var sec = Math.floor((time % 3600) % 60)
      .toString()
      .padLeft(2, "0");
    return hours + ":" + min + ":" + sec;
  },
  timeRaw: function (time) {
    var hours = Math.floor(time / 3600);
    var min = Math.floor((time % 3600) / 60);
    var sec = Math.floor((time % 3600) % 60);
    return { h: hours, m: min, s: sec };
  }
};

$(document).ready(function () {
  PRG.INIT();
  PRG.setup();
  ENGINE.preLoadImages();
  SCORE.init("SC", "CastleHaunt", 10, 10000);
  SCORE.loadHS();
  SCORE.hiScore();
  BACKUP_MAP = $.extend(true, {}, MAP);
});