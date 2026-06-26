export function useCurrentDataset() {
  const runtimeConfig = useRuntimeConfig()
  const dataset = useState<string>('current-dataset', () => runtimeConfig.public.dataset || 'production')
  return dataset
}
