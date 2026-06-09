import client from './client'

function extractError(e) {
  throw new Error(e.response?.data?.error || e.message || 'Something went wrong')
}

export const getPublicRobots = () => client.get('/api/custom-robots/public').then(r => r.data)
export const createCustomRobot  = (data)     => client.post('/custom-robots', data).then(r => r.data).catch(extractError)
export const getMyRobots         = ()         => client.get('/custom-robots/mine').then(r => r.data).catch(extractError)
export const getMyRobotById      = (id)       => client.get(`/custom-robots/${id}`).then(r => r.data).catch(extractError)
export const updateCustomRobot   = (id, data) => client.put(`/custom-robots/${id}`, data).then(r => r.data).catch(extractError)
export const deleteCustomRobot   = (id)       => client.delete(`/custom-robots/${id}`).then(r => r.data).catch(extractError)
