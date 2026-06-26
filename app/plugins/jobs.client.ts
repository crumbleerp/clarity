export default defineNuxtPlugin(async () => {
  const { init } = useJobs()
  await init()
})
