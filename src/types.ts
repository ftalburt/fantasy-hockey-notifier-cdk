/**
 * NHL player details as retrieved from
 * https://fantasy.espn.com/apis/v3/games/fhl/seasons/SEASON/players?scoringPeriodId=0&view=players_wl
 */
export interface NhlPlayer {
  /** The ID of the player's default position */
  defaultPositionId: number;
  /** Human-readable info about the player's default position */
  defaultPosition?: PlayerPosition;
  /** Whether the player can be dropped in fantasy leagues honoring ESPN's undroppable player list */
  droppable: boolean;
  /** The IDs of the lineup slots this player is eligible for */
  eligibleSlots: number[];
  /** Human-readable info about positions this player is eligible for */
  eligiblePositions?: PlayerPosition[];
  /** Human-readable info about non-primary positions this player is eligible for */
  nonPrimaryEligiblePositions?: PlayerPosition[];
  /** The player's first name */
  firstName: string;
  /** The player's full name */
  fullName: string;
  /** The player's ESPN ID */
  id: number;
  /** The player's last name */
  lastName: string;
  /** Fantasy team ownership info for the player */
  ownership: NhlPlayerOwnership;
  /** The ESPN ID for the professional team this player plays for */
  proTeamId: number;
  /** The ESPN ID for the universe this player is a member of */
  universeId: number;
}

/** Fantasy team ownership info for a player */
export interface NhlPlayerOwnership {
  /** The percent of ESPN fantasy hockey leagues where the player is owned */
  percentOwned: number;
}

/** Details about a player's position */
export interface PlayerPosition {
  /** The abbreviation for the position */
  abbrev: string;
  /** The full name for the position */
  name: string;
}

/**
 * ESPN fantasy hockey league communication events as retrieved from
 * https://fantasy.espn.com/apis/v3/games/fhl/seasons/SEASON/segments/0/leagues/LEAGUE_ID/communication/?view=kona_league_communication
 */
export interface CommunicationResponse {
  /** A list of communication topics */
  topics: MessageTopic[];
}

/**
 * A transactional event in the ESPN fantasy hockey league made up of one or more sub-events
 *
 * For example, a trade is represented as one MessageTopic, but individual Messages for each player that was traded
 */
export interface MessageTopic {
  /** The ESPN system that processed this MessageTopic */
  author?: string;
  /** Details about creation of this MessageTopic */
  creationInfo: ModificationInfo;
  /** The unix time for the date this MessageTopic was created */
  date: number;
  /** The unix time for the date this MessageTopic was last edited */
  dateEdited: number;
  /** The ID of this MessageTopic */
  id: string;
  /** Whether this MessageTopic has been deleted */
  isDeleted: boolean;
  /** Whether this MessageTopic has been edited */
  isEdited: boolean;
  /** Details about the last update of this MessageTopic */
  lastUpdateInfo: ModificationInfo;
  /** The Messages that make up this MessageTopic */
  messages: Message[];
  /** The ID for the target of this MessageTopic  */
  targetId?: number | string;
  /** The number of Messages that make up this MessageTopic */
  totalMessageCount: number;
  /** The type of MessageTopic */
  type: MessageType;
  /** The ESPN systems that can view this MessageTopic */
  viewableBy?: string[];
  /** The ID of the entity this MessageTopic is for */
  for?: number;
}

/**
 * Types of messages
 */
export enum MessageType {
  /** Updates to the league schedule */
  ActivitySchedule = "ACTIVITY_SCHEDULE",
  /** Updates to the league settings */
  ActivitySettings = "ACTIVITY_SETTINGS",
  /** Updates to the status of a league member */
  ActivityStatus = "ACTIVITY_STATUS",
  /** Transactions in the league */
  ActivityTransactions = "ACTIVITY_TRANSACTIONS",
  /** League member chat messages */
  Chat = "CHAT",
}

/**
 * A transactional sub-event in the ESPN fantasy hockey league
 *
 * For example, an individual player that was moved as part of a trade
 */
