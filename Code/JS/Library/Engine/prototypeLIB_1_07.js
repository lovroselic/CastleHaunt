/*

Prototype and helpful functions library
as used by LS
version 1.07

changelog:
1.02.01: vector props forced to integer, for ScramblyX
1.03: added vector methods from CastleHunt/Princess
1.04: sum, average with reduce; MAX, MIN removed; RND in array prototypes
1.05: added rad to degrees converte
1.06:  Tile expanded for sprite sheets
1.07: removeRandom returns element, not array!
*/

(function() {
  function RND(start, end) {
    return Math.floor(Math.random() * (++end - start) + start);
  }

  function coinFlip() {
    var flip = RND(0, 1);
    if (flip) return true;
    return false;
  }
  function probable(x) {
    var flip = RND(0, 99);
    if (flip <= x) return true;
    return false;
  }
  window.RND = RND;
  window.coinFlip = coinFlip;
  window.probable = probable;
})();

// Converts from degrees to radians.
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
 
// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

CanvasRenderingContext2D.prototype.roundRect = function(
  x,
  y,
  width,
  height,
  radius,
  fill,
  stroke
) {
  var cornerRadius = {
    upperLeft: 0,
    upperRight: 0,
    lowerLeft: 0,
    lowerRight: 0
  };
  if (typeof stroke == "undefined") {
    stroke = true;
  }
  if (typeof radius === "object") {
    for (var side in radius) {
      cornerRadius[side] = radius[side];
    }
  }
  this.beginPath();
  this.moveTo(x + cornerRadius.upperLeft, y);
  this.lineTo(x + width - cornerRadius.upperRight, y);
  this.quadraticCurveTo(x + width, y, x + width, y + cornerRadius.upperRight);
  this.lineTo(x + width, y + height - cornerRadius.lowerRight);
  this.quadraticCurveTo(
    x + width,
    y + height,
    x + width - cornerRadius.lowerRight,
    y + height
  );
  this.lineTo(x + cornerRadius.lowerLeft, y + height);
  this.quadraticCurveTo(x, y + height, x, y + height - cornerRadius.lowerLeft);
  this.lineTo(x, y + cornerRadius.upperLeft);
  this.quadraticCurveTo(x, y, x + cornerRadius.upperLeft, y);
  this.closePath();
  if (stroke) {
    this.stroke();
  }
  if (fill) {
    this.fill();
  }
};

/* collection of prototypes LS */

Array.prototype.clear = function() {
  if (!this) return false;
  this.splice(0, this.length);
};

Array.prototype.swap = function(x, y) {
  var TMP = this[x];
  this[x] = this[y];
  this[y] = TMP;
  return this;
};

Array.prototype.shuffle = function() {
  var i = this.length,
    j;
  while (--i > 0) {
    j = RND(0, i);
    this.swap(i, j);
  }
  return this;
};

Array.prototype.sum = function() {
  return this.reduce((a, b) => a + b, 0);
};

Array.prototype.average = function() {
  return this.reduce((a, b) => a + b) / this.length;
};

Array.prototype.createPool = function(mx, N) {
  if (!this) return false;
  this.clear();
  var tempArray = [];
  for (var ix = 0; ix < mx; ix++) {
    tempArray[ix] = ix;
  }
  var top;
  for (var iy = 0; iy < N; iy++) {
    top = tempArray.length;
    var addx = RND(0, top - 1);
    this[iy] = tempArray[addx];
    tempArray.splice(addx, 1);
  }
  return this;
};

Array.prototype.compare = function(array) {
  if (!array) return false;
  var LN = this.length;
  if (LN !== array.length) return false;
  for (var x = 0; x < LN; x++) {
    if (this[x] !== array[x]) return false;
  }
  return true;
};

Array.prototype.remove = function(value) {
  var LN = this.length;
  for (var x = 0; x < LN; x++) {
    if (this[x] === value) {
      this.splice(x, 1);
      this.remove(value);
    }
  }
};

Array.prototype.chooseRandom = function() {
  var LN = this.length;
  var choose = RND(1, LN) - 1;
  return this[choose];
};

Array.prototype.removeRandom = function() {
  var LN = this.length;
  var choose = RND(1, LN) - 1;
  return this.splice(choose, 1)[0];
};

Array.prototype.clone = function() {
  return [].concat(this);
};

String.prototype.fill = function(stringy, howMany) {
  var s = "";
  for (;;) {
    if (howMany & 1) s += stringy;
    howMany >>= 1;
    if (howMany) stringy += stringy;
    else break;
  }
  return s;
};

String.prototype.padLeft = function(LN, fill) {
  var s = "".fill(fill, LN) + this;
  return s.substring(s.length - LN);
};

String.prototype.padRight = function(LN, fill) {
  var s = this + "".fill(fill, LN);
  return s.substring(0, LN);
};

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
};

String.prototype.trimSpace = function() {
  var temp = this.split(" ");
  temp.remove("");
  return temp.join(" ");
};

var Vector = function(x, y) {
  this.x = parseInt(x, 10);
  this.y = parseInt(y, 10);
};
var Pointer = function(x, y, vector) {
  this.x = x;
  this.y = y;
  this.vector = vector;
};
Vector.prototype.add = function(vector) {
  return new Vector(this.x + vector.x, this.y + vector.y);
};
Vector.prototype.mul = function(vector, num) {
  return new Vector(this.x + num * vector.x, this.y + num * vector.y);
};
Vector.prototype.distance = function(vector) {
  var distance = Math.abs(this.x - vector.x) + Math.abs(this.y - vector.y);
  return distance;
};
Vector.prototype.mirror = function() {
  var nx, ny;
  if (this.x) {
    nx = -this.x;
  } else {
    nx = 0;
  }
  if (this.y) {
    ny = -this.y;
  } else {
    ny = 0;
  }
  return new Vector(nx, ny);
};
Vector.prototype.direction = function(vector) {
  var dx = (vector.x - this.x) / Math.abs(this.x - vector.x) || 0;
  var dy = (vector.y - this.y) / Math.abs(this.y - vector.y) || 0;
  return new Vector(dx, dy);
};
Vector.prototype.cw = function() {
  var x = this.x;
  var y = this.y;
  var newX, newY;
  if (x !== 0) {
    newX = 0;
    newY = x * -1;
  } else {
    newX = y * -1;
    newY = 0;
  }
  var newVector = {
    x: newX,
    y: newY
  };
  return newVector;
};

var Square = function(x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
};
var UP = new Vector(0, -1);
var DOWN = new Vector(0, 1);
var LEFT = new Vector(-1, 0);
var RIGHT = new Vector(1, 0);

var Tile = function(id, x, y, type, name, sheet, no) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.type = type;
  this.name = name;
  this.sheet = sheet || false;
  this.no = no;
};
