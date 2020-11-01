import { range, debounce } from "lodash";
import anime from "animejs";

let canvas: HTMLCanvasElement = document.getElementById("c") as HTMLCanvasElement;
let ctx: CanvasRenderingContext2D = canvas.getContext("2d");

let colors = ["#ec7263", "#a75265", "#57385c"];

let backgroundColor = colors[0];

function* colorPicker() {
    while (true) {
        yield { oldColor: colors[0], newColor: colors[1] };
        yield { oldColor: colors[1], newColor: colors[2] };
        yield { oldColor: colors[2], newColor: colors[0] };
    }
}

let picker = colorPicker();
let noInteraction = true;

function getWaveRadius(x: number, y: number) {
    let dX = Math.max(x, window.innerWidth - x);
    let dY = Math.max(y, window.innerHeight - y);
    return Math.sqrt(dX ** 2 + dY ** 2);
}

function handlePointerDown(ev: PointerEvent) {
    ev.preventDefault();
    pop(ev.clientX, ev.clientY);
}

function pop(eventX: number, eventY: number) {
    noInteraction = false;

    let { oldColor, newColor } = picker.next().value as {
        oldColor: string;
        newColor: string;
    };

    let waveRadius = getWaveRadius(eventX, eventY);
    let waveDuration = Math.max(waveRadius / 2, 750);
    let rippleSize = Math.min(200, window.innerWidth * 0.4);

    let wave = new Circle(eventX, eventY, 0, newColor);
    anime({
        targets: wave,
        r: waveRadius,
        duration: waveDuration,
        easing: "easeOutQuart",
        update: function () {
            wave.draw();
        },
        complete: function () {
            backgroundColor = newColor;
            paintBackground();
        },
    });

    let ripple = new Circle(eventX, eventY, 0, oldColor);
    anime({
        targets: ripple,
        r: rippleSize,
        opacity: 0,
        easing: "easeOutExpo",
        duration: 900,
        update: function () {
            ripple.draw();
        },
    });

    let particles = new Array(32);
    for (let _ in range(30)) {
        particles.push(new Circle(eventX, eventY, anime.random(24, 36), oldColor));
    }
    anime({
        targets: particles,
        x: (particle: Circle) => particle.x + anime.random(-rippleSize, rippleSize),
        y: (particle: Circle) => particle.y + anime.random(-rippleSize * 1.15, rippleSize * 1.15),
        r: 0,
        easing: "easeOutExpo",
        duration: anime.random(1000, 1300),
        update: function () {
            particles.forEach((particle) => particle.draw());
        },
    });
}

class Circle {
    opacity: number;
    constructor(public x: number, public y: number, public r: number, public fill: string) {
        this.opacity = 1;
        this.draw();
    }

    draw() {
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fillStyle = this.fill;
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1;
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    paintBackground();
}

function paintBackground() {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}

function addListeners() {
    window.addEventListener("resize", debounce(resizeCanvas, 150));

    document.querySelector("#main-container").addEventListener("click", function (ev) {
        ev.stopPropagation();
    });

    canvas.addEventListener("pointerdown", handlePointerDown);
}

function startFauxClickTimer() {
    setTimeout(fauxClick, 750);
}

function fauxClick() {
    if (noInteraction) {
        let click = new PointerEvent("pointerdown", {
            clientX: window.innerWidth * 0.5,
            clientY: window.innerHeight * 0.2,
        });
        canvas.dispatchEvent(click);
    }
}

function init() {
    resizeCanvas();
    paintBackground();
    addListeners();
    startFauxClickTimer();
}

window.onload = init;
