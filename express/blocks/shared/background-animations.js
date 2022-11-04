/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { createTag } from '../../scripts/scripts.js';

// snowing animation code
const defaultOptions = {
  color: 'white',
  radius: [0.5, 3.0],
  speed: [1, 3],
  wind: [-1.5, 3.0],
};

function randomIntFromInterval(min, max) {
  return Math.random() * (max - min + 1) + min;
}

const SnowItem = (canvas, drawFn = null, opts) => {
  const options = { ...defaultOptions, ...opts };
  const {
    radius, speed, wind, color,
  } = options;
  const params = {
    color,
    x: randomIntFromInterval(0, canvas.offsetWidth),
    y: randomIntFromInterval(-canvas.offsetHeight, 0),
    radius: randomIntFromInterval(...radius),
    speed: randomIntFromInterval(...speed),
    wind: randomIntFromInterval(...wind),
    isResized: false,
  };
  const ctx = canvas.getContext('2d');

  const updateData = () => {
    params.x = randomIntFromInterval(0, canvas.offsetWidth);
    params.y = randomIntFromInterval(-canvas.offsetHeight, 0);
  };

  const resized = () => params.isResized;

  const drawDefault = () => {
    ctx.beginPath();
    ctx.arc(params.x, params.y, params.radius, 0, 2 * Math.PI);
    ctx.fillStyle = params.color;
    ctx.fill();
    ctx.closePath();
  };

  const draw = drawFn
    ? () => drawFn(ctx, params)
    : drawDefault;

  const translate = () => {
    params.y += params.speed;
    params.x += params.wind;
  };

  const onDown = () => {
    if (params.y < canvas.offsetHeight) return;

    if (params.isResized) {
      updateData();
      params.isResized = false;
    } else {
      params.y = 0;
      params.x = randomIntFromInterval(0, canvas.offsetWidth);
    }
  };

  const update = () => {
    translate();
    onDown();
  };

  return {
    update,
    resized,
    draw,
  };
};

const animFrame = window.requestAnimationFrame
  || window.mozRequestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.msRequestAnimationFrame;

const Snow = (canvas, count, options) => {
  const ctx = canvas.getContext('2d');
  const snowflakes = [];

  const add = (item) => snowflakes.push(item(canvas));

  const update = () => snowflakes.forEach((el) => el.update());

  const resize = () => {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = 300;

    snowflakes.forEach((el) => el.resized());
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    snowflakes.forEach((el) => el.draw());
  };

  const events = () => {
    window.addEventListener('resize', resize);
  };

  const loop = () => {
    draw();
    update();
    animFrame(loop);
  };

  const init = () => {
    for (let i = 0; i < count; i += 1) {
      add(() => SnowItem(canvas, null, options));
    }
    events();
    loop();
  };

  init(count);
  resize();

  return { add, resize };
};

// snowing animation code end

