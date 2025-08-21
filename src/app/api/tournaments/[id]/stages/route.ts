import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request })
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId } = await params;

    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        stages: {
          include: {
            matches: {
              include: {
                team1: {
                  include: {
                    captain: true
                  }
                },
                team2: {
                  include: {
                    captain: true
                  }
                },
                winner: {
                  include: {
                    captain: true
                  }
                }
              },
              orderBy: { round: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        teams: {
          include: {
            captain: true
          }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Error fetching tournament stages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: request })
    
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tournamentId } = await params;

    // Check if user is tournament organizer
    const tournament = await db.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizerId: true }
    })

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.organizerId !== token.sub) {
      return NextResponse.json({ error: 'Only tournament organizer can create stages' }, { status: 403 })
    }

    const { name, type } = await request.json()

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Get the current highest order
    const lastStage = await db.tournamentStage.findFirst({
      where: { tournamentId: tournamentId },
      orderBy: { order: 'desc' }
    })

    const order = lastStage ? lastStage.order + 1 : 1

    // Create the stage
    const stage = await db.tournamentStage.create({
      data: {
        name,
        type,
        order,
        tournamentId: tournamentId
      }
    })

    // Get tournament teams for bracket generation
    const teams = await db.team.findMany({
      where: { tournamentId: tournamentId },
      include: {
        captain: true
      }
    })

    // Generate matches based on bracket type
    let matches = []
    
    switch (type) {
      case 'SINGLE_ELIMINATION':
        matches = generateSingleEliminationMatches(teams, stage.id)
        break
      case 'DOUBLE_ELIMINATION':
        matches = generateDoubleEliminationMatches(teams, stage.id)
        break
      case 'SWISS':
        matches = generateSwissMatches(teams, stage.id)
        break
      case 'GROUP_STAGE':
        matches = generateGroupStageMatches(teams, stage.id)
        break
      case 'LEADERBOARD':
        matches = generateLeaderboardMatches(teams, stage.id)
        break
      default:
        return NextResponse.json({ error: 'Invalid bracket type' }, { status: 400 })
    }

    // Create matches
    await db.match.createMany({
      data: matches
    })

    // Emit real-time update via Socket.IO
    const { getIO } = await import('@/lib/socket')
    const io = getIO()
    io.to(`tournament:${tournamentId}`).emit('stage-created', { stage, matches })

    return NextResponse.json({ stage, matches })
  } catch (error) {
    console.error('Error creating tournament stage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions to generate matches
function generateSingleEliminationMatches(teams: any[], stageId: string) {
  const matches = []
  const rounds = Math.ceil(Math.log2(teams.length))
  let roundNumber = 1
  
  // Generate first round matches
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    if (i + 1 < shuffledTeams.length) {
      matches.push({
        round: roundNumber,
        matchNumber: Math.floor(i/2) + 1,
        stageId,
        team1Id: shuffledTeams[i].id,
        team2Id: shuffledTeams[i + 1].id
      })
    }
  }

  // Generate subsequent rounds
  let teamsInRound = Math.floor(teams.length / 2)
  for (let r = 2; r <= rounds; r++) {
    for (let i = 0; i < teamsInRound; i++) {
      matches.push({
        round: r,
        matchNumber: i + 1,
        stageId
      })
    }
    teamsInRound = Math.floor(teamsInRound / 2)
  }

  return matches
}

function generateDoubleEliminationMatches(teams: any[], stageId: string) {
  // Simplified double elimination - just create winner bracket for now
  return generateSingleEliminationMatches(teams, stageId)
}

function generateSwissMatches(teams: any[], stageId: string) {
  const matches = []
  const rounds = Math.min(5, teams.length)
  
  for (let round = 1; round <= rounds; round++) {
    for (let i = 0; i < Math.floor(teams.length / 2); i++) {
      matches.push({
        round: round,
        matchNumber: i + 1,
        stageId
      })
    }
  }
  
  return matches
}

function generateGroupStageMatches(teams: any[], stageId: string) {
  const matches = []
  const groups = 4
  const teamsPerGroup = Math.ceil(teams.length / groups)
  
  for (let group = 0; group < groups; group++) {
    const groupTeams = teams.slice(group * teamsPerGroup, (group + 1) * teamsPerGroup)
    
    // Round robin within each group
    for (let i = 0; i < groupTeams.length; i++) {
      for (let j = i + 1; j < groupTeams.length; j++) {
        matches.push({
          round: 1,
          matchNumber: matches.length + 1,
          stageId,
          team1Id: groupTeams[i].id,
          team2Id: groupTeams[j].id
        })
      }
    }
  }
  
  return matches
}

function generateLeaderboardMatches(teams: any[], stageId: string) {
  return teams.map((team, index) => ({
    round: 1,
    matchNumber: index + 1,
    stageId,
    team1Id: team.id
  }))
}