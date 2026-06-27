<script setup lang="ts">
import { Shader, type MouseMode } from './Shader'

export interface ViewerProps {
  mouseMode?: MouseMode
  shader: string
  hue?: number
  saturation?: number
  brightness?: number
  speed?: number
  mouseSensitivity?: number
  damping?: number
  noise?: {
    opacity: number
    scale: number
  }
}

const props = withDefaults(defineProps<ViewerProps>(), {
  mouseMode: 'click',
  hue: 0,
  saturation: 1,
  brightness: 1,
  speed: 1,
  mouseSensitivity: 1,
  damping: 0
})

const container = useTemplateRef('container')
let _shader: Shader | undefined

const backgroundSize = computed(() => `${(props.noise?.scale ?? 0) * 200}%`)

onMounted(() => {
  if (!container.value) return
  _shader = new Shader(container.value, props.mouseMode)

  const success = _shader.setShader({ source: props.shader })
  if (!success) return console.error('Failed to compile shader')

  _shader.setHSV({ hue: props.hue, saturation: props.saturation, brightness: props.brightness })
  _shader.setSpeed(props.speed)
  _shader.setMouseSensitivity(props.mouseSensitivity)
  _shader.setMouseDamping(props.damping)
  _shader.play()
})

onUnmounted(_shader?.dispose)
watch(() => props.hue, (v) => {
  if (v !== undefined && _shader) _shader.setHue(v)
})
watch(() => props.saturation, (v) => {
  if (v !== undefined && _shader) _shader.setSaturation(v)
})
watch(() => props.brightness, (v) => {
  if (v !== undefined && _shader) _shader.setBrightness(v)
})
watch(() => props.speed, (v) => {
  if (v !== undefined && _shader) _shader.setSpeed(v)
})
watch(() => props.mouseSensitivity, (v) => {
  if (v !== undefined && _shader) _shader.setMouseSensitivity(v)
})
watch(() => props.damping, (v) => {
  if (v !== undefined && _shader) _shader.setMouseDamping(v)
})
</script>

<template>
  <div
    ref="container"
    class="shader isolate"
  >
    <div
      v-if="props.noise && props.noise.opacity > 0"
      :key="props.noise.toString()"
      class="absolute inset-0 z-10 bg-[url('noise.png')] bg-repeat"
      :style="{
        backgroundSize,
        backgroundPosition: 'center',
        opacity: props.noise.opacity / 2
      }"
    />
  </div>
</template>

<style scoped>
    .shader {
        display: block;
        position: relative;
        height: 100%;
        width: 100%;
    }
    .shader canvas {
        display: block;
        max-width: 100%;
        width: 100%;
        height: 100%;
        cursor: pointer;
        z-index: 0;
    }
</style>
