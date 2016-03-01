//Manning's Easy Physics engine in 2D aka mepe2D.js
//           mepe2D.js

//add moveable object collisions
//fix camera switching
//add better terminal velocity
//make world start at zero

window.onkeydown = function(e) {
    if(e.keyCode == 32 && e.target == document.body) {
        e.preventDefault();
        return false;
    }
};

function World(x,y,width,height,gravity,static_objects,moveable_objects,terminalVel,fps) {
    this.gravity = gravity;
    this.platforms = static_objects;
    this.moveable_objects = moveable_objects;
    this.terminalVel = terminalVel;
    this.fps = fps;
    this.window = [0,0];
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.focuspointIndex = 0;
}

World.prototype.render = function (static_objects,moveable_objects,anchorX,anchorY,scrollable,ctx) {

    var self = this;

    if (scrollable) {

        var focusPoint = this.moveable_objects[this.focuspointIndex];
        this.window[0] = anchorX - focusPoint.x;
        this.window[1] = anchorY - focusPoint.y;

        static_objects.map(function (object) {

            ctx.fillRect(object.x+self.window[0],object.y + self.window[1],object.width,object.height);
        });

        moveable_objects.map(function (object) {

           ctx.fillStyle = object.color;

           if (object == this[self.focuspointIndex]) {
               ctx.fillRect(anchorX,anchorY,focusPoint.width,focusPoint.height);
           } else {
               ctx.fillRect(object.x+self.window[0],object.y + self.window[1],object.width,object.height);
           }

           ctx.fillStyle = "#000000"


        });

    } else {

        var objects = static_objects.concat(moveable_objects);

        objects.map(function(object) {
            ctx.fillRect(object.x,object.y,object.width,object.height);
        });

    }
};

World.prototype.getObjects = function (url) {

    var objects = {
        "static":[],
        "moveable":[]
    };

    var self = this;

    $.getJSON(url, function (data) {
        data.static.map(function (platform) {
            objects.static.push(new Static_Object(platform.x,platform.y,platform.width,platform.height,platform.friction,platform.elasticity));
        });

        data.moveable.map(function (obj) {
            objects.moveable.push(new Moveable_Object(obj.x,obj.y,obj.width,obj.height,obj.keyLeft,obj.keyRight,obj.keyUp,obj.jumpPower,obj.maxXAccel,self,obj.color));
        });
    });

    this.platforms = objects.static;
    this.moveable_objects = objects.moveable;

    document.addEventListener('keydown', function (event) {

        objects.moveable.map(function (object) {
            if (event.keyCode == object.leftKey) {
                object.leftInput = true;
            } else if (event.keyCode == object.rightKey) {
                object.rightInput = true;
            } else if (event.keyCode == object.upKey) {
                object.upInput = true;
                console.log("up");
            }
        });

        if (event.keyCode == 32) {

            if (self.focuspointIndex == self.moveable_objects.length - 1) {
                self.focuspointIndex = 0;
            } else {
                self.focuspointIndex ++;
            }
        }
    });

    document.addEventListener('keyup', function (event) {

        objects.moveable.map(function (object) {

            if (event.keyCode == object.leftKey) {
                object.leftInput = false;
            } else if (event.keyCode == object.rightKey) {
                object.rightInput = false;
            } else if (event.keyCode == object.upKey) {
                object.upInput = false;
            }

        });
    });
};

function Static_Object(x,y,width,height,friction,elasticity) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.friction = friction;
    this.elasticity = elasticity;
}

function Moveable_Object(x,y,width,height,leftKey,rightKey,upKey,jumpPower,maxXAccel,world,color) {
    this.x = x;
    this.y = y;
    this.xOrigin = x;
    this.yOrigin = y;
    this.width = width;
    this.height = height;
    this.xVel = 0;
    this.mass = 30;
    this.yVel = 0;
    this.xAccel = 0;
    this.yAccel = 0;
    this.deltaX = 0;
    this.deltaY = 0;
    this.jumpPower = -jumpPower;
    this.maxXAccel = maxXAccel;
    this.inAir = false;
    this.leftInput = false;
    this.rightInput = false;
    this.upInput = false;
    this.world = world;
    this.leftKey = leftKey;
    this.rightKey = rightKey;
    this.upKey = upKey;
    this.color = color;


}

