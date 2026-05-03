export const useSystemStats = () => {
    const recCount  = useState('recCount',  () => '—')
    const pgVersion = useState('pgVersion', () => '??')
    const connOk    = useState('connOk',    () => true)
    return { recCount, pgVersion, connOk }
  }