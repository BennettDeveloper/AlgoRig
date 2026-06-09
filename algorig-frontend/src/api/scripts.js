import client from './client'

export const getScripts        = ()          => client.get('/scripts').then(r => r.data)
export const getPublicScripts  = ()          => client.get('/scripts/public').then(r => r.data)
export const getScript         = (id)        => client.get(`/scripts/${id}`).then(r => r.data)
export const createScript      = (data)      => client.post('/scripts', data).then(r => r.data)
export const updateScript      = (id, data)  => client.put(`/scripts/${id}`, data).then(r => r.data)
export const deleteScript      = (id)        => client.delete(`/scripts/${id}`).then(r => r.data)
export const validateScript    = (content)   => client.post('/scripts/validate', { content }).then(r => r.data)

export const getRepository     = (params)    => client.get('/repository', { params }).then(r => r.data)
export const getScriptDetail   = (id)        => client.get(`/repository/${id}`).then(r => r.data)
export const getScriptBattles  = (id, page = 0, size = 10) =>
  client.get(`/repository/${id}/battles`, { params: { page, size } }).then(r => r.data)

export const updateRequiredTiers = (scriptId, tiers) =>
  client.put(`/scripts/${scriptId}/required-tiers`, { tiers }).then(r => r.data)
