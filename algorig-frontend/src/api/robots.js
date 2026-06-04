import client from './client'

export const getRobots       = ()    => client.get('/robots').then(r => r.data)
export const getRobotsByTier = (tier) => client.get(`/robots/tier/${tier}`).then(r => r.data)
export const getRobot        = (id)  => client.get(`/robots/${id}`).then(r => r.data)
