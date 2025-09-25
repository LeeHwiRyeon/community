const authors = [
  'AuroraBytes',
  'PatchWatcher',
  'EsportsEcho',
  'MetaOracle',
  'StrategySmith',
  'LoreKeeper',
  'CommunityPulse',
  'BuildCrafter',
  'AimSense',
  'CraftPilot',
  'DeckTheory',
  'StreamScout'
]

const heroImages = [
  'https://images.unsplash.com/photo-1511512578047-dfb367046420',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6',
  'https://images.unsplash.com/photo-1523966211575-eb4a68a9aa2d',
  'https://images.unsplash.com/photo-1472457897821-70d3819a0e24',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d',
  'https://images.unsplash.com/photo-1489515217757-5fd1be406fef',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401'
]

const defaultBroadcastPlatforms = [
  { name: 'Twitch', baseUrl: 'https://www.twitch.tv/' },
  { name: 'YouTube Live', baseUrl: 'https://www.youtube.com/@' },
  { name: 'Kick', baseUrl: 'https://kick.com/' },
  { name: 'AfreecaTV', baseUrl: 'https://play.afreecatv.com/' }
]

const generalParagraphs = [
  'Players reported a noticeably smoother pacing through the mid game after teams refined their macro calls.',
  'Teams experimenting with hybrid compositions are finding success when they stagger cooldowns across objective cycles.',
  'Analysts continue to highlight the impact that coordinated vision control has on contesting neutral objectives.',
  'Community testers emphasised how important early planning is when navigating the newest rotation of competitive maps.',
  'Coaches asked their squads to review scrim footage with a focus on post-setup positioning ahead of upcoming tournaments.',
  'The latest public test build reminded everyone that communication tools are as important as mechanical execution.',
  'Top creators stressed how valuable it is to practice punish windows in a controlled environment before ranked climbs.',
  'Tournament coordinators issued reminders about sportsmanship policies as more open qualifier slots went live.'
]

const articleParagraphs = [
  'Developers outlined upcoming balance targets designed to keep high-impact abilities from crowding out counterplay options.',
  'The patch introduces a revised economy model that should reduce the snowball potential from early round wins.',
  'Designers confirmed that feedback from regional leagues directly informed the latest change list.',
  'Updated telemetry now powers the new replay breakdown, highlighting moments where win probability shifts dramatically.'
]

const discussionIntroductions = [
  'Share your latest clutch story and the call that made it happen.',
  'Looking for duo partners in the same rank band? Drop your details here.',
  'What strategies are you testing this week and how are scrims going?',
  'Who is your go-to specialist pick when the enemy bans out the meta staples?'
]

const broadcastHighlights = [
  'Live breakdowns of scrim footage help players translate theory into practice across a full best-of series.',
  'Watch parties focus on macro mistakes and practical adaptations that viewers can apply immediately.',
  'Live coaching segments emphasise how to stabilise mid-game leads without giving opponents comeback windows.',
  'Interactive Q&A blocks let viewers ask for feedback on their own replays while the stream is running.'
]

const galleryHighlights = [
  'Detailed costume breakdowns cover foam carving, paint layering, and weathering passes for studio lighting.',
  'Photographers captured motion blur to emphasise the energy of each scene without losing key costume details.',
  'Makeup artists explained how they converted concept art palettes into wearable looks for long events.',
  'Lens choice and colour grading tips help cosplayers replicate the mood of in-game cinematics.'
]

const galleryCaptions = [
  'Backstage lighting test before the main stage showcase.',
  'Detail shot of hand-painted armour plates under neutral light.',
  'Environmental portrait that mirrors the original splash art.',
  'Dynamic pose captured during choreographed fight rehearsal.',
  'Process photo showing foam layers before sealing and paint.'
]

const usernames = [
  'LobbyScout',
  'PatchPilot',
  'MetaMiner',
  'QueueBuddy',
  'TheoryCrafter',
  'StreamSense',
  'BotLaneCoach',
  'ArenaArchivist'
]

