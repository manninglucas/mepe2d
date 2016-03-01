$(document).ready(function () {

    var canvas = $('#canvas');
    var ctx = canvas[0].getContext('2d');
    ctx.fillStyle = '#000000';

    var FPS =60;

    var world = new World(-10000,-10000,20000,20000,0.001,[],[],1.2,FPS);

    world.getObjects("/data/level.json");


    function animate(time) {
        setTimeout(function () {

            ctx.clearRect(0, 0, 800, 800);

           // console.log(world.focuspointIndex);

            world.moveable_objects.map(function (player) {
                player.accelerateY();

                player.accelerateX();

                player.adjustPosition();

                //console.log(
                //        "x: "+player.x+
                //        " y:"+player.y+
                //        " xvel: "+player.xVel+
                //        " yvel: "+player.yVel+
                //        " xAccel: "+player.xAccel+
                //        " yAccel: "+player.yAccel
                //);
            });



            world.render(world.platforms,world.moveable_objects,400,400,true,ctx);

            window.requestAnimationFrame(animate);
        }, 1000 / FPS);
    }
    animate();

});