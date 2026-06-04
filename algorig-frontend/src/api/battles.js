import client from './client'

export const startBattle    = (payload) => client.post('/battles', payload).then(r => r.data)
export const getBattle      = (id)      => client.get(`/battles/${id}`).then(r => r.data)
export const getUserBattles = ()        => client.get('/battles').then(r => r.data)