const messageSeeds = [
  'Remember to attach your VOD timestamps when asking for feedback.',
  'Tournament lobby opens in twenty minutes ? check your audio setup now.',
  'Pinning this week¡¯s scrim spreadsheet so everyone can adjust their availability.',
  'Share your best opening routes for the new map before scrims tonight.',
  'Anyone running a fundamentals review session? Tag me if slots open.',
  'Reminder: submit highlight clips before Friday so we can edit the recap video.',
  'Looking for support mains to practice mid fight macro calls this weekend.'
]

const communitySeeds = [
  {
    id: 'league-of-legends',
    title: 'League of Legends',
    shortName: 'League',
    description: 'MOBA strategy, champion builds, and regional league coverage.',
    boards: [
      {
        suffix: 'news',
        title: 'Patch & Dev Watch',
        category: 'news',
        weight: 4,
        summary: 'Official patch breakdowns and developer blogs for League players.',
        preview: {
          type: 'article',
          tags: ['Patch Notes', 'Meta Watch', 'Developer Blog'],
          excerptHints: [
            'Meta shifting focus on jungle tempo and early vision setups.',
            'Item adjustments and rune tuning insights from internal testing.',
            'Developer commentary on the goals for the ranked split refresh.'
          ]
        },
        headlines: [
          '{game} patch trajectory forecast',
          'Mid-season balance focus for {game}',
          'Ranked split preview and goals',
          'Developer AMA takeaways'
        ]
      },
      {
        suffix: 'community',
        title: 'Summoner Lounge',
        category: 'community',
        weight: 2,
        summary: 'Share highlights, find duo partners, and celebrate ranked milestones.',
        preview: {
          type: 'discussion',
          moods: ['Recruiting', 'Clutch Stories', 'Theorycraft'],
          prompts: [
            'Who are you duo queueing with this split?',
            'Share your proudest comeback from this week.',
            'Looking for flex queue teammates? Drop your server.'
          ],
          highlights: [
            '"We reverse swept after stabilising from a 10k deficit."',
            '"Need midlaner for clash semifinals tonight."',
            '"Share your favourite off-meta bot lane picks."'
          ]
        },
        headlines: [
          'Favourite duo queue memories',
          'Profile banner showcase',
          'Clash roster recruiting',
          'Solo queue victory stories'
        ]
      },
      {
        suffix: 'broadcast',
        title: 'Summoner Stream Central',
        category: 'broadcast',
        weight: 3,
        summary: 'Live ranked grinds, scrim reviews, and co-stream watch parties.',
        preview: {
          type: 'broadcast',
          streamers: ['FakerLive', 'RuneterraCoach', 'BaronPitRadio', 'LCKRewatch'],
          tags: ['Ranked', 'Scrim Review', 'Coaching', 'Watch Party'],
          thumbnails: [
            'https://images.unsplash.com/photo-1511512578047-dfb367046420',
            'https://images.unsplash.com/photo-1525182008055-f88b95ff7980',
            'https://images.unsplash.com/photo-1525182008050-00e4d05f2a58'
          ],
          schedules: ['18:00 KST', '20:00 KST', '22:00 KST']
        },
        headlines: [
          'Live scrim review with pro shotcaller',
          'Ranked grind to challenger tonight',
          'Co-streaming LCK playoffs with chat analysis'
        ]
      },
      {
        suffix: 'cosplay',
        title: 'Runeterra Cosplay Runway',
        category: 'cosplay',
        weight: 2,
        summary: 'Detailed costume breakdowns and champion-inspired photosets.',
        preview: {
          type: 'gallery',
          images: [
            'https://images.unsplash.com/photo-1534447677768-be436bb09401',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
            'https://images.unsplash.com/photo-1524504388940-588eefd1340d'
          ],
          tags: ['Runeterra', 'Cosplay', 'Armor Craft'],
          cosplayers: ['ArcaneArtist', 'DemaciaDress', 'ShadowIslesFX'],
          palettes: ['Violet Dusk', 'Arcane Neon', 'Demacia Gold']
        },
        headlines: [
          'Cosplay spotlight: {game} champion fashion show',
          'Craft breakdown: building ornate shoulder armour',
          'Photography tips for dramatic in-lane lighting'
        ]
      }
    ]
  },
  {
    id: 'valorant',
    title: 'Valorant',
    shortName: 'Valorant',
    description: 'Agent mastery, map playbooks, and VCT circuit insights.',
    boards: [
      {
        suffix: 'news',
        title: 'Agent Briefing',
        category: 'news',
        weight: 4,
        summary: 'Patch notes, agent teasers, and developer commentary.',
        preview: {
          type: 'article',
          tags: ['Patch Notes', 'Meta Update', 'Episode Drop'],
          excerptHints: [
            'Agent balance now leans into utility counterplay.',
            'Map rotation schedule released for the upcoming act.',
            'Episode launch checklist covering battlepass rewards.'
          ]
        },
        headlines: [
          'New agent field report',
          'Map rotation calendar',
          'Episode launch checklist',
          'Balance hotfix digest'
        ]
      },
      {
        suffix: 'community',
        title: 'Agent Lounge',
        category: 'community',
        weight: 2,
        summary: 'Clutch clips, highlight montages, and team finder threads.',
        preview: {
          type: 'discussion',
          moods: ['Highlights', 'Team Finder', 'Routine'],
          prompts: [
            'Share your favourite clutch clip from this week.',
            'Looking for duo partners for ranked night?',
            'What is your daily aim routine before queueing?'
          ],
          highlights: [
            '"Need controller main for evening stack."',
            '"Uploaded montage of my best Chamber plays."',
            '"What crosshair settings are you using on Lotus?"'
          ]
        },
        headlines: [
          'Favourite clutch moments',
          'Team highlight montage',
          'Looking for duo partners',
          'Weekly aim routine sharing'
        ]
      },
      {
        suffix: 'broadcast',
        title: 'Radiant Broadcast Hub',
        category: 'broadcast',
        weight: 3,
        summary: 'Scrim VOD reviews, ranked grinds, and co-streamed VCT coverage.',
        preview: {
          type: 'broadcast',
          streamers: ['RadiantCoach', 'AimLabLive', 'SpikePlantTV', 'VCTNightly'],
          tags: ['Scrim', 'Aim Training', 'Strat Review', 'Watch Party'],
          thumbnails: [
            'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d',
            'https://images.unsplash.com/photo-1521737604893-d14cc237f11d',
            'https://images.unsplash.com/photo-1545239351-1141bd82e8a6'
          ],
          schedules: ['19:00 PDT', '21:00 PDT']
        },
        headlines: [
          'Live scrim VOD breakdown on Ascent',
          'Radiant grind: road to top 10 leaderboard',
          'Co-streaming VCT weekly with pro analysis'
        ]
      },
      {
        suffix: 'cosplay',
        title: 'Protocol Cosplay Studio',
        category: 'cosplay',
        weight: 2,
        summary: 'Agent-inspired wardrobes, prop builds, and studio shoots.',
        preview: {
          type: 'gallery',
          images: [
            'https://images.unsplash.com/photo-1540309604323-3415be8ae5ba',
            'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c',
            'https://images.unsplash.com/photo-1524504388940-2f98c0f0d1eb'
          ],
          tags: ['Protocol', 'Cosplay', 'Studio'],
          cosplayers: ['ProtocolWardrobe', 'SpikeArtistry', 'RadiantThreads'],
          palettes: ['Protocol Red', 'Spike Teal', 'Night Market']
        },
        headlines: [
          'Protocol cosplay spotlight with lighting breakdown',
          'Prop fabrication for teleporter emitters',
          'Studio shoot showcasing agent silhouettes'
        ]
      }
    ]
  },
  {
    id: 'star-rail',
    title: 'Honkai: Star Rail',
    shortName: 'Star Rail',
    description: 'Turn-based combat optimisations and Trailblazer community projects.',
    boards: [
      {
        suffix: 'news',
        title: 'Express Dispatch',
        category: 'news',
        weight: 3,
        summary: 'Upcoming banners, balance adjustments, and event roadmaps.',
        preview: {
          type: 'article',
          tags: ['Banner', 'Event', 'Update'],
          excerptHints: [
            'Simulated Universe tweaks target more diverse path choices.',
            'New relic set previews highlight energy regen options.',
            'Developers outlined how the patch smooths early Trailblaze power.'
          ]
        },
        headlines: [
          'Banner preview and farming checklist',
          'Path changes in simulated universe',
          'Relic crafting priorities for {game}'
        ]
      },
      {
        suffix: 'community',
        title: 'Trailblazer Plaza',
        category: 'community',
        weight: 2,
        summary: 'Roster theorycrafting, fan art, and co-op planning threads.',
        preview: {
          type: 'discussion',
          moods: ['Theorycraft', 'Fan Art', 'Co-op'],
          prompts: [
            'Which relic set surprised you in the latest patch?',
            'Share your favourite scene recreation from the story chapter.',
            'Looking for helper groups to clear Memory of Chaos?'
          ],
          highlights: [
            '"Stacking effect hit 240% because of perfect rotations."',
            '"Need an Imaginary carry for resonance synergy tests."',
            '"Show off your favourite companion mission screenshot."'
          ]
        },
        headlines: [
          'Memory of Chaos roster experiments',
          'Fan art weekend challenge',
          'Co-op helper group finder'
        ]
      },
      {
        suffix: 'broadcast',
        title: 'Astral Express Live',
        category: 'broadcast',
        weight: 2,
        summary: 'Live theorycraft clinics, showcase runs, and speed clear attempts.',
        preview: {
          type: 'broadcast',
          streamers: ['ExpressCaptain', 'NebulaNexus', 'TrailblazerLive'],
          tags: ['Speedrun', 'Showcase', 'Clinic'],
          thumbnails: [
            'https://images.unsplash.com/photo-1489515217757-5fd1be406fef',
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            'https://images.unsplash.com/photo-1472214103451-9374bd1c798e'
          ],
          schedules: ['18:30 JST', '21:00 JST']
        },
        headlines: [
          'Speed clear workshop: Memory of Chaos rotation',
          'Live coaching: stabilising sustain teams',
          'Showcase run featuring limited five-star duo'
        ]
      },
      {
        suffix: 'cosplay',
        title: 'Express Atelier',
        category: 'cosplay',
        weight: 1,
        summary: 'Performance captures, prop replicas, and scenic shoots.',
        preview: {
          type: 'gallery',
          images: [
            'https://images.unsplash.com/photo-1512427691650-1e0c6d162b8b',
            'https://images.unsplash.com/photo-1529331750425-9ba89a51b04b',
            'https://images.unsplash.com/photo-1517816428104-797678c7cf0c'
          ],
          tags: ['Cosplay', 'Prop', 'Studio'],
          cosplayers: ['AstralTailor', 'ExpressModel', 'TrailLight'],
          palettes: ['Nebula Bloom', 'Celestial Gold', 'Starfall Violet']
        },
        headlines: [
          'Scenic shoot inspired by the Astral Express',
          'Prop build: recreating a Pathstrider sphere',
          'Lighting tips for motion heavy stage pieces'
        ]
      }
    ]
  },
  {
    id: 'fc-clubhouse',
    title: 'FC Clubhouse',
    shortName: 'FC',
    description: 'Ultimate Team strategies, real-world match analysis, and creator broadcasts.',
    boards: [
      {
        suffix: 'news',
        title: 'Transfer Window Desk',
        category: 'news',
        weight: 3,
        summary: 'Squad updates, patch notes, and live service announcements.',
        preview: {
          type: 'article',
          tags: ['Live Service', 'Roster Update', 'Patch Notes'],
          excerptHints: [
            'Meta squads are pivoting toward high press builds.',
            'Gameplay tuning adds new tackles and physics adjustments.',
            'Weekend league rewards updated with fresh themes.'
          ]
        },
        headlines: [
          'Live tuning report for {game}',
          'Weekend league balance forecast',
          'Transfer window hotlist',
          'Content roadmap preview'
        ]
      },
      {
        suffix: 'community',
        title: 'Tactics Board',
        category: 'community',
        weight: 2,
        summary: 'Custom tactics, formation tweaks, and highlight goals.',
        preview: {
          type: 'discussion',
          moods: ['Tactics', 'Highlights', 'Trading'],
          prompts: [
            'Share the custom tactics that stabilised your defence.',
            'Drop your favourite highlight from the last rivals run.',
            'What trading filters are helping you during promos?'
          ],
          highlights: [
            '"Cross meta feels strong after switching to balanced width."',
            '"Pulled a rare duplicate during squad battles rewards."',
            '"Need chemistry ideas for new league hybrid."'
          ]
        },
        headlines: [
          'Post-patch custom tactics talk',
          'Highlight reel submission thread',
          'Trading lounge tips',
          'Hybrid squad builder help'
        ]
      },
      {
        suffix: 'broadcast',
        title: 'Matchday Broadcast Bay',
        category: 'broadcast',
        weight: 2,
        summary: 'Watch parties, gameplay clinics, and pack opening nights.',
        preview: {
          type: 'broadcast',
          streamers: ['ClubCaptain', 'PitchsideCoach', 'UltimateTrader'],
          tags: ['Watch Party', 'Clinic', 'Trading'],
          thumbnails: [
            'https://images.unsplash.com/photo-1502877338535-766e1452684a',
            'https://images.unsplash.com/photo-1489515217757-5fd1be406fef',
            'https://images.unsplash.com/photo-1517649763962-0c623066013b'
          ],
          schedules: ['18:00 CET', '21:00 CET'],
          platforms: [
            { name: 'Twitch', baseUrl: 'https://www.twitch.tv/' },
            { name: 'YouTube Live', baseUrl: 'https://www.youtube.com/@' }
          ]
        },
        headlines: [
          'Live trading session with community picks',
          'Pack opening night with viewers',
          'Weekend league coaching desk'
        ]
      },
      {
        suffix: 'cosplay',
        title: 'Clubhouse Showcase',
        category: 'cosplay',
        weight: 1,
        summary: 'Jersey design, football cosplay, and matchday photography.',
        preview: {
          type: 'gallery',
          images: [
            'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d',
            'https://images.unsplash.com/photo-1461897104016-0b3b66f5d5c4',
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518',
            'https://images.unsplash.com/photo-1522770179533-24471fcdba45'
          ],
          tags: ['Football', 'Cosplay', 'Matchday'],
          cosplayers: ['UltTeamUltra', 'PitchsidePhoto', 'ClubColors'],
          palettes: ['Home Kit', 'Away Slate', 'Retro Bold']
        },
        headlines: [
          'Jersey design showcase inspired by icons',
          'Matchday photo diary from the stands',
          'DIY crowd choreography props for supporters'
        ]
      }
    ]
  }
]

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(list) {
  return list[random(0, list.length - 1)]
}