export default function addBackgroundAnimation($block, animationName) {
  const animations = {
    firework: function startFirework($section) {
      $section.classList.add('firework');

      ((() => {
        window.requestAnimationFrame = window.requestAnimationFrame
          || window.mozRequestAnimationFrame
          || window.webkitRequestAnimationFrame
          || window.msRequestAnimationFrame;
      })());

      const canvas = createTag('canvas', { class: 'firework-canvas' });
      $section.append(canvas);
      const ctx = canvas.getContext('2d');
      let width = 0;
      let height = 0;
      let vanishPointY = 0;
      let vanishPointX = 0;
      const focalLength = 300;
      let angleX = 180;
      let angleY = 180;
      let angleZ = 180;
      let angle = 0;
      let cycle = 0;
      const colors = {
        r: 255,
        g: 0,
        b: 0,
      };

      canvas.width = width;
      canvas.height = height;

      function Particle(x, y, z, color) {
        this.x = x;
        this.y = y;
        this.z = z;

        this.startX = this.x;
        this.startY = this.y;
        this.startZ = this.z;

        this.ox = this.x;
        this.oy = this.y;
        this.oz = this.z;

        this.xPos = 0;
        this.yPos = 0;

        this.vx = (Math.random() * 10) - 5;
        this.vy = (Math.random() * 10) - 5;
        this.vz = (Math.random() * 10) - 5;

        this.color = [color.r, color.g, color.b];
        this.render = true;

        this.size = Math.round(1 + Math.random());
      }

      // Controls the emitter
      function Emitter() {
        this.reset();
      }

      Emitter.prototype.reset = function resetEmitter() {
        const PART_NUM = 200;
        const x = (Math.random() * 400) - 200;
        const y = (Math.random() * 400) - 200;
        const z = (Math.random() * 800) - 200;

        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.particles = [];

        for (let i = 0; i < PART_NUM; i += 1) {
          this.particles.push(new Particle(this.x, this.y, this.z, {
            r: colors.r,
            g: colors.g,
            b: colors.b,
          }));
        }
      };

      Emitter.prototype.update = function undateEmitter() {
        const partLen = this.particles.length;

        angleY = (angle - vanishPointX) * 0.0001;
        angleX = (angle - vanishPointX) * 0.0001;

        this.particles.sort((a, b) => b.z - a.z);

        for (let i = 0; i < partLen; i += 1) {
          this.particles[i].update();
        }

        if (this.particles.length <= 0) {
          this.reset();
        }
      };

      Emitter.prototype.render = function renderEmitter(imgData) {
        const { data } = imgData;

        for (let i = 0; i < this.particles.length; i += 1) {
          const particle = this.particles[i];
          const dist = Math.sqrt((particle.x - particle.ox)
            * (particle.x - particle.ox)
            + (particle.y - particle.oy)
            * (particle.y - particle.oy)
            + (particle.z - particle.oz)
            * (particle.z - particle.oz));

          if (dist > 255) {
            particle.render = false;
            this.particles.splice(i, 1);
            this.particles.length -= 1;
          }

          if (particle.render
            && particle.xPos < width
            && particle.xPos > 0
            && particle.yPos > 0
            && particle.yPos < height) {
            for (let w = 0; w < particle.size; w += 1) {
              for (let h = 0; h < particle.size; h += 1) {
                if (particle.xPos + w < width
                  && particle.xPos + w > 0
                  && particle.yPos + h > 0
                  && particle.yPos + h < height) {
                  const pData = (Math.floor(particle.xPos + w)
                    + (Math.floor(particle.yPos + h) * width)) * 4;
                  [data[pData], data[pData + 1], data[pData + 2]] = particle.color;
                  data[pData + 3] = 255 - dist;
                }
              }
            }
          }
        }
      };

      // Controls the individual particles

      Particle.prototype.rotate = function rotateParticle() {
        const x = this.startX * Math.cos(angleZ) - this.startY * Math.sin(angleZ);
        const y = this.startY * Math.cos(angleZ) + this.startX * Math.sin(angleZ);

        this.x = x;
        this.y = y;
      };

      Particle.prototype.update = function updateParticle() {
        this.cosY = Math.cos(angleX);
        this.sinY = Math.sin(angleX);
        this.startX += this.vx;
        this.x = this.startX;
        this.startY += this.vy;
        this.y = this.startY;
        this.startZ -= this.vz;
        this.z = this.startZ;
        this.rotate();

        this.vy += 0.1;
        this.x += this.vx;
        this.y += this.vy;
        this.z -= this.vz;

        this.render = false;

        if (this.z > -focalLength) {
          const scale = focalLength / (focalLength + this.z);

          this.size = scale * 2;
          this.xPos = vanishPointX + this.x * scale;
          this.yPos = vanishPointY + this.y * scale;
          this.render = true;
        }
      };

      const emitters = [];

      function colorCycle() {
        cycle += 0.6;
        if (cycle > 100) {
          cycle = 0;
        }

        colors.r = Math.floor(Math.sin(0.3 * cycle) * 127 + 128);
        colors.g = Math.floor(Math.sin(0.3 * cycle + 2) * 127 + 128);
        colors.b = Math.floor(Math.sin(0.3 * cycle + 4) * 127 + 128);
      }

      function render() {
        colorCycle();
        // eslint-disable-next-line no-unused-vars
        angleY = Math.sin(angle += 0.01);
        angleX = Math.sin(angle);
        angleZ = Math.sin(angle);

        const imgData = ctx.createImageData(width, height);

        for (let e = 0; e < 30; e += 1) {
          emitters[e].update();
          emitters[e].render(imgData);
        }
        ctx.putImageData(imgData, 0, 0);
        requestAnimationFrame(render);
      }

      for (let e = 0; e < 30; e += 1) {
        colorCycle();
        emitters.push(new Emitter());
      }

      function adjustSize() {
        canvas.width = $section.offsetWidth;
        width = canvas.width;
        canvas.height = $section.offsetHeight;
        height = canvas.height;
        vanishPointY = height / 2;
        vanishPointX = width / 2;
      }

      setTimeout(() => {
        adjustSize();
        render();

        window.addEventListener('resize', adjustSize);
      }, 500);
    },
    snow: function startSnowing($section) {
      $section.classList.add('snowing');
      const $canvas = createTag('canvas', { class: 'snow-canvas' });
      $section.append($canvas);

      setTimeout(() => {
        Snow($canvas, 150, { color: 'white' });
      }, 1000);
    },
  };

  const $parent = $block.closest('.section');

  if ($parent) {
    animations[animationName]($parent);
  }
}
