import client from './client'
export const getScripts = () => client.get('/scripts')
export const getScript = (id) => client.get(`/scripts/${id}`)
