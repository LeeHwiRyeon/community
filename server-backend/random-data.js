// 랜덤 목업 데이터 생성 스크립트
const categories = ['LOL', 'StarCraft', 'Valorant', 'Genshin', 'Overwatch', 'PUBG', 'Minecraft', 'FIFA', 'General'];
const authors = ['GameMaster', 'ProGamer', 'NewsBot', 'CommunityUser', 'ModeratorX', 'eSportsReporter', 'GameFan', 'TechGuru'];

const titleTemplates = [
    '{game} 새로운 업데이트 출시!',
    '{game} 프로리그 결과 분석',
    '{game} 신규 캐릭터/유닛 공개',
    '{game} 밸런스 패치 노트',
    '{game} 커뮤니티 이벤트 안내',
    '{game} 팁과 공략 가이드',
    '{game} 버그 수정 및 개선사항',
    '{game} 월드 챔피언십 소식',
    '{game} 신규 맵/스테이지 추가',
    '{game} 개발자 인터뷰'
];

const contentTemplates = [
    '최근 {game}에서 중요한 업데이트가 발표되었습니다. 이번 패치에서는 게임 밸런스 조정과 새로운 기능이 추가되었습니다.',
    '{game} 커뮤니티에서 뜨거운 관심을 받고 있는 이슈를 다뤄보겠습니다. 플레이어들의 의견과 개발진의 응답을 정리했습니다.',
    '프로 게이머들의 경기 결과와 하이라이트를 분석해보겠습니다. 이번 경기에서 보여준 전략과 플레이를 살펴보세요.',
    '초보자부터 고수까지 모든 플레이어에게 도움이 될 팁과 공략을 소개합니다. 더 나은 게임 실력 향상을 위한 가이드입니다.',
    '{game}의 최신 소식과 업계 동향을 전해드립니다. 앞으로의 게임 발전 방향과 커뮤니티 반응을 분석했습니다.'
];

const games = ['League of Legends', 'StarCraft II', 'Valorant', 'Genshin Impact', 'Overwatch 2', 'PUBG', 'Minecraft', 'FIFA 24'];

function generateRandomPost(id) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const author = authors[Math.floor(Math.random() * authors.length)];
    const game = games[Math.floor(Math.random() * games.length)];
    
    const titleTemplate = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
    const contentTemplate = contentTemplates[Math.floor(Math.random() * contentTemplates.length)];
    
    const title = titleTemplate.replace('{game}', game);
    const content = contentTemplate.replace('{game}', game) + ' ' + 
        '게임 업계의 최신 동향과 플레이어들의 다양한 의견을 종합하여 상세한 분석을 제공합니다. '.repeat(Math.floor(Math.random() * 3) + 1);
    
    const now = new Date();
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
    
    return {
        id: id.toString(),
        board_id: ['news', 'game', 'free'][Math.floor(Math.random() * 3)],
        title,
        content,
        author,
        category,
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 50000) + 100,
        comments_count: Math.floor(Math.random() * 500) + 1,
        created_at: date.toISOString(),
        updated_at: date.toISOString(),
        deleted: 0,
        is_featured: Math.random() > 0.8,
        thumb: Math.random() > 0.5 ? `https://picsum.photos/400/200?random=${id}` : null
    };
}

function generateRandomMessage(id, room = 'test') {
    const messages = [
        '안녕하세요! 새로운 업데이트 어떠신가요?',
        '이번 패치 정말 좋네요!',
        '다음 토너먼트 언제인가요?',
        '공략 좀 알려주세요 ㅠㅠ',
        '와 이 게임 진짜 재밌다',
        '버그 수정 언제 되나요?',
        'GG! 좋은 경기였습니다',
        '새로운 캐릭터 너무 강한 것 같아요',
        '다음 시즌 기대됩니다!',
        '커뮤니티 이벤트 참여했어요!'
    ];
    
    const usernames = ['GameLover', 'ProPlayer', 'Casual_Gamer', 'eSports_Fan', 'NewbieUser', 'VeteranPlayer'];
    
    const now = new Date();
    const randomMinutesAgo = Math.floor(Math.random() * 1440); // 24시간 내
    const date = new Date(now.getTime() - randomMinutesAgo * 60 * 1000);
    
    return {
        id: `msg_${id}`,
        room_id: room,
        username: usernames[Math.floor(Math.random() * usernames.length)],
        content: messages[Math.floor(Math.random() * messages.length)],
        created_at: date.toISOString()
    };
}

// 100개의 랜덤 게시글 생성
const randomPosts = [];
for (let i = 1; i <= 100; i++) {
    randomPosts.push(generateRandomPost(i + 1000));
}

// 50개의 랜덤 채팅 메시지 생성
const randomMessages = [];
const rooms = ['test', 'free', 'news', 'game'];
for (let i = 1; i <= 50; i++) {
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    randomMessages.push(generateRandomMessage(i + 2000, room));
}

console.log('Generated', randomPosts.length, 'random posts');
console.log('Generated', randomMessages.length, 'random messages');

export { randomPosts, randomMessages, generateRandomPost, generateRandomMessage };