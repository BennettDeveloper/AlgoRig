import client from './client'

export const getPublicProfile  = (username)                    => client.get(`/users/${username}`).then(r => r.data)
export const updateProfile     = (data)                        => client.put('/users/me', data).then(r => r.data)
export const getMyAchievements = ()                            => client.get('/users/me/achievements').then(r => r.data)
export const changePassword    = (currentPassword, newPassword) =>
  client.put('/users/me/password', { currentPassword, newPassword }).then(r => r.data)

export const uploadAvatar = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  // Pass Content-Type: undefined so Axios/browser auto-sets multipart boundary
  return client.post('/users/me/avatar', fd, {
    headers: { 'Content-Type': undefined },
  }).then(r => r.data)
}

export const pinScript   = (scriptId, order) =>
  client.post(`/scripts/${scriptId}/pin`, null, { params: { order } }).then(r => r.data)

export const unpinScript = (scriptId) =>
  client.delete(`/scripts/${scriptId}/pin`).then(r => r.data)
