import client from './client'

export const getLeaderboardByWins    = (page = 0) =>
  client.get('/leaderboard/wins',    { params: { page, size: 50 } }).then(r => r.data)

export const getLeaderboardByWinRate = (page = 0) =>
  client.get('/leaderboard/winrate', { params: { page, size: 50 } }).then(r => r.data)

export const getLeaderboardByStreak  = (page = 0) =>
  client.get('/leaderboard/streak',  { params: { page, size: 50 } }).then(r => r.data)
