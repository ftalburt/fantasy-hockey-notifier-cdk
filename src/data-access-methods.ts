import request from "superagent";
import * as FantasyHockeyTypes from "./types";

/**
 * Gets a list of communication messages in the configured league/season
 * @param nhlSeason The year of the fantasy hockey season (i.e. `2020` for the 2019-2020 season)
 * @param fantasyLeagueId The ID of the ESPN fantasy hockey league
 * @param espnAuthCookie The value of the `espn_s2` cookie to be used for authentication
 * @param filter A filter to apply when pulling the list of messages
 */
export async function getMessages(
  nhlSeason: number,
  fantasyLeagueId: string,
  espnAuthCookie: string,
  filter?: FantasyHockeyTypes.MessageFilter
): Promise<FantasyHockeyTypes.MessageTopic[]> {
  let messageRequest = request
    .get(
      `https://fantasy.espn.com/apis/v3/games/fhl/seasons/${nhlSeason}/segments/0/leagues/${fantasyLeagueId}/communication/?view=kona_league_communication`
    )
    .set("Cookie", `espn_s2=${espnAuthCookie}`);
  if (filter) {
    messageRequest.set("x-fantasy-filter", JSON.stringify(filter));
  }
  let requestResult: FantasyHockeyTypes.CommunicationResponse = (
    await messageRequest
  ).body;

  console.log(`Messages API response: ${JSON.stringify(requestResult)}`);

  return requestResult.topics;
}

/**
 * Gets a list of active players in the configured season
 * @param nhlSeason The year of the fantasy hockey season (i.e. `2020` for the 2019-2020 season)
 * @param filter A filter to apply when pulling the list of players
 */
export async function getPlayers(
  nhlSeason: number,
  filter: FantasyHockeyTypes.PlayerFilter
): Promise<FantasyHockeyTypes.NhlPlayer[]> {
  return (
    await httpGetRequest(
      `https://fantasy.espn.com/apis/v3/games/fhl/seasons/${nhlSeason}/players?scoringPeriodId=0&view=players_wl`,
      { "x-fantasy-filter": JSON.stringify(filter) }
    )
  ).body;
}

/**
 * Gets Info on the fantasy hockey league
 * @param nhlSeason The year of the fantasy hockey season (i.e. `2020` for the 2019-2020 season)
 * @param fantasyLeagueId The ID of the ESPN fantasy hockey league
 * @param espnAuthCookie The value of the `espn_s2` cookie to be used for authentication
 */
export async function getLeagueData(
  nhlSeason: number,
  fantasyLeagueId: string,
  espnAuthCookie: string
): Promise<FantasyHockeyTypes.FhLeagueData> {
  return (
    await httpGetRequest(
      `https://fantasy.espn.com/apis/v3/games/fhl/seasons/${nhlSeason}/segments/0/leagues/${fantasyLeagueId}`,
      { Cookie: `espn_s2=${espnAuthCookie}` }
    )
  ).body;
}

/**
 * Gets info on the all NHL teams
 * @param nhlSeason The year of the fantasy hockey season (i.e. `2020` for the 2019-2020 season)
 * @param espnAuthCookie The value of the `espn_s2` cookie to be used for authentication
 */
export async function getNhlTeamData(
  nhlSeason: number,
  espnAuthCookie: string
): Promise<FantasyHockeyTypes.FantasyHockeyInfoResponse> {
  return (
    await httpGetRequest(
      `https://fantasy.espn.com/apis/v3/games/fhl/seasons/${nhlSeason}?view=proTeamSchedules_wl`,
      { Cookie: `espn_s2=${espnAuthCookie}` }
    )
  ).body;
}

/**
 * Makes an HTTP GET request
 * @param url The URL for the request
 * @param headers The headers to set for the request
 */
export async function httpGetRequest(
  url: string,
  headers?: { [key: string]: string }
): Promise<request.Response> {
  const httpRequest = request.get(url);
  if (headers) {
    for (const header of Object.keys(headers)) {
      httpRequest.set(header, headers[header]);
    }
  }
  return await httpRequest;
}

/**
 * Makes an HTTP POST request
 * @param url The URL for the request
 * @param headers The headers to set for the request
 * @param data The request body to send
 */
export async function httpPostRequest(
  url: string,
  headers?: { [key: string]: string },
  data?: string | object
): Promise<request.Response> {
  const httpRequest = request.post(url);
  if (headers) {
    for (const header of Object.keys(headers)) {
      httpRequest.set(header, headers[header]);
    }
  }
  httpRequest.send(data);
  return await httpRequest;
}