export interface Message {
  /** The ESPN system that processed this Message */
  author?: string;
  /** Details about creation of this Message */
  creationInfo: ModificationInfo;
  /** The unix time for the date this Message was created */
  date: number;
  /** The ID for the fantasy hockey team this message was executed for */
  for?: number;
  /** The team this player is moving from */
  from?: number | string;
  /** The ID of this Message */
  id: string;
  /** Whether an alternate format was used for recording this message */
  isAlternateFormat: boolean;
  /** Whether this Message has been deleted */
  isDeleted: boolean;
  /** Whether this Message has been edited */
  isEdited: boolean;
  /** The ID for the type of this message */
  messageTypeId: number;
  /** The ID for the target of this message (usually the ID of the player that was moved) */
  targetId?: number | string;
  /** The team this player is moving to */
  to?: number | string;
  /** The ID of the MessageTopic this message belongs to */
  topicId: string;
  /** The content of the Message */
  content?: string;
  /** The subject of the Message */
  subject?: string;
  /** A human-readable string describing this Message topic */
  humanReadableMessage?: string;
}

/** Details about the creation or modification of a MessageTopic or Message */
export interface ModificationInfo {
  /** The client IP that initiated the creation/modification */
  clientAddress: string | null;
  /** The unix time for the date of the creation/modification */
  date: number;
  /** The ESPN platform that initiated the creation/modification */
  platform: string | null;
  /** The source that initiated the creation/modification */
  source: string | null;
}

/**
 * A filter to be applied to ESPN fantasy hockey league communication retrieved from
 * https://fantasy.espn.com/apis/v3/games/fhl/seasons/SEASON/segments/0/leagues/LEAGUE_ID/communication/?view=kona_league_communication
 */
export interface MessageFilter {
  /** Details about the filter to be applied */
  topics: TopicFilter;
}

/**
 * Details about a filter to be applied to ESPN fantasy hockey league communication
 */
export interface TopicFilter {
  /** Message Types to include in the results */
  filterType?: Value<string[]>;
  /** The max number of MessageTopics to return */
  limit?: number;
  /** The max number of Messages to return for each MessageTopic */
  limitPerMessageSet?: Value<number>;
  /** The offset to use for start from when returning MessageTopics */
  offset?: number;
  /** Details about how to sort MessageTopics by date */
  sortMessageDate?: SortDetails;
  /** Details about how to sort MessageTopics by who the MessageTopic is for */
  sortFor?: SortDetails;
  /** Details about the date range to search for MessageTopics */
  filterDateRange?: DateRangeFilter;
  /** The list of IDs for message types to include */
  filterIncludeMessageTypeIds?: Value<number[]>;
  /** The list of IDs for message types to exclude */
  filterExcludeMessageTypeIds?: Value<number[]>;
}

/**
 * Details about a filter to be applied when retrieving a list of NHL players
 */
export interface PlayerFilter {
  /** Whether to filter the list to only include active players */
  filterActive: Value<boolean>;
}

/** The value of some paramter */
export interface Value<E> {
  /** The value of some paramter */
  value: E;
}

/** Details about how to sort MessageTopics */
export interface SortDetails {
  /** The priority of this sort parameter */
  sortPriority: number;
  /** Whether to sort in ascending order */
  sortAsc: boolean;
}

/** Details about the date range to use when filtering MessageTopics */
export interface DateRangeFilter {
  /** The unix time for the earliest date of events to be included in the results */
  value: number;
  /** The unix time for the latest date of events to be included in the results */
  additionalValue?: number;
}

/**
 * Details about the fantasy hockey league retrieved from
 * https://fantasy.espn.com/apis/v3/games/fhl/seasons/FH_SEASON/segments/0/leagues/FH_LEAGUE_ID
 */
export interface FhLeagueData {
  /** Not sure what this is */
  gameId: number;
  /** The ID of the fantasy hockey league */
  id: number;
  /** The list of members of the fantasy hockey league */
  members: FhLeagueMember[];
  /** The current scoring period */
  scoringPeriodId: number;
  /** The season */
  seasonId: number;
  /** The segment */
  segmentId: number;
  /** The league settings */
  settings: FhLeagueSettings;
  /** Details about the current status of the league */
  status: FhLeagueStatus;
  /** The list of teams in the league */
  teams: FhLeagueTeam[];
}

/** A member of a fantasy hockey league */
export interface FhLeagueMember {
  /** The member's ESPN display name */
  displayName: string;
  /** The unique ID for the member */
  id: string;
  /** Whether the member is a league manager */
  isLeagueManager: boolean;
}

