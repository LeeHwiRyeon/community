import React, { useState } from 'react';
import { apiService } from '../api';

interface ContentTesterProps {
    className?: string;
}

export const ContentTester: React.FC<ContentTesterProps> = ({ className = '' }) => {
    const [testResults, setTestResults] = useState<Array<{ test: string; status: 'pending' | 'success' | 'error'; message?: string }>>([]);
    const [isRunning, setIsRunning] = useState(false);

    const addResult = (test: string, status: 'pending' | 'success' | 'error', message?: string) => {
        setTestResults(prev => [...prev, { test, status, message }]);
    };

    const runContentTests = async () => {
        setIsRunning(true);
        setTestResults([]);

        try {
            // 1. 게시판 데이터 로딩 테스트
            addResult('Boards Loading', 'pending');
            try {
                const boardsResponse = await apiService.getBoards();
                if (boardsResponse && Array.isArray(boardsResponse)) {
                    addResult('Boards Loading', 'success', `${boardsResponse.length} boards loaded`);
                } else {
                    addResult('Boards Loading', 'error', 'Invalid boards response format');
                }
            } catch (error) {
                addResult('Boards Loading', 'error', `Failed to load boards: ${error}`);
            }

            // 2. 뉴스 게시물 로딩 테스트 (첫 번째 뉴스 게시물)
            addResult('News Post Loading', 'pending');
            try {
                const newsPost = await apiService.getPost('news-fallback-1');
                if (newsPost && newsPost.id) {
                    addResult('News Post Loading', 'success', `News post "${newsPost.title}" loaded`);
                } else {
                    addResult('News Post Loading', 'error', 'Invalid news post response');
                }
            } catch (error) {
                addResult('News Post Loading', 'error', `Failed to load news post: ${error}`);
            }

            // 3. 게시물 검색 테스트
            addResult('Posts Search', 'pending');
            try {
                const searchResponse = await apiService.searchPosts('test');
                if (searchResponse && typeof searchResponse === 'object') {
                    addResult('Posts Search', 'success', `${searchResponse.count || 0} search results found`);
                } else {
                    addResult('Posts Search', 'error', 'Invalid search response');
                }
            } catch (error) {
                addResult('Posts Search', 'error', `Search failed: ${error}`);
            }

            // 4. 커뮤니티 데이터 로딩 테스트
            addResult('Communities Loading', 'pending');
            try {
                const communitiesResponse = await apiService.getCommunities();
                if (communitiesResponse && Array.isArray(communitiesResponse)) {
                    addResult('Communities Loading', 'success', `${communitiesResponse.length} communities loaded`);
                } else {
                    addResult('Communities Loading', 'error', 'Invalid communities response');
                }
            } catch (error) {
                addResult('Communities Loading', 'error', `Communities loading failed: ${error}`);
            }

        } catch (error) {
            addResult('General Error', 'error', `Unexpected error: ${error}`);
        } finally {
            setIsRunning(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'text-green-600';
            case 'error': return 'text-red-600';
            case 'pending': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'pending': return '⏳';
            default: return '❓';
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">콘텐츠 테스터</h3>
                <button
                    onClick={runContentTests}
                    disabled={isRunning}
                    className={`px-4 py-2 rounded-md font-medium ${isRunning
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    {isRunning ? '테스트 실행 중...' : '콘텐츠 테스트 실행'}
                </button>
            </div>

            <div className="space-y-2">
                {testResults.length === 0 && !isRunning && (
                    <p className="text-gray-500 text-center py-4">
                        테스트를 실행하려면 위 버튼을 클릭하세요
                    </p>
                )}

                {testResults.map((result, index) => (
                    <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-md border ${result.status === 'success' ? 'bg-green-50 border-green-200' :
                                result.status === 'error' ? 'bg-red-50 border-red-200' :
                                    'bg-yellow-50 border-yellow-200'
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            <span className="text-lg">{getStatusIcon(result.status)}</span>
                            <span className={`font-medium ${getStatusColor(result.status)}`}>
                                {result.test}
                            </span>
                        </div>
                        {result.message && (
                            <span className="text-sm text-gray-600">{result.message}</span>
                        )}
                    </div>
                ))}
            </div>

            {testResults.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                        <span>총 테스트: {testResults.length}</span>
                        <span>성공: {testResults.filter(r => r.status === 'success').length}</span>
                        <span>실패: {testResults.filter(r => r.status === 'error').length}</span>
                    </div>
                </div>
            )}
        </div>
    );
};