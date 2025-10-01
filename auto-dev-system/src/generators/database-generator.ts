import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { CodeFile, TechStack, Goal } from '@/types';

export class DatabaseGenerator {
    private openai: OpenAI;
    private outputDir: string;

    constructor(apiKey: string, outputDir: string = './generated-projects') {
        this.openai = new OpenAI({ apiKey });
        this.outputDir = outputDir;
    }

    /**
     * 데이터베이스 스키마 생성
     */
    async generateDatabaseSchema(
        goal: Goal,
        techStack: TechStack,
        projectStructure: any
    ): Promise<CodeFile[]> {
        console.log('🗄️ 데이터베이스 스키마 생성 중...');

        const generatedFiles: CodeFile[] = [];

        try {
            // 1. 데이터베이스 스키마 파일 생성
            const schemaFiles = await this.generateSchemaFiles(goal, techStack);
            generatedFiles.push(...schemaFiles);

            // 2. 마이그레이션 파일들 생성
            const migrationFiles = await this.generateMigrationFiles(goal, techStack);
            generatedFiles.push(...migrationFiles);

            // 3. 시드 파일들 생성
            const seedFiles = await this.generateSeedFiles(goal, techStack);
            generatedFiles.push(...seedFiles);

            // 4. 모델 파일들 생성
            const modelFiles = await this.generateModelFiles(goal, techStack);
            generatedFiles.push(...modelFiles);

            // 5. 인덱스 파일들 생성
            const indexFiles = await this.generateIndexFiles(goal, techStack);
            generatedFiles.push(...indexFiles);

            // 6. 설정 파일들 생성
            const configFiles = await this.generateConfigFiles(techStack);
            generatedFiles.push(...configFiles);

            // 파일들을 실제로 생성
            await this.writeFilesToDisk(generatedFiles, projectStructure);

            console.log(`✅ 데이터베이스 스키마 생성 완료: ${generatedFiles.length}개 파일`);
            return generatedFiles;

        } catch (error) {
            console.error('❌ 데이터베이스 스키마 생성 실패:', error);
            throw error;
        }
    }

    /**
     * 스키마 파일들 생성
     */
    private async generateSchemaFiles(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];
        const database = this.determineDatabase(techStack);
        const entities = this.determineEntities(goal);

        if (database === 'PostgreSQL') {
            // PostgreSQL 스키마
            const schemaContent = await this.generatePostgreSQLSchema(entities, goal);
            files.push({
                id: this.generateId(),
                name: 'schema.sql',
                path: 'database/schema.sql',
                content: schemaContent,
                language: 'sql',
                size: schemaContent.length,
                complexity: this.calculateComplexity(schemaContent),
                quality: this.calculateQuality(schemaContent),
                lastModified: new Date()
            });
        } else if (database === 'MongoDB') {
            // MongoDB 스키마
            const schemaFiles = await this.generateMongoDBSchemas(entities, goal);
            files.push(...schemaFiles);
        } else if (database === 'MySQL') {
            // MySQL 스키마
            const schemaContent = await this.generateMySQLSchema(entities, goal);
            files.push({
                id: this.generateId(),
                name: 'schema.sql',
                path: 'database/schema.sql',
                content: schemaContent,
                language: 'sql',
                size: schemaContent.length,
                complexity: this.calculateComplexity(schemaContent),
                quality: this.calculateQuality(schemaContent),
                lastModified: new Date()
            });
        }

