/* ==========================================
   SISTEMA DE NAVEGACIÓN Y PUNTOS GLOBALES
   ========================================== */
let cocovirtualesTotales = 0;
const OBJETIVO_COCOVIRTUALES = 24;

const vistaMenu = document.getElementById('vista-menu');
const vistaDino = document.getElementById('vista-dino');
const vistaAhorcado = document.getElementById('vista-ahorcado');

const totalCocovirtualesElemento = document.getElementById('totalCocovirtuales');
const btnVerCarta = document.getElementById('btnVerCarta');

function actualizarPuntosGlobales(puntos) {
    cocovirtualesTotales += puntos;
    totalCocovirtualesElemento.textContent = cocovirtualesTotales;
    verificarDesbloqueoCarta();
}

function verificarDesbloqueoCarta() {
    if (cocovirtualesTotales >= OBJETIVO_COCOVIRTUALES) {
        btnVerCarta.classList.remove('oculto');
    }
}

function cambiarVista(vistaDestino) {
    [vistaMenu, vistaDino, vistaAhorcado].forEach(v => v.classList.remove('activa'));
    vistaDestino.classList.add('activa');
}

// Eventos de botones principales
document.getElementById('btnIrDino').addEventListener('click', () => {
    cambiarVista(vistaDino);
    reiniciarJuegoDino();
});

document.getElementById('btnIrAhorcado').addEventListener('click', () => {
    cambiarVista(vistaAhorcado);
    iniciarAhorcado();
});

document.querySelectorAll('[data-volver]').forEach(btn => {
    btn.addEventListener('click', () => {
        cancelarAnimacionDino();
        cambiarVista(vistaMenu);
    });
});

btnVerCarta.addEventListener('click', () => {
    window.location.href = './carta.html';
});


/* ==========================================
   1. JUEGO DEL DINOSAURIO
   ========================================== */
const canvas = document.getElementById('juegoCanvas');
const ctx = canvas.getContext('2d');

const puntajeElemento = document.getElementById('puntaje');
const puntajeMaximoElemento = document.getElementById('puntajeMaximo');
const reiniciarBtn = document.getElementById('reiniciarBtn');
const botonAyuda = document.getElementById('botonAyuda');

const anchoCanvas = canvas.width;
const altoCanvas = canvas.height;
const pisoY = altoCanvas - 30;

const dino = {
    x: 70,
    y: pisoY - 56,
    ancho: 56,
    alto: 56,
    velocidadSalto: 0,
    gravedad: 0.9,
    saltoFuerza: 16,
    enSalto: false,
};

const imagenDino = new Image();
let imagenDinoDisponible = false;
imagenDino.onload = () => { imagenDinoDisponible = true; };
imagenDino.src = './Adripixi.png';

const imagenMeta = new Image();
let imagenMetaDisponible = false;
imagenMeta.onload = () => { imagenMetaDisponible = true; };
imagenMeta.src = './cocosettepi.png';

const imagenObstaculoGrande = new Image();
let imagenObstaculoGrandeDisponible = false;
imagenObstaculoGrande.onload = () => { imagenObstaculoGrandeDisponible = true; };
imagenObstaculoGrande.src = './arbolito.png';

const imagenObstaculoPequeno = new Image();
let imagenObstaculoPequenoDisponible = false;
imagenObstaculoPequeno.onload = () => { imagenObstaculoPequenoDisponible = true; };
imagenObstaculoPequeno.src = './Florpequepixi.png';

const obstaculos = [];
const tiempoMinObstaculo = 90;
const tiempoMaxObstaculo = 180;
let siguienteObstaculo = tiempoMaxObstaculo;
const velocidadBase = 6;

let puntajeDino = 0;
let puntajeMaximoDino = 0;
let juegoDinoActivo = false;
let juegoDinoGanado = false;
let recompensaDinoReclamada = false;
let animacionId;
let velocidadJuego = velocidadBase;

function dibujarSuelo() {
    ctx.fillStyle = '#0D4F26FF';
    ctx.fillRect(0, pisoY, anchoCanvas, 4);
}

function dibujarDino() {
    if (imagenDinoDisponible && imagenDino.naturalWidth > 0) {
        ctx.drawImage(imagenDino, dino.x, dino.y, dino.ancho, dino.alto);
    } else {
        ctx.fillStyle = '#2d6cdf';
        ctx.fillRect(dino.x, dino.y, dino.ancho, dino.alto);
    }
}

