import type { ErrorResponse } from './graphql'

export type AniListFollowingStatusesResponse = {
  data: {
    Page: {
      mediaList: {
        user: {
          name: string
          avatar: {
            large: string
          }
        }
        status: 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING'
        score: number
        progress: number
        media: {
          episodes: number
        }
        notes: string | null
      }[]
      pageInfo: {
        hasNextPage: boolean
      }
    }
  }
}

async function fetchAniListFollowingStatuses(
  mediaId: number,
  page: number,
  token: string
): Promise<AniListFollowingStatusesResponse | ErrorResponse> {
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    body: JSON.stringify({
      query: `
        query($mediaId: Int!, $page: Int!) {
          Page(page: $page, perPage: 50) {
            mediaList(type: ANIME, mediaId: $mediaId, isFollowing: true) {
              user {
                name
                avatar {
                  large
                }
              }
              status
              score
              progress
              media {
                episodes
              }
              notes
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `,
      variables: {
        mediaId,
        page,
      },
    }),
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}

export async function fetchPaginatedAniListFollowingStatuses(
  mediaId: number,
  token: string
): Promise<AniListFollowingStatusesResponse[] | ErrorResponse> {
  const results: AniListFollowingStatusesResponse[] = []
  let page = 1

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const response: AniListFollowingStatusesResponse | ErrorResponse = await fetchAniListFollowingStatuses(
      mediaId,
      page,
      token
    )
    if ('errors' in response) {
      return response
    }

    results.push(response)

    if (!response.data.Page.pageInfo.hasNextPage) {
      break
    }
    page++
  }

  return results
}
