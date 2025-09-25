import { buildMockHierarchy } from '../../random-data.js';

describe('mock hierarchy data', () => {
    it('creates at least three boards per community with thirty posts each by default', () => {
        const hierarchy = buildMockHierarchy();
        expect(hierarchy).toBeDefined();
        expect(Array.isArray(hierarchy.communities)).toBe(true);

        hierarchy.communities.forEach((community) => {
            expect(Array.isArray(community.boards)).toBe(true);
            expect(community.boards.length).toBeGreaterThanOrEqual(3);

            community.boards.forEach((board) => {
                expect(Array.isArray(board.posts)).toBe(true);
                expect(board.posts.length).toBeGreaterThanOrEqual(30);

                board.posts.forEach((post, index) => {
                    if (index > 0) {
                        expect(post.views).toBeLessThanOrEqual(board.posts[index - 1].views);
                    }

                    expect(post.hero_media).toBeTruthy();
                    expect(typeof post.hero_media.url).toBe('string');
                    expect(post.hero_media.url.length).toBeGreaterThan(0);

                    expect(Array.isArray(post.media)).toBe(true);
                    expect(post.media.length).toBeGreaterThan(0);
                    expect(post.media[0]).toHaveProperty('url');

                    expect(Array.isArray(post.blocks)).toBe(true);
                    expect(post.blocks.length).toBeGreaterThan(0);

                    const ordering = post.blocks.map((block) => block.ordering);
                    const sortedOrdering = [...ordering].sort((a, b) => a - b);
                    expect(ordering).toEqual(sortedOrdering);
                });
            });
        });
    });
});
