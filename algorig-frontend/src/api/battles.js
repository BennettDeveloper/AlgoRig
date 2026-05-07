import client from './client'
export const startBattle = (payload) => client.post('/battles', payload)
export const getBattle = (id) => client.get(`/battles/${id}`)
