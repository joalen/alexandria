const _isStaff    = ref(false)
const _showLogin  = ref(false)
const _loginUser  = ref('')
const _loginPass  = ref('')
const _loginError = ref('')
const _currentUser = ref('READONLY')

export const useAuth = () => {
  return {
    isStaff:     _isStaff,
    showLogin:   _showLogin,
    loginUser:   _loginUser,
    loginPass:   _loginPass,
    loginError:  _loginError,
    currentUser: _currentUser,
    authenticate: async () => {
      _loginError.value = ''
      try {
        const res = await $fetch<{ user: string }>('/api/auth', {
          method: 'POST',
          body: { username: _loginUser.value, password: _loginPass.value },
        })
        _isStaff.value     = true
        _currentUser.value = res.user.toUpperCase()
        _showLogin.value   = false
        _loginUser.value   = ''
        _loginPass.value   = ''
      }
      catch { _loginError.value = 'INVALID CREDENTIALS' }
    },
    logout: async () => {
      await $fetch('/api/logout', { method: 'POST' })
      _isStaff.value     = false
      _currentUser.value = 'READONLY'
      _showLogin.value   = false
    }
  }
}