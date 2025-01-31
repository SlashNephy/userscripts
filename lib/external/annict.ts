import type { ErrorResponse } from './graphql'

export type AnnictFollowingStatusesResponse = {
  data: {
    viewer: {
      following: {
        nodes: {
          name: string
          username: string
          avatarUrl: string
          works: {
            nodes: {
              viewerStatusState: 'WATCHING' | 'WATCHED' | 'ON_HOLD' | 'STOP_WATCHING' | 'WANNA_WATCH' | 'NO_STATE'
            }[]
          }
        }[]
        pageInfo: {
          hasNextPage: boolean
          endCursor: string
        }
      }
    }
  }
}

async function fetchAnnictFollowingStatuses(
  workId: number,
  cursor: string | null,
  token: string
): Promise<AnnictFollowingStatusesResponse | ErrorResponse> {
  const response = await fetch('https://api.annict.com/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: `
        query ($workId: Int!, $cursor: String) {
          viewer {
            following(after: $cursor, first: 100) {
              nodes {
                name
                username
                avatarUrl
                works(annictIds: [$workId], first: 1) {
                  nodes {
                    viewerStatusState
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `,
      variables: {
        workId,
        cursor,
      },
    }),
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}

export async function fetchPaginatedAnnictFollowingStatuses(
  workId: number,
  token: string
): Promise<AnnictFollowingStatusesResponse[] | ErrorResponse> {
  const results: AnnictFollowingStatusesResponse[] = []
  let cursor: string | null = null

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const response: AnnictFollowingStatusesResponse | ErrorResponse = await fetchAnnictFollowingStatuses(
      workId,
      cursor,
      token
    )
    if ('errors' in response) {
      return response
    }

    results.push(response)

    if (!response.data.viewer.following.pageInfo.hasNextPage) {
      break
    }
    cursor = response.data.viewer.following.pageInfo.endCursor
  }

  return results
}