function crearObstaculo() {
    const esPequenio = Math.random() > 0.6;
    const altura = esPequenio ? 30 : 45;
    const ancho = esPequenio ? 18 : 28;

    obstaculos.push({
        x: anchoCanvas + 20,
        y: pisoY - altura,
        ancho,
        alto: altura,
        imagen: esPequenio ? imagenObstaculoPequeno : imagenObstaculoGrande,
        imagenDisponible: esPequenio ? () => imagenObstaculoPequenoDisponible : () => imagenObstaculoGrandeDisponible,
        puntuacion: esPequenio ? 2 : 4,
        pasado: false,
    });

    siguienteObstaculo = tiempoMinObstaculo + Math.floor(Math.random() * (tiempoMaxObstaculo - tiempoMinObstaculo));
}

function dibujarObstaculos() {
    obstaculos.forEach(obstaculo => {
        if (obstaculo.imagenDisponible() && obstaculo.imagen.naturalWidth > 0) {
            ctx.drawImage(obstaculo.imagen, obstaculo.x, obstaculo.y, obstaculo.ancho, obstaculo.alto);
        } else {
            ctx.fillStyle = '#222';
            ctx.fillRect(obstaculo.x, obstaculo.y, obstaculo.ancho, obstaculo.alto);
        }
    });
}

function actualizarObstaculos() {
    obstaculos.forEach(obstaculo => {
        obstaculo.x -= velocidadJuego;

        if (!obstaculo.pasado && obstaculo.x + obstaculo.ancho < dino.x) {
            obstaculo.pasado = true;
            puntajeDino += obstaculo.puntuacion;
            puntajeElemento.textContent = puntajeDino;

            if (puntajeDino > puntajeMaximoDino) {
                puntajeMaximoDino = puntajeDino;
                puntajeMaximoElemento.textContent = puntajeMaximoDino;
            }
        }
    });

    while (obstaculos.length > 0 && obstaculos[0].x + obstaculos[0].ancho < 0) {
        obstaculos.shift();
    }
}

function detectarColisiones() {
    return obstaculos.some(obstaculo => {
        return (
            dino.x < obstaculo.x + obstaculo.ancho &&
            dino.x + dino.ancho > obstaculo.x &&
            dino.y < obstaculo.y + obstaculo.alto &&
            dino.y + dino.alto > obstaculo.y
        );
    });
}

function aplicarGravedad() {
    if (dino.enSalto) {
        dino.y -= dino.velocidadSalto;
        dino.velocidadSalto -= dino.gravedad;

        if (dino.y >= pisoY - dino.alto) {
            dino.y = pisoY - dino.alto;
            dino.enSalto = false;
            dino.velocidadSalto = 0;
        }
    }
}

function saltar() {
    if (!dino.enSalto && juegoDinoActivo) {
        dino.enSalto = true;
        dino.velocidadSalto = dino.saltoFuerza;
    }
}

function reiniciarJuegoDino() {
    puntajeDino = 0;
    velocidadJuego = velocidadBase;
    obstaculos.length = 0;
    siguienteObstaculo = tiempoMaxObstaculo;
    dino.y = pisoY - dino.alto;
    dino.enSalto = false;
    dino.velocidadSalto = 0;
    juegoDinoActivo = true;
    juegoDinoGanado = false;
    recompensaDinoReclamada = false;
    puntajeElemento.textContent = puntajeDino;
    animacionId = requestAnimationFrame(bucleJuegoDino);
}

function actualizarJuegoDino() {
    if (!juegoDinoActivo) return;

    if (puntajeDino >= 104) {
        juegoDinoActivo = false;
        juegoDinoGanado = true;
        if (!recompensaDinoReclamada) {
            actualizarPuntosGlobales(8); // Otorga 8 Cocovirtuales al ganar el Dino
            recompensaDinoReclamada = true;
        }
        cancelarAnimacionDino();
        return;
    }

    velocidadJuego = velocidadBase + Math.floor(puntajeDino / 20) * 0.25;
    siguienteObstaculo -= 1;
    if (siguienteObstaculo <= 0) crearObstaculo();

    actualizarObstaculos();
    aplicarGravedad();

    if (detectarColisiones()) {
        juegoDinoActivo = false;
        juegoDinoGanado = false;
        cancelarAnimacionDino();
    }
}

function cancelarAnimacionDino() {
    if (animacionId) cancelAnimationFrame(animacionId);
}

function dibujarEscenaDino() {
    ctx.clearRect(0, 0, anchoCanvas, altoCanvas);
    dibujarSuelo();
    dibujarDino();
    dibujarObstaculos();

    if (!juegoDinoActivo) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(0, 0, anchoCanvas, altoCanvas);

        if (juegoDinoGanado && imagenMetaDisponible) {
            ctx.drawImage(imagenMeta, anchoCanvas / 2 - 110, altoCanvas / 2 - 100, 220, 160);
        }

        ctx.fillStyle = '#111';
        ctx.font = '22px Arial';
        ctx.fillText(juegoDinoGanado ? '¡Ganaste! +8 Cocovirtuales' : '!Uy! Me golpeé antes de llegar a la meta', anchoCanvas / 2 - 170, altoCanvas / 2 + 80);
    }
}