Moveable_Object.prototype.adjustPosition = function () {

    this.deltaX = 0; //use this to make sure values are nothing. Just to be safe. :)
    this.deltaY = 0;

    this.yVel = this.yVel + (this.yAccel * (1000/this.world.fps)); //No friction applying to y velocity
    this.xVel = this.xVel + (this.xAccel * (1000/this.world.fps));

    this.deltaX = (this.xVel * (1000/this.world.fps));
    this.deltaY = (this.yVel * (1000/this.world.fps));

    var self = this; //use self bc in the map "this" refers to "world" object

    for (var i = 0; i < this.world.platforms.length; i++) {
        if (self.x + self.width + self.deltaX >= this.world.platforms[i].x && self.x + self.deltaX <= this.world.platforms[i].x + this.world.platforms[i].width) { //checks if in the x range of a platform in the next frame
            //checks if the delta y goes through the platform in next frame.

            if (self.yVel >= 0 && self.y + self.height <= this.world.platforms[i].y && this.world.platforms[i].y <= (self.y + self.height) + self.deltaY) {
                self.deltaY = this.world.platforms[i].y - (self.y + self.height);

                //subtacts position from top of platform to get a delat y that lands on top

                if (this.yVel >= this.world.gravity / this.jumpPower && this.yVel <= -(this.world.gravity / this.jumpPower)) { //adjusts last percent of bounce to be zero. scales.

                    this.yAccel -= this.world.gravity; //gravity + normal force which is also gravity. comes out to a zero acceleration.
                    this.yVel = 0;

                    this.inAir = false;

                } else {

                    this.yVel =  -(Math.sqrt((Math.pow(this.yVel,2) * this.world.platforms[i].elasticity))); //Vf^2 = (elasticity coeffiecient)*vi^2
                    this.inAir = true;

                }

                self.inAir = false;
                break;
            } else if (self.yVel < 0 && self.y > this.world.platforms[i].y + this.world.platforms[i].height && (self.y + self.deltaY) <= this.world.platforms[i].y + this.world.platforms[i].height) {

                self.deltaY = this.world.platforms[i].y + this.world.platforms[i].height - self.y;

                this.yVel = Math.sqrt((Math.pow(this.yVel,2) * this.world.platforms[i].elasticity));
                break;
            }
        } else {
            self.inAir = true;
        }
    }

    this.world.platforms.map(function (platform) {
        if (self.y + self.deltaY + self.height > platform.y && self.y + self.deltaY < platform.y + platform.height) {
            if (self.deltaX + self.x < platform.x + platform.width && self.deltaX + self.x + self.width > platform.x) {
                if (self.xVel < 0) {
                    self.deltaX = (platform.x + platform.width) - self.x;
                    self.xAccel = 0;

                } else if (self.xVel > 0) {
                    self.deltaX = platform.x - (self.x + self.width);
                    self.xAccel = 0;
                }
            }
        }
    });

    var focusedBody = self.world.moveable_objects[self.world.focuspointIndex];

    this.world.moveable_objects.map(function (object) {

        if (object !== focusedBody) {
            if (focusedBody.x + focusedBody.width + focusedBody.deltaX > object.x + object.deltaX
                && focusedBody.x + focusedBody.deltaX < object.x + object.width + object.deltaX) {

                console.log("focused body in x range of other moveable body");

                if (focusedBody.xVel > 0 || object.xVel < 0) {
                    console.log("collision on the right side of focused body");

                    var totalVel = Math.abs(focusedBody.xVel) + Math.abs(object.xVel);

                    var distance = object.x - focusedBody.x;

                    focusedBody.xAccel = 0;
                    object.xAccel = 0;


                    focusedBody.deltaX = (focusedBody.xVel / totalVel) * distance ;

                    object.deltaX = (object.xVel / totalVel) * distance + focusedBody.width;

                    if (object.xVel == 0) {
                        object.deltaX -= 20;
                        focusedBody.deltaX -= 20;
                    }

                    console.log(focusedBody.x + focusedBody.deltaX);
                    console.log(object.x+ object.deltaX);
                    console.log(object.deltaX)
                    console.log(distance);

                    //object.xVel = 0;
                    //focusedBody.xVel = 0;


                } else if (focusedBody.xVel < 0 || object.xVel > 0) {
                    console.log("collision on the left side of the focused body");


                }

            }
        }

    });


    if (this.x + this.deltaX < this.world.x || this.x + this.deltaX + this.width > this.world.x + this.world.width ||
        this.y + this.deltaY < this.world.y || this.y + this.deltaY + this.height > this.world.y + this.world.height) {

        this.x = this.xOrigin;
        this.y = this.yOrigin;
        this.deltaX = 0;
        this.deltaY = 0;
        this.xVel = 0;
        this.yVel = 0;
    } else {

        this.x += this.deltaX;
        this.y += this.deltaY;

    }
};

