"use client";

import React, { useEffect, useMemo, useRef } from "react";

const VERTEX_SHADER = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float u_time;
uniform float u_audio;
uniform vec2 u_resolution;

float getWave(vec2 uv, float phase, float speed, float amp, float freq, float width) {
  float envelope = exp(-pow(uv.x - 0.5, 2.0) / 0.05);
  float y = 0.5 + sin(uv.x * freq + u_time * speed + phase) * (amp * u_audio) * envelope;
  float dist = abs(uv.y - y);
  dist = max(dist, 0.001);
  return (width / dist) * envelope;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;

  vec3 c1 = vec3(0.25, 0.52, 0.95);
  vec3 c2 = vec3(0.91, 0.26, 0.21);
  vec3 c3 = vec3(0.98, 0.73, 0.01);
  vec3 c4 = vec3(0.20, 0.65, 0.32);

  float a = clamp(u_audio, 0.0, 1.5);

  float w1 = getWave(uv, 0.0, 2.5, 0.15, 8.0, 0.005) * a;
  float w2 = getWave(uv, 2.0, 3.1, 0.12, 10.0, 0.004) * a;
  float w3 = getWave(uv, 4.0, 1.8, 0.18, 6.0, 0.006) * a;
  float w4 = getWave(uv, 1.0, 2.8, 0.10, 12.0, 0.003) * a;

  vec3 finalColor = (w1 * c1) + (w2 * c2) + (w3 * c3) + (w4 * c4);

  float bottomGlow = (1.0 - uv.y) * 0.2 * a;
  finalColor += bottomGlow * c1;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

type AudioState = {
  ctx: AudioContext;
  analyser: AnalyserNode;
  dataArray: Uint8Array<ArrayBuffer>;
  source: MediaStreamAudioSourceNode;
};

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("[GeminiWebGLWave] shader compile error", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("[GeminiWebGLWave] program link error", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export default function GeminiWebGLWave({
  stream,
}: {
  stream: MediaStream | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<AudioState | null>(null);
  const rafRef = useRef<number>(0);

  const quadVertices = useMemo(
    () => new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    [],
  );

  useEffect(() => {
    if (!stream) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { premultipliedAlpha: false });
    if (!gl) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx: AudioContext = new AudioContextClass();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);
    const dataArray: Uint8Array<ArrayBuffer> = new Uint8Array(analyser.frequencyBinCount);
    audioRef.current = { ctx: audioCtx, analyser, dataArray, source };

    const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if (!program) {
      try {
        audioCtx.close();
      } catch {}
      audioRef.current = null;
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const posAttrib = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

    const utime = gl.getUniformLocation(program, "u_time");
    const uaudio = gl.getUniformLocation(program, "u_audio");
    const ures = gl.getUniformLocation(program, "u_resolution");

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const nextW = Math.max(1, Math.floor(rect.width * dpr));
      const nextH = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== nextW) canvas.width = nextW;
      if (canvas.height !== nextH) canvas.height = nextH;
    };

    resize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => resize());
      ro.observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }

    gl.clearColor(0, 0, 0, 0);

    const render = (t: number) => {
      const a = audioRef.current;
      if (!a) return;

      a.analyser.getByteFrequencyData(a.dataArray);
      const avg = a.dataArray.reduce((sum, v) => sum + v, 0) / a.dataArray.length;
      const volume = Math.min(1.25, Math.max(0, avg / 120));

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (utime) gl.uniform1f(utime, t * 0.001);
      if (uaudio) gl.uniform1f(uaudio, volume);
      if (ures) gl.uniform2f(ures, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);

      if (ro) {
        ro.disconnect();
      } else {
        window.removeEventListener("resize", resize);
      }

      try {
        gl.deleteBuffer(buffer);
      } catch {}

      try {
        gl.deleteProgram(program);
      } catch {}

      try {
        source.disconnect();
      } catch {}

      try {
        audioCtx.close();
      } catch {}

      audioRef.current = null;
    };
  }, [quadVertices, stream]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
