// Your program here
const Meyda = require("meyda");
const p5 = require("p5");
const dat = require("dat.gui");
let lastFeatures;
let oldChroma = [0,0,0,0,0,0,0,0,0,0,0,0];
let oldLoudness;
const drawingWidth = self.innerWidth;
const drawingHeight = self.innerHeight - document.getElementById("intro").offsetHeight;

console.log(drawingWidth);
console.log(drawingHeight);
const song = document.getElementById('raindrop');

song.addEventListener("play", function() {
    const context = new AudioContext();
    const source = context.createMediaElementSource(song);
    source.connect(context.destination);
    const analyzer = Meyda.createMeydaAnalyzer({
        audioContext: context,
        source: source,
        bufferSize: 2048,
        featureExtractors: ["spectralCentroid", "loudness", "chroma"],
        callback: (features) => {
            lastFeatures = features;
        }
    });
    analyzer.start();
}, true);
    
const raindropDrawing = (p) => {
    //adjust minimum and maximum wave speed
    const params = {
        minWaveSpeed: 1,
        maxWaveSpeed: 3
    };
    const gui = new dat.GUI();
    gui.add(params, "minWaveSpeed", 1, 3);
    gui.add(params, "maxWaveSpeed", 3, 8);
    
    let ripples = []
    let strk = 0, fll, key=0, speed=0;

    class Ripple {
        constructor(centerX, centerY, strk, fll, force, pitch) {
            this.x = centerX;
            this.y = centerY;
            this.diameter = 0.5;
            this.stroke=strk;
            this.fill=fll;
            this.strokeWeight=p.map(pitch, 40, 15, 0, 5);
            this.speed = this.acceleration=p.map(force, 27, 60, params.minWaveSpeed, params.maxWaveSpeed);
            this.birth = p.millis();
            this.fadeSpeed = 2;
        }
    
        display(){
            p.strokeWeight(this.strokeWeight);
            p.stroke(this.stroke);
            p.fill(this.fill);
            p.circle(this.x,this.y,this.diameter);
        }
        
        testCollision(b){ 
            //if this wave is inside another, speed up slightly
            //if the waves collide, they slow each other down 
            if(p.dist(this.x,this.y,b.x,b.y)< b.diameter/2){
                b.acceleration*=1.0002;
            }
            else if(p.dist(this.x,this.y,b.x,b.y) < this.diameter/2+b.diameter/2){ 
                this.acceleration *= 0.99;
                b.acceleration *= 0.99;
            }
            
        }	
    }
    p.setup = () => {
        p.createCanvas(drawingWidth, drawingHeight);
        fll = p.color(255,255,255,100);

    };

    p.draw = () => { 
        p.background(255);
            //draw all the raindrop ripples in the array
        for(let i=0; i<ripples.length; i++){
            //if a wave has faded out, remove it from the array and skip this iteration
            if(ripples[i].stroke>=255){ 
                ripples.splice(i,1);
                continue;
            }
            ripples[i].display();
            if(ripples[i].speed>0){
                ripples[i].speed -= ripples[i].acceleration*0.000005*(p.millis()-ripples[i].birth);
            }
             else {
                ripples[i].speed = 0;
            }
            ripples[i].diameter+=ripples[i].speed; //use the wave's speed value to increase diameter
            //console.log(speed);
            if(ripples[i].stroke<=255){ //while wave is visible, fade it out
                ripples[i].stroke+=ripples[i].fadeSpeed;
            }
            for(j=0;j<ripples.length;j++){ //check for collisions with any other wave
                if(i==j){
                    continue;
                }
                ripples[i].testCollision(ripples[j]);
            }
        }
        //if we're playing the mp3, make our raindrops
        let loudnessChange;
        let chromaChange = 0;
        if(lastFeatures){
            if (oldLoudness === undefined) oldLoudness = lastFeatures.loudness.total;
            loudnessChange = oldLoudness - lastFeatures.loudness.total;
            oldLoudness = lastFeatures.loudness.total;
            for(let i=0; i<oldChroma.length; i++){
                chromaChange += Math.abs(oldChroma[i] - lastFeatures.chroma[i]) 
                oldChroma[i] = lastFeatures.chroma[i];
            }
        }

        if(lastFeatures && !song.paused && (loudnessChange>0.9 || chromaChange > 1.5)){            
            //console.log(lastFeatures.loudness.total + ' ' + lastFeatures.spectralCentroid);
            let newX = p.random(0,p.width);
            let newY = p.random(0,p.height);
            let newDrop = new Ripple(newX,newY,strk,fll,lastFeatures.loudness.total, lastFeatures.spectralCentroid);
            ripples.push(newDrop);
            
        }
    }

    //play song if space bar is pressed
    p.keyPressed = () => {
        if(p.keyCode === 32){
            //console.log('space');
            if(!song.paused){
                song.pause();
            }
            else{
                song.play();
            }
        }
    };
};

//const myp5 = new p5(basicDrawing, "main");
const myp5 = new p5(raindropDrawing, "main");