Moveable_Object.prototype.accelerateX = function () {

    var self = this;
    var friction = 0;
    this.world.platforms.map(function (platform) {
        if (self.x + self.width > platform.x && self.x < platform.x + platform.width && platform.y == self.y + self.height) {
            friction = platform.friction;
        }
    });


    var fricAccel = this.world.gravity * friction; //acceleration of friction. refer above for proof.

    if (fricAccel * 1.15 > this.maxXAccel && !this.inAir) { //if the max acceleration isnt greater than static friction(115% kinectic friction), dont move.
        this.xAccel = 0;
        this.xVel = 0;
    } else {

        if (this.leftInput) {
            if (this.inAir) { //in the air there is no friction.
                this.xAccel = -(this.maxXAccel)
            } else {
                this.xAccel = -(this.maxXAccel) + (fricAccel) ;
            }
        } else if (this.rightInput) {
            if (this.inAir) {
                this.xAccel = this.maxXAccel
            } else {
                this.xAccel = this.maxXAccel - (fricAccel) ;
            }
        } else {
            if (this.xVel > 0 && !this.inAir) {
                // Force(friction) = FRICTION*Force(Normal).
                // Force(normal) = mg
                // Force = ma
                // ma = FRICTION*mg
                // a = FRICTION*g

                this.xAccel = -fricAccel;

            } else if (this.xVel < 0 && !this.inAir) {

                this.xAccel = fricAccel;
            } else if (this.inAir) {
                this.xAccel = 0;
            }

            if (this.xVel > -(0.1 * (fricAccel) / this.maxXAccel) && this.xVel < (0.1 * (fricAccel) / this.maxXAccel)) { //adjusts last 1% error of friction.
                this.xVel = 0;
                this.xAccel = 0;

            }
        }
        if (this.xVel > this.world.terminalVel) {
            this.xVel = this.world.terminalVel;
            this.xAccel = 0;
        }

    }

    this.world.platforms.map(function (platform) {
        if (self.y + self.deltaY + self.height > platform.y && self.y + self.deltaY < platform.y + platform.height) {
            if (self.x + self.width == platform.x) {

                self.xVel =  -(Math.sqrt((Math.pow(self.xVel,2) * platform.elasticity)));

            } else if (self.x == platform.x + platform.width) {

                self.xVel = Math.sqrt((Math.pow(self.xVel,2) * platform.elasticity));

            }

        }
    });

    this.world.moveable_objects.map(function (object) {
       if (this[self.focuspointIndex] != object) {
           if (self.y + self.deltaY + self.height > object.y + object.deltaY && self.y + self.deltaY < object.y + object.height + object.deltaY) {
               if (self.x + self.width == object.x) {

                   console.log("hello")
                   self.xVel =  -(Math.sqrt((Math.pow(self.xVel,2) * 0.1)));
                  // object.xVel =  -(Math.sqrt((Math.pow(object.xVel,2) * 0.1)));

               } else if (self.x == object.x + object.width) {

                   self.xVel = Math.sqrt((Math.pow(self.xVel,2) * 0.1));
                   //object.xVel = Math.sqrt((Math.pow(object.xVel,2) * 0.1));

               }

           }
       }
    });

};

Moveable_Object.prototype.accelerateY = function () {

    var GRAVITY = this.world.gravity;

    if (this.upInput && !this.inAir) {
        if (-(this.jumpPower) > GRAVITY) { //jump power has to be greater than gravity to leave the ground
            this.inAir = true;
            this.yAccel = this.jumpPower;
        } else {
            this.inAir = false;
            this.yAccel = GRAVITY; //Force = ma
        }                          //Force(Gravity)  = mg
    } else {                //ma = mg --> a = g
        this.yAccel = GRAVITY;
    }

    if (this.yVel > this.world.terminalVel) {
        this.yVel = this.world.terminalVel;
        this.yAccel = 0;
    }

};




