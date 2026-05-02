export const useTheme = () => {
    const theme = useState<'dark' | 'light'>('theme', () => 'dark')
    const toggle = () => { theme.value = theme.value === 'dark' ? 'light' : 'dark' }
    return { theme, toggle }
  }