function bucleJuegoDino() {
    actualizarJuegoDino();
    dibujarEscenaDino();
    if (juegoDinoActivo) animacionId = requestAnimationFrame(bucleJuegoDino);
}

document.addEventListener('keydown', e => {
    if (e.code === 'Space' && vistaDino.classList.contains('activa')) {
        e.preventDefault();
        saltar();
    }
});

canvas.addEventListener('mousedown', () => { if (vistaDino.classList.contains('activa')) saltar(); });
reiniciarBtn.addEventListener('click', reiniciarJuegoDino);
botonAyuda.addEventListener('click', () => alert('Barra espaciadora o clic para saltar.\nMeta: 104 puntos.'));


/* ==========================================
   2. JUEGO DEL AHORCADO
   ========================================== */
// Las 4 palabras fijas configuradas
const PALABRAS_AHORCADO = ["AMOR", "ANIVERSARIO", "COCOSETTE", "JUNTOS"];

let indicePalabraActual = 0;
let palabraActual = "";
let letrasAdivinadas = [];
let intentosRestantes = 6;
let palabrasResueltas = [false, false, false, false];

const palabraContenedor = document.getElementById('palabraContenedor');
const tecladoContenedor = document.getElementById('tecladoContenedor');
const intentosRestantesEl = document.getElementById('intentosRestantes');
const palabraNumeroEl = document.getElementById('palabraNumero');
const mensajeAhorcadoEl = document.getElementById('mensajeAhorcado');

function iniciarAhorcado() {
    indicePalabraActual = 0;
    palabrasResueltas = [false, false, false, false];
    cargarPalabraActual();
}

function cargarPalabraActual() {
    if (indicePalabraActual >= PALABRAS_AHORCADO.length) {
        mensajeAhorcadoEl.textContent = "¡Completaste todas las palabras!";
        tecladoContenedor.innerHTML = "";
        return;
    }

    palabraActual = PALABRAS_AHORCADO[indicePalabraActual];
    letrasAdivinadas = [];
    intentosRestantes = 6;
    
    palabraNumeroEl.textContent = indicePalabraActual + 1;
    intentosRestantesEl.textContent = intentosRestantes;
    mensajeAhorcadoEl.textContent = "";

    renderizarPalabra();
    crearTeclado();
}

function renderizarPalabra() {
    palabraContenedor.innerHTML = "";
    for (let letra of palabraActual) {
        const slot = document.createElement('div');
        slot.className = 'letra-slot';
        slot.textContent = letrasAdivinadas.includes(letra) ? letra : "";
        palabraContenedor.appendChild(slot);
    }
}

function crearTeclado() {
    tecladoContenedor.innerHTML = "";
    const abecedario = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split('');
    
    abecedario.forEach(letra => {
        const btn = document.createElement('button');
        btn.className = 'tecla';
        btn.textContent = letra;
        btn.addEventListener('click', () => manejarIntento(letra, btn));
        tecladoContenedor.appendChild(btn);
    });
}

function manejarIntento(letra, boton) {
    boton.disabled = true;

    if (palabraActual.includes(letra)) {
        letrasAdivinadas.push(letra);
        renderizarPalabra();
        
        // Verificar victoria en esta palabra
        const victoria = palabraActual.split('').every(l => letrasAdivinadas.includes(l));
        if (victoria) {
            mensajeAhorcadoEl.textContent = "¡Adivinaste! +4 Cocovirtuales";
            
            if (!palabrasResueltas[indicePalabraActual]) {
                palabrasResueltas[indicePalabraActual] = true;
                actualizarPuntosGlobales(4); // Suma 4 puntos por palabra
            }

            setTimeout(() => {
                indicePalabraActual++;
                cargarPalabraActual();
            }, 1800);
        }
    } else {
        intentosRestantes--;
        intentosRestantesEl.textContent = intentosRestantes;

        if (intentosRestantes <= 0) {
            mensajeAhorcadoEl.textContent = `¡Perdiste! La palabra era: ${palabraActual}`;
            deshabilitarTeclado();
        }
    }
}

function deshabilitarTeclado() {
    const teclas = tecladoContenedor.querySelectorAll('.tecla');
    teclas.forEach(t => t.disabled = true);
}

document.getElementById('reiniciarAhorcadoBtn').addEventListener('click', iniciarAhorcado);