/** Settings for a fantasy hockey league */
export interface FhLeagueSettings {
  /** The name of the league */
  name: string;
}

/** The status of a fantasy hockey league */
export interface FhLeagueStatus {
  /** The ID of the current matchup period */
  currentMatchupPeriod: number;
  /** Whether the league is active */
  isActive: boolean;
  /** The ID of the last matchup period */
  latestScoringPeriod: number;
}

/** A team in the fantasy hockey league */
export interface FhLeagueTeam {
  /** The team abbreviation */
  abbrev: string;
  /** The team's ID */
  id: number;
  /** The team's location */
  location: string;
  /** The team's nickname */
  nickname: string;
  /** The unique IDs of the team's owners */
  owners: string[];
}

/**
 * Details about ESPN Fantasy hockey retrieved from
 * https://fantasy.espn.com/apis/v3/games/fhl/seasons/FH_SEASON?view=proTeamSchedules_wl
 */
export interface FantasyHockeyInfoResponse {
  /** Whether ESPN displays the data */
  display: boolean;
  /** Settings for all fantasy hockey leagues */
  settings: FantasyHockeySettings;
}

/** Settings for ESPN fantasy hockey */
export interface FantasyHockeySettings {
  /** The default draft position in ESPN fantasy hockey */
  defaultDraftPosition: number;
  /** The minimum amount of users allowed in the draft lobby? */
  draftLobbyMinimumLeagueCount: number;
  /** Details about settings for fantasy hockey notifications */
  gameNotificationSettings: GameNotificationSettings;
  /** Whether you have to be signed in to see details about ESPN fantasy hockey? */
  gated: boolean;
  /** Settings for players that are owned in the league */
  playerOwnershipSettings: PlayerOwnershipSettings;
  /** The professional teams that make up the league */
  proTeams: ProTeam[];
  /** Whether settings for the league can be updated? */
  readOnly: boolean;
  /** Not sure what this is */
  teamActivityEnabled: boolean;
  /** A map of fantasy hockey constants to allowed values for those constants */
  typeNames: { [key: string]: string[] };
}

/** Details about settings for fantasy hockey notifications */
export interface GameNotificationSettings {
  /** Whether player availability notifications are enabled */
  availabilityNotificationsEnabled: boolean;
  /** Whether draft notifications are enabled */
  draftNotificationsEnabled: boolean;
  /** Whether injury notifications are enabled */
  injuryNotificationsEnabled: boolean;
  /** Whether lineup notifications are enabled */
  lineupNotificationsEnabled: boolean;
  /** Whether position eligibility notifications are enabled */
  positionEligibilityNotificationsEnabled: boolean;
  /** Whether roster news notifications are enabled */
  rosterNewsNotificationsEnabled: boolean;
  /** Whether start/bench notifications are enabled */
  startBenchNotificationsEnabled: boolean;
  /** Whether trade notifications are enabled */
  tradeNotificationsEnabled: boolean;
}

export interface PlayerOwnershipSettings {
  firstGameDate: number;
  lastGameDate: number;
  startDate: number;
}

/** Details about a professional hockey team */
export interface ProTeam {
  /** The team abbreviation */
  abbrev: string;
  /** The team's bye week */
  byeWeek: number;
  /** The team's ESPN ID */
  id: number;
  /** The team's location */
  location: string;
  /** The team's name */
  name: string;
  /** A map of scoring periods to games in those scoring periods */
  proGamesByScoringPeriod?: { [key: string]: ProGames[] };
  /** The sports universe this team is in */
  universeId: number;
}

/** Details about a pro game that is scheduled or has been played  */
export interface ProGames {
  /** The ESPN ID of the away team */
  awayProTeamId: number;
  /** The unix time of the date/time when the game is scheduled to begin */
  date: number;
  /** The ESPN ID of the away team */
  homeProTeamId: number;
  /** The ESPN ID for this game */
  id: number;
  /** The scoring period ID */
  scoringPeriodId: number;
  /** Whether the games start time is TBD */
  startTimeTBD: boolean;
  /** Whether the game stats have gone official */
  statsOfficial: boolean;
  /** Whether lineup slots should lock after this game begins */
  validForLocking: boolean;
}