        return files;
    }

    /**
     * 데이터베이스 타입 결정
     */
    private determineDatabase(techStack: TechStack): string {
        const dbTech = techStack.database.find(tech =>
            ['PostgreSQL', 'MongoDB', 'MySQL', 'SQLite'].includes(tech.name)
        );
        return dbTech?.name || 'PostgreSQL';
    }

    /**
     * 엔티티 결정
     */
    private determineEntities(goal: Goal): Array<{ name: string; fields: Array<{ name: string; type: string; constraints: string[] }> }> {
        const entities = [];

        // 기본 엔티티들
        entities.push({
            name: 'users',
            fields: [
                { name: 'id', type: 'SERIAL PRIMARY KEY', constraints: [] },
                { name: 'email', type: 'VARCHAR(255)', constraints: ['UNIQUE', 'NOT NULL'] },
                { name: 'password_hash', type: 'VARCHAR(255)', constraints: ['NOT NULL'] },
                { name: 'name', type: 'VARCHAR(100)', constraints: ['NOT NULL'] },
                { name: 'created_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] },
                { name: 'updated_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] }
            ]
        });

        // 목표별 엔티티 추가
        if (goal.requirements.some(r => r.description.includes('게시물') || r.description.includes('포스트'))) {
            entities.push({
                name: 'posts',
                fields: [
                    { name: 'id', type: 'SERIAL PRIMARY KEY', constraints: [] },
                    { name: 'title', type: 'VARCHAR(255)', constraints: ['NOT NULL'] },
                    { name: 'content', type: 'TEXT', constraints: ['NOT NULL'] },
                    { name: 'author_id', type: 'INTEGER', constraints: ['NOT NULL', 'REFERENCES users(id)'] },
                    { name: 'status', type: 'VARCHAR(20)', constraints: ['DEFAULT \'draft\''] },
                    { name: 'created_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] },
                    { name: 'updated_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] }
                ]
            });
        }

        if (goal.requirements.some(r => r.description.includes('댓글') || r.description.includes('코멘트'))) {
            entities.push({
                name: 'comments',
                fields: [
                    { name: 'id', type: 'SERIAL PRIMARY KEY', constraints: [] },
                    { name: 'content', type: 'TEXT', constraints: ['NOT NULL'] },
                    { name: 'post_id', type: 'INTEGER', constraints: ['NOT NULL', 'REFERENCES posts(id)'] },
                    { name: 'author_id', type: 'INTEGER', constraints: ['NOT NULL', 'REFERENCES users(id)'] },
                    { name: 'created_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] },
                    { name: 'updated_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] }
                ]
            });
        }

        if (goal.requirements.some(r => r.description.includes('카테고리') || r.description.includes('태그'))) {
            entities.push({
                name: 'categories',
                fields: [
                    { name: 'id', type: 'SERIAL PRIMARY KEY', constraints: [] },
                    { name: 'name', type: 'VARCHAR(100)', constraints: ['NOT NULL', 'UNIQUE'] },
                    { name: 'description', type: 'TEXT', constraints: [] },
                    { name: 'created_at', type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] }
                ]
            });

            entities.push({
                name: 'post_categories',
                fields: [
                    { name: 'post_id', type: 'INTEGER', constraints: ['NOT NULL', 'REFERENCES posts(id)'] },
                    { name: 'category_id', type: 'INTEGER', constraints: ['NOT NULL', 'REFERENCES categories(id)'] },
                    { name: 'PRIMARY KEY', type: '(post_id, category_id)', constraints: [] }
                ]
            });
        }

        return entities;
    }

    /**
     * PostgreSQL 스키마 생성
     */
    private async generatePostgreSQLSchema(entities: any[], goal: Goal): Promise<string> {
        const prompt = `
다음 요구사항에 맞는 PostgreSQL 데이터베이스 스키마를 생성해주세요:

목표: ${goal.description}
엔티티: ${entities.map(e => e.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. 모든 테이블 생성 DDL
2. 적절한 데이터 타입 사용
3. 외래키 제약조건
4. 인덱스 생성
5. 트리거 (updated_at 자동 업데이트)
6. 뷰 생성 (필요한 경우)
7. 권한 설정

완전한 SQL 스키마를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || this.getDefaultPostgreSQLSchema(entities);
    }

    /**
     * MongoDB 스키마 생성
     */
    private async generateMongoDBSchemas(entities: any[], goal: Goal): Promise<CodeFile[]> {
        const files: CodeFile[] = [];

        for (const entity of entities) {
            const content = await this.generateMongoDBSchema(entity, goal);
            files.push({
                id: this.generateId(),
                name: `${entity.name}.js`,
                path: `database/schemas/${entity.name}.js`,
                content,
                language: 'javascript',
                size: content.length,
                complexity: this.calculateComplexity(content),
                quality: this.calculateQuality(content),
                lastModified: new Date()
            });
        }

        return files;
    }

    /**
     * MongoDB 개별 스키마 생성
     */
    private async generateMongoDBSchema(entity: any, goal: Goal): Promise<string> {
        const prompt = `
다음 엔티티에 맞는 MongoDB Mongoose 스키마를 생성해주세요:

엔티티: ${entity.name}
필드: ${entity.fields.map(f => `${f.name}: ${f.type}`).join(', ')}

목표: ${goal.description}

다음 기능들을 포함해야 합니다:
1. Mongoose 스키마 정의
2. 적절한 데이터 타입 사용
3. 유효성 검사 규칙
4. 인덱스 설정
5. 가상 필드 (필요한 경우)
6. 미들웨어 (pre/post hooks)

완전한 Mongoose 스키마를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1000
        });

        return response.choices[0].message.content || this.getDefaultMongoDBSchema(entity);
    }

    /**
     * MySQL 스키마 생성
     */
    private async generateMySQLSchema(entities: any[], goal: Goal): Promise<string> {
        const prompt = `
다음 요구사항에 맞는 MySQL 데이터베이스 스키마를 생성해주세요:

목표: ${goal.description}
엔티티: ${entities.map(e => e.name).join(', ')}

다음 기능들을 포함해야 합니다:
1. 모든 테이블 생성 DDL
2. 적절한 데이터 타입 사용
3. 외래키 제약조건
4. 인덱스 생성
5. 트리거 (updated_at 자동 업데이트)
6. 엔진 설정 (InnoDB)

완전한 SQL 스키마를 생성해주세요.
    `;

        const response = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000
        });

        return response.choices[0].message.content || this.getDefaultMySQLSchema(entities);
    }

    /**
     * 마이그레이션 파일들 생성
     */
    private async generateMigrationFiles(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];
        const database = this.determineDatabase(techStack);
        const entities = this.determineEntities(goal);

        if (database === 'PostgreSQL' || database === 'MySQL') {
            // SQL 마이그레이션
            const migrationContent = await this.generateSQLMigration(entities, goal, database);
            files.push({
                id: this.generateId(),
                name: '001_initial_schema.sql',
                path: 'database/migrations/001_initial_schema.sql',
                content: migrationContent,
                language: 'sql',
                size: migrationContent.length,
                complexity: this.calculateComplexity(migrationContent),
                quality: this.calculateQuality(migrationContent),
                lastModified: new Date()
            });
        } else if (database === 'MongoDB') {
            // MongoDB 마이그레이션
            const migrationContent = await this.generateMongoDBMigration(entities, goal);
            files.push({
                id: this.generateId(),
                name: '001_initial_schema.js',
                path: 'database/migrations/001_initial_schema.js',
                content: migrationContent,
                language: 'javascript',
                size: migrationContent.length,
                complexity: this.calculateComplexity(migrationContent),
                quality: this.calculateQuality(migrationContent),
                lastModified: new Date()
            });
        }

        return files;
    }

    /**
     * 시드 파일들 생성
     */
    private async generateSeedFiles(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];
        const database = this.determineDatabase(techStack);
        const entities = this.determineEntities(goal);

        if (database === 'PostgreSQL' || database === 'MySQL') {
            // SQL 시드
            const seedContent = await this.generateSQLSeed(entities, goal);
            files.push({
                id: this.generateId(),
                name: 'seed.sql',
                path: 'database/seeds/seed.sql',
                content: seedContent,
                language: 'sql',
                size: seedContent.length,
                complexity: this.calculateComplexity(seedContent),
                quality: this.calculateQuality(seedContent),
                lastModified: new Date()
            });
        } else if (database === 'MongoDB') {
            // MongoDB 시드
            const seedContent = await this.generateMongoDBSeed(entities, goal);
            files.push({
                id: this.generateId(),
                name: 'seed.js',
                path: 'database/seeds/seed.js',
                content: seedContent,
                language: 'javascript',
                size: seedContent.length,
                complexity: this.calculateComplexity(seedContent),
                quality: this.calculateQuality(seedContent),
                lastModified: new Date()
            });
        }

        return files;
    }

    /**
     * 모델 파일들 생성
     */
    private async generateModelFiles(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];
        const database = this.determineDatabase(techStack);
        const entities = this.determineEntities(goal);

        for (const entity of entities) {
            let content = '';
            let filename = '';

            if (database === 'PostgreSQL' || database === 'MySQL') {
                // SQL 모델 (Sequelize, TypeORM 등)
                content = await this.generateSQLModel(entity, techStack);
                filename = `${entity.name}.js`;
            } else if (database === 'MongoDB') {
                // MongoDB 모델 (Mongoose)
                content = await this.generateMongoDBModel(entity, techStack);
                filename = `${entity.name}.js`;
            }

            files.push({
                id: this.generateId(),
                name: filename,
                path: `src/models/${filename}`,
                content,
                language: 'javascript',
                size: content.length,
                complexity: this.calculateComplexity(content),
                quality: this.calculateQuality(content),
                lastModified: new Date()
            });
        }

        return files;
    }

    /**
     * 인덱스 파일들 생성
     */
    private async generateIndexFiles(goal: Goal, techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];
        const database = this.determineDatabase(techStack);
        const entities = this.determineEntities(goal);

        const indexContent = await this.generateIndexContent(entities, goal, database);
        files.push({
            id: this.generateId(),
            name: 'indexes.sql',
            path: 'database/indexes.sql',
            content: indexContent,
            language: 'sql',
            size: indexContent.length,
            complexity: this.calculateComplexity(indexContent),
            quality: this.calculateQuality(indexContent),
            lastModified: new Date()
        });

        return files;
    }

    /**
     * 설정 파일들 생성
     */
    private async generateConfigFiles(techStack: TechStack): Promise<CodeFile[]> {
        const files: CodeFile[] = [];
        const database = this.determineDatabase(techStack);

        // 데이터베이스 연결 설정
        const connectionConfig = this.generateConnectionConfig(database);
        files.push({
            id: this.generateId(),
            name: 'database.js',
            path: 'src/config/database.js',
            content: connectionConfig,
            language: 'javascript',
            size: connectionConfig.length,
            complexity: this.calculateComplexity(connectionConfig),
            quality: this.calculateQuality(connectionConfig),
            lastModified: new Date()
        });

        // 환경 변수 설정
        const envConfig = this.generateEnvConfig(database);
        files.push({
            id: this.generateId(),
            name: '.env.database',
            path: '.env.database',
            content: envConfig,
            language: 'text',
            size: envConfig.length,
            complexity: this.calculateComplexity(envConfig),
            quality: this.calculateQuality(envConfig),
            lastModified: new Date()
        });

        return files;
    }

    // 기본 구현 메서드들
    private getDefaultPostgreSQLSchema(entities: any[]): string {
        let schema = `-- PostgreSQL Database Schema
-- Generated by Auto Dev System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

`;

        for (const entity of entities) {
            schema += `-- ${entity.name} table
CREATE TABLE ${entity.name} (
`;

            for (let i = 0; i < entity.fields.length; i++) {
                const field = entity.fields[i];
                schema += `  ${field.name} ${field.type}`;

                if (field.constraints.length > 0) {
                    schema += ` ${field.constraints.join(' ')}`;
                }

                if (i < entity.fields.length - 1) {
                    schema += ',';
                }
                schema += '\n';
            }

            schema += `);

`;
        }

        // 인덱스 생성
        schema += `-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);

`;

        // 트리거 생성
        schema += `-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

        return schema;
    }

    private getDefaultMongoDBSchema(entity: any): string {
        return `const mongoose = require('mongoose');

const ${entity.name}Schema = new mongoose.Schema({
  // TODO: 스키마 필드 정의
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스 설정
${entity.name}Schema.index({ name: 1 });
${entity.name}Schema.index({ createdAt: -1 });

// 가상 필드
${entity.name}Schema.virtual('id').get(function() {
  return this._id.toHexString();
});

// 미들웨어
${entity.name}Schema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('${entity.name.charAt(0).toUpperCase() + entity.name.slice(1)}', ${entity.name}Schema);
`;
    }

    private getDefaultMySQLSchema(entities: any[]): string {
        let schema = `-- MySQL Database Schema
-- Generated by Auto Dev System

`;

        for (const entity of entities) {
            schema += `-- ${entity.name} table
CREATE TABLE ${entity.name} (
`;

            for (let i = 0; i < entity.fields.length; i++) {
                const field = entity.fields[i];
                schema += `  ${field.name} ${field.type}`;

                if (field.constraints.length > 0) {
                    schema += ` ${field.constraints.join(' ')}`;
                }

                if (i < entity.fields.length - 1) {
                    schema += ',';
                }
                schema += '\n';
            }

            schema += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

`;
        }

        // 인덱스 생성
        schema += `-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);

`;

        // 트리거 생성
        schema += `-- Triggers for updated_at
DELIMITER $$

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;
`;

        return schema;
    }

    private async generateSQLMigration(entities: any[], goal: Goal, database: string): Promise<string> {
        return `-- ${database} Migration: Initial Schema
-- Generated by Auto Dev System

${this.getDefaultPostgreSQLSchema(entities)}
`;
    }

    private async generateMongoDBMigration(entities: any[], goal: Goal): Promise<string> {
        return `const mongoose = require('mongoose');

// MongoDB Migration: Initial Schema
// Generated by Auto Dev System

const runMigration = async () => {
  try {
    // TODO: 마이그레이션 로직 구현
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

module.exports = runMigration;
`;
    }

    private async generateSQLSeed(entities: any[], goal: Goal): Promise<string> {
        return `-- Database Seed Data
-- Generated by Auto Dev System

-- Insert sample users
INSERT INTO users (email, password_hash, name) VALUES
('admin@example.com', '$2b$10$example', 'Admin User'),
('user@example.com', '$2b$10$example', 'Regular User');

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Technology', 'Technology related posts'),
('Business', 'Business related posts'),
('Lifestyle', 'Lifestyle related posts');
`;
    }

    private async generateMongoDBSeed(entities: any[], goal: Goal): Promise<string> {
        return `const mongoose = require('mongoose');

// MongoDB Seed Data
// Generated by Auto Dev System

const seedData = async () => {
  try {
    // TODO: 시드 데이터 삽입 로직 구현
    console.log('Seed data inserted successfully');
  } catch (error) {
    console.error('Seed data insertion failed:', error);
    throw error;
  }
};

module.exports = seedData;
`;
    }

    private async generateSQLModel(entity: any, techStack: TechStack): Promise<string> {
        return `const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ${entity.name.charAt(0).toUpperCase() + entity.name.slice(1)} = sequelize.define('${entity.name}', {
  // TODO: 모델 필드 정의
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: '${entity.name}'
});

module.exports = ${entity.name.charAt(0).toUpperCase() + entity.name.slice(1)};
`;
    }

    private async generateMongoDBModel(entity: any, techStack: TechStack): Promise<string> {
        return this.getDefaultMongoDBSchema(entity);
    }

    private async generateIndexContent(entities: any[], goal: Goal, database: string): Promise<string> {
        return `-- Database Indexes
-- Generated by Auto Dev System

-- Performance optimization indexes
${entities.map(entity => {
            if (entity.name === 'users') {
                return `CREATE INDEX idx_${entity.name}_email ON ${entity.name}(email);
CREATE INDEX idx_${entity.name}_created_at ON ${entity.name}(created_at);`;
            } else if (entity.name === 'posts') {
                return `CREATE INDEX idx_${entity.name}_author_id ON ${entity.name}(author_id);
CREATE INDEX idx_${entity.name}_created_at ON ${entity.name}(created_at);
CREATE INDEX idx_${entity.name}_status ON ${entity.name}(status);
CREATE INDEX idx_${entity.name}_title ON ${entity.name}(title);`;
            } else if (entity.name === 'comments') {
                return `CREATE INDEX idx_${entity.name}_post_id ON ${entity.name}(post_id);
CREATE INDEX idx_${entity.name}_author_id ON ${entity.name}(author_id);
CREATE INDEX idx_${entity.name}_created_at ON ${entity.name}(created_at);`;
            }
            return '';
        }).filter(Boolean).join('\n\n')}

-- Composite indexes for common queries
CREATE INDEX idx_posts_author_status ON posts(author_id, status);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at);
`;
    }

    private generateConnectionConfig(database: string): string {
        if (database === 'PostgreSQL') {
            return `const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
`;
        } else if (database === 'MongoDB') {
            return `const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
`;
        } else if (database === 'MySQL') {
            return `const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
`;
        } else {
            return `// Database connection configuration
// TODO: Implement database connection
module.exports = {};
`;
        }
    }

    private generateEnvConfig(database: string): string {
        if (database === 'PostgreSQL') {
            return `# PostgreSQL Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DB_HOST=localhost
DB_PORT=5432
DB_NAME=database_name
DB_USER=username
DB_PASSWORD=password
`;
        } else if (database === 'MongoDB') {
            return `# MongoDB Database Configuration
MONGODB_URI=mongodb://localhost:27017/database_name
DB_HOST=localhost
DB_PORT=27017
DB_NAME=database_name
`;
        } else if (database === 'MySQL') {
            return `# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=database_name
DB_USER=root
DB_PASSWORD=password
`;
        } else {
            return `# Database Configuration
# TODO: Configure database connection
`;
        }
    }

    /**
     * 파일들을 디스크에 쓰기
     */
    private async writeFilesToDisk(files: CodeFile[], projectStructure: any): Promise<void> {
        for (const file of files) {
            const filePath = path.join(this.outputDir, projectStructure.name, file.path);
            const dirPath = path.dirname(filePath);

            // 디렉토리 생성
            await fs.mkdir(dirPath, { recursive: true });

            // 파일 쓰기
            await fs.writeFile(filePath, file.content, 'utf-8');
        }
    }

    /**
     * 코드 복잡도 계산
     */
    private calculateComplexity(content: string): number {
        const lines = content.split('\n').length;
        const tables = (content.match(/CREATE TABLE/g) || []).length;
        const indexes = (content.match(/CREATE INDEX/g) || []).length;
        const functions = (content.match(/function|=>/g) || []).length;

        return Math.min(10, Math.max(1, (lines / 50) + (tables / 5) + (indexes / 10) + (functions / 10)));
    }

    /**
     * 코드 품질 계산
     */
    private calculateQuality(content: string): number {
        let score = 5; // 기본 점수

        // 인덱스 확인
        if (content.includes('CREATE INDEX')) score += 1;

        // 외래키 확인
        if (content.includes('REFERENCES')) score += 1;

        // 트리거 확인
        if (content.includes('TRIGGER')) score += 1;

        // 제약조건 확인
        if (content.includes('NOT NULL') || content.includes('UNIQUE')) score += 1;

        // 주석 확인
        if (content.includes('--') || content.includes('/*')) score += 1;

        return Math.min(10, Math.max(1, score));
    }

    /**
     * 고유 ID 생성
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
