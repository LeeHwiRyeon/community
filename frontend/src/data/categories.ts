export type CategoryNode = {
  id: string;
  label: string;
  children?: CategoryNode[];
};

export const gameCategories: CategoryNode = {
  id: 'root',
  label: 'Game Communities',
  children: [
    {
      id: 'league-of-legends',
      label: 'League of Legends',
      children: [
        { id: 'league-of-legends-news', label: 'Patch & Dev Watch' },
        { id: 'league-of-legends-strategy', label: 'Champion Lab' },
        { id: 'league-of-legends-community', label: 'Summoner Lounge' },
        { id: 'league-of-legends-esports', label: 'Esports Central' }
      ]
    },
    {
      id: 'valorant',
      label: 'Valorant',
      children: [
        { id: 'valorant-news', label: 'Agent Briefing' },
        { id: 'valorant-strategy', label: 'Playbook Lab' },
        { id: 'valorant-community', label: 'Agent Lounge' },
        { id: 'valorant-esports', label: 'VCT Watchtower' }
      ]
    },
    {
      id: 'genshin-impact',
      label: 'Genshin Impact',
      children: [
        { id: 'genshin-impact-news', label: 'Traveler Dispatch' },
        { id: 'genshin-impact-guides', label: 'Artifact Workshop' },
        { id: 'genshin-impact-community', label: 'Serenitea Plaza' }
      ]
    },
    {
      id: 'minecraft',
      label: 'Minecraft',
      children: [
        { id: 'minecraft-news', label: 'Update Radar' },
        { id: 'minecraft-builds', label: 'Builder Showcase' },
        { id: 'minecraft-tech', label: 'Redstone Lab' }
      ]
    },
    {
      id: 'fifa-ultimate',
      label: 'FIFA Ultimate Team',
      children: [
        { id: 'fifa-ultimate-news', label: 'Pitch Notes' },
        { id: 'fifa-ultimate-market', label: 'Transfer Market Pulse' },
        { id: 'fifa-ultimate-tactics', label: 'Tactics Board' }
      ]
    }
  ]
};