function pickMany(list, count) {
  if (!Array.isArray(list) || list.length === 0) {
    return []
  }
  const pool = [...list]
  const result = []
  const take = Math.min(count, pool.length)
  for (let index = 0; index < take; index += 1) {
    const choice = random(0, pool.length - 1)
    result.push(pool.splice(choice, 1)[0])
  }
  return result
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatImage(url, width = 640, height = 360) {
  if (!url) {
    return null
  }
  return `${url}?auto=format&fit=crop&w=${width}&h=${height}&q=80`
}

function truncate(value, length = 180) {
  if (typeof value !== 'string') {
    return ''
  }
  if (value.length <= length) {
    return value
  }
  return `${value.slice(0, length - 3)}...`
}

function buildDatePair() {
  const daysAgo = random(0, 30)
  const base = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  const updated = new Date(base.getTime() + random(1, 48) * 60 * 60 * 1000)
  return {
    createdAt: base.toISOString(),
    updatedAt: updated.toISOString(),
    displayDate: base.toISOString().slice(0, 10)
  }
}

function buildParagraphs(format, template) {
  const opening = `${template}. ${pick(generalParagraphs)}`
  const body = pick(generalParagraphs)
  const closing = pick(generalParagraphs)

  switch (format) {
    case 'broadcast': {
      return [
        `${opening} ${pick(broadcastHighlights)}`,
        `${body} Creators will pause replays to explain why rotations succeed or fail in real time.`,
        `${closing} Expect interactive polls so viewers can vote on alternate macro paths.`
      ]
    }
    case 'gallery': {
      return [
        `${opening} ${pick(galleryHighlights)}`,
        `${body} Photographers provided ${pick(galleryCaptions)} to showcase key craftsmanship details.`,
        `${closing} Community mentors listed recommended materials and sealants for long conventions.`
      ]
    }
    case 'discussion': {
      return [
        `${opening} ${pick(discussionIntroductions)}`,
        `${body} Participants compared approaches and shared replay codes for follow-up analysis.`,
        `${closing} Moderators summarised the most actionable insights so latecomers can catch up quickly.`
      ]
    }
    default: {
      return [
        `${opening} ${pick(articleParagraphs)}`,
        `${body} Live service notes confirmed that monitoring tools will continue to feed future balance passes.`,
        `${closing} A follow-up developer blog will revisit these findings after a few ranked splits.`
      ]
    }
  }
}

function buildPreviewForBoard({ board, template, content, index }) {
  const seed = board.previewSeed ?? {}
  switch (board.previewFormat) {
    case 'broadcast': {
      const streamer = seed.streamers ? seed.streamers[index % seed.streamers.length] : pick(authors)
      const platformList = seed.platforms && seed.platforms.length > 0 ? seed.platforms : defaultBroadcastPlatforms
      const platform = platformList[index % platformList.length]
      const tags = seed.tags && seed.tags.length > 0 ? pickMany(seed.tags, 2) : ['Live', 'Analysis']
      const baseThumbnail = seed.thumbnails && seed.thumbnails.length > 0 ? seed.thumbnails[index % seed.thumbnails.length] : pick(heroImages)
      const scheduleLabel = seed.schedules && seed.schedules.length > 0 ? seed.schedules[index % seed.schedules.length] : null
      const scheduledAt = new Date(Date.now() + (index + 1) * 45 * 60 * 1000)
      return {
        type: 'broadcast',
        streamer,
        platform: platform.name,
        streamUrl: `${platform.baseUrl}${slugify(streamer)}`,
        scheduledFor: scheduledAt.toISOString(),
        scheduleLabel,
        isLive: index % 3 === 0,
        tags,
        thumbnail: formatImage(baseThumbnail)
      }
    }
    case 'gallery': {
      const baseImages = seed.images && seed.images.length > 0 ? seed.images : heroImages
      const images = pickMany(baseImages, 4).map((url) => formatImage(url, 420, 420))
      return {
        type: 'gallery',
        images,
        tags: seed.tags && seed.tags.length > 0 ? pickMany(seed.tags, 3) : ['Cosplay', 'Spotlight'],
        likes: random(210, 1800),
        featuredCosplayer: seed.cosplayers ? seed.cosplayers[index % seed.cosplayers.length] : pick(authors),
        palette: seed.palettes ? seed.palettes[index % seed.palettes.length] : 'Midnight Glow'
      }
    }
    case 'discussion': {
      const prompts = seed.prompts && seed.prompts.length > 0 ? seed.prompts : [content]
      const prompt = prompts[index % prompts.length]
      const highlightPool = seed.highlights && seed.highlights.length > 0 ? seed.highlights : prompts
      return {
        type: 'discussion',
        mood: seed.moods && seed.moods.length > 0 ? seed.moods[index % seed.moods.length] : 'Community',
        snippet: prompt,
        highlight: highlightPool[index % highlightPool.length],
        replies: random(24, 260),
        lastReplyBy: pick(authors)
      }
    }
    default: {
      const excerptPool = seed.excerptHints && seed.excerptHints.length > 0 ? seed.excerptHints : [content]
      const tags = seed.tags && seed.tags.length > 0 ? seed.tags : ['Update']
      return {
        type: 'article',
        tag: tags[index % tags.length],
        excerpt: truncate(excerptPool[index % excerptPool.length], 200)
      }
    }
  }
}

function makePost({ board, headline, index }) {
  const template = headline.replace('{game}', board.gameName)
  const { createdAt, updatedAt, displayDate } = buildDatePair()
  const paragraphs = buildParagraphs(board.previewFormat, template)
  const content = paragraphs.join('\n\n')
  const preview = buildPreviewForBoard({ board, template, content, index })
  const baseViews = random(3200, 14000) + board.weight * 1500 + (board.communitySize - board.rank) * 800
  const views = baseViews + random(0, 5000)

  let thumb = formatImage(pick(heroImages))
  if (preview.type === 'gallery' && Array.isArray(preview.images) && preview.images.length > 0) {
    thumb = preview.images[0]
  } else if (preview.type === 'broadcast' && preview.thumbnail) {
    thumb = preview.thumbnail
  }

  return {
    id: `${board.id}-post-${index + 1}`,
    board_id: board.id,
    title: template,
    content,
    author: pick(authors),
    category: board.category,
    views,
    comments_count: random(3, 240),
    created_at: createdAt,
    updated_at: updatedAt,
    date: displayDate,
    thumb,
    mediaType: preview.type,
    preview,
    stream_url: preview.type === 'broadcast' ? preview.streamUrl : undefined,
    deleted: 0
  }
}

function buildMockHierarchy(options = {}) {
  const postsPerBoard = options.postsPerBoard && options.postsPerBoard > 0 ? options.postsPerBoard : 24
  let boardOrder = 1

  const communities = communitySeeds.map((seed, communityIndex) => {
    const boards = seed.boards.map((boardSeed, boardIndex) => {
      const board = {
        id: `${seed.id}-${boardSeed.suffix}`,
        title: boardSeed.title,
        summary: boardSeed.summary,
        communityId: seed.id,
        communityTitle: seed.title,
        communitySize: seed.boards.length,
        gameName: seed.shortName,
        ordering: boardOrder++,
        rank: boardIndex + 1,
        weight: boardSeed.weight ?? 1,
        category: boardSeed.category,
        previewFormat: boardSeed.preview?.type ?? 'article',
        format: boardSeed.preview?.type ?? 'article',
        previewSeed: boardSeed.preview ?? {},
        seedHeadlines: boardSeed.headlines,
        posts: [],
        deleted: 0
      }

      const targetPosts = Math.max(postsPerBoard, boardSeed.headlines.length)
      board.posts = Array.from({ length: targetPosts }, (_, idx) => {
        const headline = board.seedHeadlines[idx % board.seedHeadlines.length]
        return makePost({ board, headline, index: idx })
      }).sort((a, b) => b.views - a.views)

      return board
    })

    const totalViews = boards.reduce((sum, board) => sum + board.posts.reduce((acc, post) => acc + post.views, 0), 0)

    return {
      id: seed.id,
      title: seed.title,
      description: seed.description,
      rank: communityIndex + 1,
      totalViews,
      boards
    }
  })

  const boards = communities.flatMap((community) => community.boards)
  const posts = boards.flatMap((board) => board.posts)

  return {
    communities,
    boards,
    posts,
    boardMap: new Map(boards.map((board) => [board.id, board]))
  }
}

function generatePostForBoard(board) {
  const headlineSource = board.seedHeadlines ?? board.posts.map((post) => post.title)
  const headline = pick(headlineSource)
  return makePost({ board, headline, index: board.posts.length })
}

function generateRandomMessage(id, room = 'general') {
  const minutesAgo = random(1, 720)
  const createdAt = new Date(Date.now() - minutesAgo * 60 * 1000)
  return {
    id: `msg_${id}`,
    room_id: room,
    username: pick(usernames),
    content: pick(messageSeeds),
    created_at: createdAt.toISOString()
  }
}

const randomMessages = Array.from({ length: 50 }, (_, index) => generateRandomMessage(index + 1))

export { buildMockHierarchy, generatePostForBoard, generateRandomMessage, randomMessages }
