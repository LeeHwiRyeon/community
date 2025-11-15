/**
 * Seed initial data for SQLite database
 */
import connection from './sqlite-db.js';

export function seedInitialData() {
    try {
        // Check if boards already exist
        const [boards] = connection.query('SELECT COUNT(*) as count FROM boards', []);
        if (boards[0].count > 0) {
            console.log('✓ Initial data already seeded');
            return;
        }

        // Insert default boards
        const boardsData = [
            ['general', '자유 게시판'],
            ['notice', '공지사항'],
            ['qna', 'Q&A'],
            ['tech', '기술 토론'],
            ['community', '커뮤니티']
        ];

        for (const [name, description] of boardsData) {
            connection.execute(
                'INSERT INTO boards (name, description) VALUES (?, ?)',
                [name, description]
            );
        }

        // Insert default chat room
        connection.execute(
            `INSERT INTO chat_rooms (name, description, is_private) 
             VALUES (?, ?, ?)`,
            ['general', 'General chat room', 0]
        );

        console.log('✓ Initial data seeded successfully');
    } catch (error) {
        console.error('Seed data error:', error);
    }
}
